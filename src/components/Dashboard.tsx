import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Download, Calendar, Search, Filter, TrendingUp, BarChart3, Settings, FileText, Info, Upload, Database, Trash2, ChevronDown, ChevronUp, HardDriveDownload } from 'lucide-react';
import { authUtils } from '../utils/auth';
import { apiUtils } from '../utils/api';
import { exportUtils } from '../utils/export';
import * as indexedDB from '../utils/indexedDB';
import { DataItem, DateRange, Statistics, User } from '../types';
import DataList from './DataList';
import DateFilter from './DateFilter';
import SearchBar from './SearchBar';
import StatisticsPanel from './StatisticsPanel';
import AccountSwitcher from './AccountSwitcher';
import DataSync from './DataSync';
import TagFilter from './TagFilter';
import ContentTypeFilter from './ContentTypeFilter';
import StarNameFilter from './StarNameFilter';
import { ChangelogModal } from './ChangelogModal';
import FileDropZone from './FileDropZone';
import { VERSION_INFO } from '../config/version';
import { cacheMedia, isTauriDesktop, removeCachedMedia } from '../utils/desktop';
import { eraseAllLocalApplicationData } from '../utils/localData';
import { quitDesktopApp } from '../utils/desktop';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUserChange: (user: User) => void;
  isOfflineMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUserChange, isOfflineMode = false }) => {
  const [currentUser, setCurrentUser] = useState<User>(user);

  // 当传入的 user prop 更新时，同步更新 currentUser 状态
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportingSQLite, setExportingSQLite] = useState(false);
  const [exportingHTML, setExportingHTML] = useState(false);
  const [exportingMedia, setExportingMedia] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cachingMedia, setCachingMedia] = useState(false);
  const [mediaCacheProgress, setMediaCacheProgress] = useState({ completed: 0, total: 0, failed: 0 });
  const [mediaCacheConfirmOpen, setMediaCacheConfirmOpen] = useState(false);
  const [mediaCacheStatus, setMediaCacheStatus] = useState<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle');
  const [mediaCacheMessage, setMediaCacheMessage] = useState('');
  const [erasingAllData, setErasingAllData] = useState(false);
  const [eraseConfirmStep, setEraseConfirmStep] = useState<'idle' | 'first' | 'final'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialLoadTriggered, setInitialLoadTriggered] = useState(false); // 新增：是否已触发初始加载
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedStarName, setSelectedStarName] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);
  const [showStatisticsSettings, setShowStatisticsSettings] = useState(false);
  const [statisticsSettings, setStatisticsSettings] = useState({
    showCostStats: false,
    showStarStats: false
  });
  const [showImportSection, setShowImportSection] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const hideDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const loadOfflineData = useCallback(async () => {
    setLoading(true);
    try {
      const offlineData = await apiUtils.fetchFromCache(searchTerm, dateRange, selectedTag, selectedContentTypes, selectedStarName);
      setData(offlineData);
      setHasMore(false); // 离线模式下没有更多数据
      setStatistics(apiUtils.generateStatistics(offlineData));
    } catch (error) {
      console.error('Failed to load offline data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, dateRange, selectedTag, selectedContentTypes, selectedStarName]);

const loadData = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    // 如果是离线模式，使用离线数据加载
    if (isOfflineMode) {
      await loadOfflineData();
      return;
    }

    setLoading(true);
    try {
      const result = await apiUtils.fetchData(pageNum, 10, searchTerm, dateRange, selectedTag, selectedContentTypes, undefined, selectedStarName);

      if (reset) {
        setData(result.data);
      } else {
        setData(prev => [...prev, ...result.data]);
      }

      setHasMore(result.hasMore);

      // 生成统计信息
      const allData = reset ? result.data : [...data, ...result.data];
      setStatistics(apiUtils.generateStatistics(allData));
    } catch (error) {
      console.error('Failed to load data:', error);
      // 可以添加错误提示
    } finally {
      setLoading(false);
    }
  }, [searchTerm, dateRange, selectedTag, selectedContentTypes, selectedStarName, data, isOfflineMode, loadOfflineData]);

  const handleInitialLoad = () => {
    setInitialLoadTriggered(true);
    setPage(1);
    loadData(1, true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, false);
  };

  const handleLogout = () => {
    authUtils.logout();
    onLogout();
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const filename = `数据导出_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportUtils.exportToPDF(data, filename);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const filename = `数据导出_${new Date().toISOString().slice(0, 10)}.csv`;
      await exportUtils.exportToCSV(data, filename);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportJSON = async () => {
    setExportingJSON(true);
    try {
      const filename = `数据导出_${new Date().toISOString().slice(0, 10)}.json`;
      await exportUtils.exportToJSON(data, filename);
    } catch (error) {
      console.error('JSON export failed:', error);
      alert('JSON导出失败，请重试');
    } finally {
      setExportingJSON(false);
    }
  };

  const handleExportSQLite = async () => {
    setExportingSQLite(true);
    try {
      const filename = `数据导出_${new Date().toISOString().slice(0, 10)}.sql`;
      await exportUtils.exportToSQLite(data, filename);
    } catch (error) {
      console.error('SQLite export failed:', error);
      alert('SQLite导出失败，请重试');
    } finally {
      setExportingSQLite(false);
    }
  };

  const handleExportHTML = async () => {
    // 询问用户是否启用本地文件支持
    const enableLocalFiles = window.confirm(
      '是否启用本地文件支持？\n\n' +
      '启用后，导出的HTML将支持加载本地媒体文件，适合配合"下载音频、视频"功能使用。\n\n' +
      '点击"确定"启用本地文件支持\n' +
      '点击"取消"使用标准导出'
    );

    setExportingHTML(true);
    try {
      const filename = `翻牌数据离线导出版_${new Date().toISOString().slice(0, 10)}.html`;
      await exportUtils.exportToStaticHTML(data, filename, enableLocalFiles);
    } catch (error) {
      console.error('HTML export failed:', error);
      alert('HTML导出失败，请重试');
    } finally {
      setExportingHTML(false);
    }
  };

  const handleExportMedia = async () => {
    setExportingMedia(true);
    try {
      await exportUtils.exportMediaFiles(data);
    } catch (error) {
      console.error('Media export failed:', error);
      alert('媒体文件导出失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setExportingMedia(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      let importedCount = 0;
      
      if (file.name.endsWith('.json')) {
        importedCount = await exportUtils.importFromJSON(file);
      } else if (file.name.endsWith('.sql') || file.name.endsWith('.sqlite')) {
        importedCount = await exportUtils.importFromSQLite(file);
      } else {
        throw new Error('不支持的文件格式。请选择 JSON 或 SQL 文件。');
      }

      alert(`成功导入 ${importedCount} 条数据`);
      
      // Refresh data after import
      setPage(1);
      loadData(1, true);
      
      // Auto refresh page after successful import
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearCache = async () => {
    const confirmed = confirm(
      '确定要清除当前账号的所有缓存数据和已下载音视频吗？\n\n' +
      '此操作不可撤销，建议在清除前先导出数据备份。\n\n' +
      '点击"确定"继续清除，点击"取消"中止操作。'
    );
    
    if (!confirmed) return;

    setClearingCache(true);
    try {
      // Get current user ID
      const currentUser = authUtils.getCurrentUser();
      const currentUserId = currentUser?.userId;
      
      // 先根据当前账号的记录删除对应媒体，避免留下无法从界面访问的文件。
      const cachedItems = await apiUtils.fetchFromCache();
      const mediaUrls = cachedItems.flatMap(item => [item.audioUrl, item.videoUrl]).filter((url): url is string => Boolean(url));
      await removeCachedMedia(mediaUrls);

      // Clear IndexedDB cache for current user
      await indexedDB.clearAllData(currentUserId);
      
      // Clear the current data display
      setData([]);
      setStatistics(null);
      setInitialLoadTriggered(false);
      
      alert('缓存清除成功！');
    } catch (error) {
      console.error('Clear cache failed:', error);
      alert('缓存清除失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setClearingCache(false);
    }
  };

  const handleCacheMedia = async () => {
    if (!isTauriDesktop()) {
      alert('媒体缓存仅能在桌面客户端中使用。');
      return;
    }

    setMediaCacheConfirmOpen(false);
    setCachingMedia(true);
    setMediaCacheStatus('loading');
    setMediaCacheMessage('正在读取已同步的数据…');
    setMediaCacheProgress({ completed: 0, total: 0, failed: 0 });
    try {
      const cachedItems = await apiUtils.fetchFromCache();
      const work = cachedItems.flatMap(item => {
        const entries: Array<{ item: DataItem; mediaType: 'audio' | 'video'; url: string }> = [];
        if (item.audioUrl) entries.push({ item, mediaType: 'audio', url: item.audioUrl });
        if (item.videoUrl) entries.push({ item, mediaType: 'video', url: item.videoUrl });
        return entries;
      });

      if (work.length === 0) {
        setMediaCacheStatus('error');
        setMediaCacheMessage('当前缓存中没有可下载的音视频，请先完成数据同步。');
        alert('当前缓存中没有可下载的音视频。请先完成数据同步。');
        return;
      }

      setMediaCacheStatus('running');
      setMediaCacheMessage(`准备下载 ${work.length} 个音视频…`);
      setMediaCacheProgress({ completed: 0, total: work.length, failed: 0 });
      let failed = 0;

      // 顺序下载，避免大量视频同时占用网络与磁盘空间。
      for (let index = 0; index < work.length; index++) {
        const entry = work[index];
        setMediaCacheMessage(`正在下载第 ${index + 1}/${work.length} 个${entry.mediaType === 'audio' ? '音频' : '视频'}…`);
        try {
          const cached = await cacheMedia(entry.item.id, entry.mediaType, entry.url);
          const updatedItem: DataItem = {
            ...entry.item,
            ...(entry.mediaType === 'audio' ? { localAudioPath: cached.path } : { localVideoPath: cached.path }),
          };
          await indexedDB.saveDataItem(updatedItem, currentUser?.userId);
          setData(previous => previous.map(item => item.id === updatedItem.id ? updatedItem : item));
        } catch (error) {
          failed++;
          console.error(`缓存${entry.mediaType}失败:`, error);
        }
        setMediaCacheProgress({ completed: index + 1, total: work.length, failed });
      }

      setMediaCacheStatus(failed === 0 ? 'done' : 'error');
      setMediaCacheMessage(failed === 0
        ? `已完成 ${work.length} 个音视频的本地缓存，断网也可以播放。`
        : `已完成 ${work.length - failed}/${work.length} 个音视频，失败 ${failed} 个。`
      );
      alert(failed === 0
        ? `已完成 ${work.length} 个音视频的本地缓存。现在断网也可以播放。`
        : `已完成 ${work.length - failed}/${work.length} 个音视频缓存，${failed} 个失败；可在网络恢复后再次点击重试。`
      );
    } catch (error) {
      console.error('Cache media failed:', error);
      setMediaCacheStatus('error');
      setMediaCacheMessage('缓存音视频失败：' + (error instanceof Error ? error.message : String(error)));
      alert('缓存音视频失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setCachingMedia(false);
    }
  };

  const handleEraseAllLocalData = async () => {
    setEraseConfirmStep('idle');
    setErasingAllData(true);
    try {
      await eraseAllLocalApplicationData();
      alert('应用内的账号数据、登录信息、设置和媒体缓存已清除，已导出的文件仍保留。应用将退出；随后可删除 Windows EXE，或将 macOS 应用移到废纸篓。');
      await quitDesktopApp();
      // 浏览器预览时没有原生退出命令，刷新后应回到无登录、无数据的初始状态。
      window.location.reload();
    } catch (error) {
      console.error('Erase all local data failed:', error);
      alert('未能完成彻底清除：' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setErasingAllData(false);
    }
  };


  const handleUserChange = (newUser: User) => {
    setCurrentUser(newUser);
    onUserChange(newUser); // 向上传递用户更改
  };

  const handleExportMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideDropdownTimeoutRef.current) {
      clearTimeout(hideDropdownTimeoutRef.current);
      hideDropdownTimeoutRef.current = null;
    }

    if (exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 2, // Reduced gap from 8px to 2px
        left: Math.max(8, rect.right - 224) // Ensure minimum 8px from screen edge
      });
      setShowExportDropdown(true);
    }
  };

  const handleExportMouseLeave = () => {
    // Add a small delay before hiding to allow mouse to move to dropdown
    hideDropdownTimeoutRef.current = setTimeout(() => {
      setShowExportDropdown(false);
    }, 150);
  };

  const handleSyncComplete = () => {
    // 同步完成后重新加载数据
    setInitialLoadTriggered(true);
    loadData(1, true);
  };

  // 从localStorage加载统计设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('statisticsSettings');
    if (savedSettings) {
      try {
        setStatisticsSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse statistics settings:', error);
      }
    }
  }, []);

  // 保存统计设置到localStorage
  useEffect(() => {
    localStorage.setItem('statisticsSettings', JSON.stringify(statisticsSettings));
  }, [statisticsSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideDropdownTimeoutRef.current) {
        clearTimeout(hideDropdownTimeoutRef.current);
      }
    };
  }, []);

  // 页面加载时从IndexedDB加载缓存数据
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        console.log('Loading cached data from IndexedDB...');
        const cachedData = await apiUtils.fetchFromCache(searchTerm, dateRange, selectedTag, selectedContentTypes, selectedStarName);
        if (cachedData.length > 0) {
          console.log(`Found ${cachedData.length} cached items`);
          setData(cachedData);
          setInitialLoadTriggered(true);
          
          // 安全地生成统计信息
          try {
            const stats = apiUtils.generateStatistics(cachedData);
            setStatistics(stats);
          } catch (statsError) {
            console.error('Failed to generate statistics:', statsError);
            setStatistics(null);
          }
        } else {
          console.log('No cached data found');
        }
      } catch (error) {
        console.error('Failed to load cached data:', error);
      }
    };

    loadCachedData();
  }, [searchTerm, dateRange, selectedTag, selectedContentTypes, selectedStarName]); // 当筛选条件改变时重新加载缓存数据

  // 当搜索条件或日期范围改变时，从IndexedDB重新筛选数据
  useEffect(() => {
    if (initialLoadTriggered && !loading) {
      const filterCachedData = async () => {
        try {
          const cachedData = await apiUtils.fetchFromCache(searchTerm, dateRange, selectedTag, selectedContentTypes, selectedStarName);
          setData(cachedData);
          
          // 安全地生成统计信息
          try {
            const stats = apiUtils.generateStatistics(cachedData);
            setStatistics(stats);
          } catch (statsError) {
            console.error('Failed to generate statistics during filtering:', statsError);
            setStatistics(null);
          }
        } catch (error) {
          console.error('Failed to filter cached data:', error);
        }
      };

      filterCachedData();
    }
  }, [searchTerm, dateRange, selectedTag, selectedContentTypes, selectedStarName, initialLoadTriggered, loading]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center min-w-0 flex-1 overflow-hidden">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0 ${
                isOfflineMode
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600'
              }`}>
                <BarChart3 size={16} className="sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-sm sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate min-w-0">
                翻牌工具{isOfflineMode && ' - 离线模式'}
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* 版本信息和更新日志 */}
              <button
                onClick={() => setShowChangelog(true)}
                className="flex items-center text-gray-600 hover:text-gray-700 font-medium text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                title="查看更新日志"
              >
                <Info size={14} className="mr-1" />
                v{VERSION_INFO.version}
              </button>
              
              {!isOfflineMode && (
                <AccountSwitcher
                  currentUser={currentUser}
                  onUserChange={handleUserChange}
                />
              )}
              <button
                onClick={() => setShowStatisticsSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="统计设置"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut size={14} className="mr-1" />
                {isOfflineMode ? '退出离线模式' : '退出'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-8">
        {/* Offline Mode Banner */}
        {isOfflineMode && (
          <div className="mb-8 bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <BarChart3 size={20} className="text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">离线模式已激活</span> - 您正在查看本地保存的数据，无法同步新数据或切换账号
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Data Sync Button - Hidden in offline mode */}
            {!isOfflineMode && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <DataSync onSyncComplete={handleSyncComplete} />
              </div>
            )}

            {!isOfflineMode && isTauriDesktop() && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center text-lg font-bold text-slate-800">
                      <HardDriveDownload size={18} className="mr-2 text-teal-600" />
                      缓存音视频，支持断网播放
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">下载当前账号已同步的音视频到应用管理的本地缓存。原有“导出”功能不受影响。</p>
                  </div>
                  <button
                    onClick={() => setMediaCacheConfirmOpen(true)}
                    disabled={cachingMedia}
                    className="flex shrink-0 items-center justify-center px-5 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 hover:scale-105"
                  >
                    <HardDriveDownload size={16} className={`mr-2 ${cachingMedia ? 'animate-pulse' : ''}`} />
                    {cachingMedia ? '缓存中...' : '下载音视频'}
                  </button>
                </div>
                {mediaCacheStatus !== 'idle' && (
                  <div className="mt-4">
                    <p className={`mb-2 text-sm ${mediaCacheStatus === 'error' ? 'text-rose-600' : mediaCacheStatus === 'done' ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {mediaCacheMessage}
                    </p>
                    {cachingMedia && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${mediaCacheProgress.total ? (mediaCacheProgress.completed / mediaCacheProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                    )}
                    <p className="mt-2 text-right text-sm text-slate-600">
                      {cachingMedia
                        ? `已处理 ${mediaCacheProgress.completed}/${mediaCacheProgress.total} 个媒体${mediaCacheProgress.failed ? `，失败 ${mediaCacheProgress.failed} 个` : ''}`
                        : mediaCacheStatus === 'done' ? '本次缓存已完成' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* File Import Section - Only visible in offline mode */}
            {isOfflineMode && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  onClick={() => setShowImportSection(!showImportSection)}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Upload size={20} className="text-blue-600 mr-3" />
                    <span className="font-medium text-blue-900">数据导入</span>
                  </div>
                  {showImportSection ? (
                    <ChevronUp size={20} className="text-blue-600" />
                  ) : (
                    <ChevronDown size={20} className="text-blue-600" />
                  )}
                </button>

                {showImportSection && (
                  <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
                    <FileDropZone
                      onImportComplete={(count) => {
                        console.log(`Imported ${count} items`);
                        // 导入完成后重新加载数据并折叠区域
                        loadOfflineData();
                        if (count > 0) {
                          setShowImportSection(false);
                        }
                      }}
                      isOfflineMode={isOfflineMode}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <SearchBar onSearch={setSearchTerm} />
                </div>
                <div className="flex flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base ${
                      showFilters
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800'
                    }`}
                  >
                    <Filter size={14} className="sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">筛选</span>
                  </button>

                  {/* Export Dropdown */}
                  <div
                    className="relative"
                    onMouseEnter={handleExportMouseEnter}
                    onMouseLeave={handleExportMouseLeave}
                  >
                    <button
                      ref={exportButtonRef}
                      className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
                    >
                      <Download size={14} className="sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">导出</span>
                    </button>
                  </div>

                  {/* Import Button */}
                  <button
                    onClick={handleImportClick}
                    disabled={importing}
                    className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
                  >
                    <Upload size={14} className="sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{importing ? '导入中...' : '导入缓存'}</span>
                  </button>

                  {/* Clear Cache Button */}
                  <button
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg sm:rounded-xl hover:from-rose-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
                    title="清除当前账号的所有缓存数据"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{clearingCache ? '清除中...' : '清除缓存'}</span>
                  </button>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.sql,.sqlite"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t space-y-6">
                  <DateFilter onDateRangeChange={setDateRange} />
                  {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <TagFilter 
                        selectedTag={selectedTag}
                        onTagChange={setSelectedTag}
                      />
                      <ContentTypeFilter 
                        selectedTypes={selectedContentTypes}
                        onTypeChange={setSelectedContentTypes}
                      />
                      <StarNameFilter 
                        selectedStarName={selectedStarName}
                        onStarNameChange={setSelectedStarName}
                        data={data}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Data List */}
            <DataList
              data={data}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onInitialLoad={handleInitialLoad}
              initialLoadTriggered={initialLoadTriggered}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {statistics && <StatisticsPanel statistics={statistics} settings={statisticsSettings} />}
          </div>
        </div>
      </div>
      
      {/* 更新日志模态框 */}
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)} 
      />
      
      {/* 统计设置模态框 */}
      {showStatisticsSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">统计设置</h3>
              <button
                onClick={() => setShowStatisticsSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCostStats"
                  checked={statisticsSettings.showCostStats}
                  onChange={(e) => setStatisticsSettings(prev => ({
                    ...prev,
                    showCostStats: e.target.checked
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showCostStats" className="text-sm text-gray-700">
                  显示鸡腿统计
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showStarStats"
                  checked={statisticsSettings.showStarStats}
                  onChange={(e) => setStatisticsSettings(prev => ({
                    ...prev,
                    showStarStats: e.target.checked
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showStarStats" className="text-sm text-gray-700">
                  显示偶像分组统计
                </label>
              </div>

              {isTauriDesktop() && (
                <div className="mt-6 border-t border-rose-100 pt-5">
                  <h4 className="text-sm font-semibold text-rose-700">危险操作</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    彻底清除所有账号数据、登录信息、设置和应用内媒体缓存。已导出的文件不会被删除。
                  </p>
                  <button
                    type="button"
                    onClick={() => setEraseConfirmStep('first')}
                    disabled={erasingAllData}
                    className="mt-3 w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {erasingAllData ? '正在彻底清除…' : '彻底清除本机数据并退出'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowStatisticsSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {eraseConfirmStep !== 'idle' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-700">彻底清除本机数据</h3>
            {eraseConfirmStep === 'first' ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                这会删除所有账号数据、登录状态、设置和应用内音视频缓存，且无法恢复。<br />
                已导出的备份和媒体文件不会被删除。
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                请再次确认：清理完成后应用会立即退出，之后需要重新登录。<br />
                是否继续？
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEraseConfirmStep('idle')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => eraseConfirmStep === 'first' ? setEraseConfirmStep('final') : void handleEraseAllLocalData()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                {eraseConfirmStep === 'first' ? '继续' : '确认清除并退出'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mediaCacheConfirmOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-teal-700">下载音视频到本机</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              将下载当前账号已同步的音频和视频，之后断网也能播放。<br />
              媒体文件可能较大，建议在 Wi-Fi 环境下进行。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMediaCacheConfirmOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleCacheMedia()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                开始下载
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal-based Export Dropdown */}
      {showExportDropdown && createPortal(
        <div
          onMouseEnter={() => {
            // Clear any pending hide timeout when mouse enters dropdown
            if (hideDropdownTimeoutRef.current) {
              clearTimeout(hideDropdownTimeoutRef.current);
              hideDropdownTimeoutRef.current = null;
            }
            setShowExportDropdown(true);
          }}
          onMouseLeave={handleExportMouseLeave}
          className="w-56 bg-white backdrop-blur-lg rounded-xl shadow-2xl border border-slate-200 transition-all duration-200"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 99999,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="p-2">
            <button
              onClick={handleExportCSV}
              disabled={exportingCSV || data.length === 0}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center rounded-lg transition-all duration-200"
            >
              <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center mr-3">
                <FileText size={12} className="text-white" />
              </div>
              {exportingCSV ? '导出CSV中...' : '导出为CSV'}
            </button>
            <button
              onClick={handleExportJSON}
              disabled={exportingJSON || data.length === 0}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between rounded-lg transition-all duration-200"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-teal-500 rounded-md flex items-center justify-center mr-3">
                  <FileText size={12} className="text-white" />
                </div>
                {exportingJSON ? '导出JSON中...' : '导出为JSON'}
              </div>
              <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-md font-medium">推荐</span>
            </button>
            <button
              onClick={handleExportSQLite}
              disabled={exportingSQLite || data.length === 0}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center rounded-lg transition-all duration-200"
            >
              <div className="w-6 h-6 bg-cyan-500 rounded-md flex items-center justify-center mr-3">
                <Database size={12} className="text-white" />
              </div>
              {exportingSQLite ? '导出SQLite中...' : '导出为SQLite'}
            </button>
            <button
              onClick={handleExportHTML}
              disabled={exportingHTML || data.length === 0}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between rounded-lg transition-all duration-200"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                  <FileText size={12} className="text-white" />
                </div>
                {exportingHTML ? '导出HTML中...' : '导出为离线HTML'}
              </div>
              <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-md font-medium">推荐</span>
            </button>
            <div className="border-t border-slate-200 my-2"></div>
            <button
              onClick={handleExportMedia}
              disabled={exportingMedia || data.length === 0}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-start justify-between rounded-lg transition-all duration-200"
            >
              <div className="flex items-center flex-1 pr-2">
                <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                  <Download size={12} className="text-white" />
                </div>
                <span className="leading-tight">
                  {exportingMedia ? '下载音频、视频文件中...' : '下载音频、视频(aac,mp4)'}
                </span>
              </div>
              <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 self-start mt-0.5">推荐</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
