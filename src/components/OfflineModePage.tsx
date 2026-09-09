import React, { useState, useEffect } from 'react';
import { HardDrive, ArrowLeft, Database, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { offlineModeManager, offlineUtils } from '../utils/offline';
import * as indexedDB from '../utils/indexedDB';
import Dashboard from './Dashboard';
import FileDropZone from './FileDropZone';
import { User } from '../types';

interface OfflineModePageProps {
  onExit: () => void;
}

const OfflineModePage: React.FC<OfflineModePageProps> = ({ onExit }) => {
  const [hasData, setHasData] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);

  const offlineUser: User = {
    id: 'offline_user',
    username: '离线模式',
    token: 'offline_token'
  };

  useEffect(() => {
    const checkOfflineData = async () => {
      try {
        const count = await offlineModeManager.getOfflineDataCount();
        setDataCount(count);
        setHasData(count > 0);

        // 如果有数据，直接进入 Dashboard
        if (count > 0) {
          setShowDashboard(true);
        }
      } catch (error) {
        console.error('Failed to check offline data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOfflineData();
  }, []);

  const handleDataImported = async (count: number) => {
    // 重新检查数据状态
    const newCount = await offlineModeManager.getOfflineDataCount();
    setDataCount(newCount);
    setHasData(newCount > 0);

    // 导入成功后折叠导入区域
    if (count > 0) {
      setShowImportSection(false);
    }

    if (newCount > 0) {
      setShowDashboard(true);
    }
  };

  const handleEnterDashboard = () => {
    setShowDashboard(true);
  };

  const handleBackToOfflineHome = () => {
    setShowDashboard(false);
  };

  const handleExit = () => {
    offlineModeManager.setOfflineMode(false);
    onExit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  // 如果已经有数据且用户选择查看，显示 Dashboard
  if (showDashboard) {
    return (
      <Dashboard
        user={offlineUser}
        onLogout={handleExit}
        onUserChange={() => {}} // 离线模式下不需要用户切换
        isOfflineMode={true}
      />
    );
  }

  // 离线模式首页
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-48 h-48 bg-slate-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-32 w-64 h-64 bg-stone-200/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-neutral-200/25 rounded-full blur-2xl"></div>
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <HardDrive className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900">离线模式</h1>
              </div>

              <button
                onClick={handleExit}
                className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回登录
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom-4 duration-700">
            {/* Status Card */}
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 transition-all duration-300 hover:shadow-3xl">
              <div className="text-center mb-10">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <HardDrive className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-slate-800 mb-4">离线数据管理</h2>
                <p className="text-slate-600 text-lg">管理和查看本机保存的翻牌数据</p>
              </div>

              {/* Data Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-in slide-in-from-left-4 duration-500">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900 mb-3 text-lg">本地数据状态</h3>

                      {hasData ? (
                        <div className="flex items-center text-emerald-600 mb-3">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">找到 {dataCount} 条记录</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600 mb-3">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">暂无本地数据</span>
                        </div>
                      )}

                      <p className="text-sm text-emerald-800">
                        {hasData
                          ? '您可以查看、搜索和导出这些数据'
                          : '请导入数据文件以开始使用离线功能'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-in slide-in-from-right-4 duration-500 delay-100">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <HardDrive className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-cyan-900 mb-3 text-lg">离线功能</h3>
                      <ul className="text-sm text-cyan-800 space-y-2">
                        <li>• 导入 JSON 和 SQLite 数据文件</li>
                        <li>• 搜索和过滤本地数据</li>
                        <li>• 导出为多种格式（PDF、CSV、HTML等）</li>
                        <li>• 无需网络连接即可使用</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-4 duration-500 delay-200">
                {hasData && (
                  <button
                    onClick={handleEnterDashboard}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    查看数据 ({dataCount} 条)
                  </button>
                )}

                <button
                  onClick={() => setShowImportSection(!showImportSection)}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-700 hover:to-blue-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  导入数据
                  {showImportSection ? (
                    <ChevronUp className="w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-2" />
                  )}
                </button>

                <button
                  onClick={handleExit}
                  className="px-8 py-4 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  退出离线模式
                </button>
              </div>
            </div>

            {/* Collapsible File Import Section */}
            {showImportSection && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <FileDropZone
                  onImportComplete={handleDataImported}
                  isOfflineMode={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-lg border-t border-white/20 p-4">
          <div className="text-center text-sm text-slate-500">
            离线模式 - 所有数据仅存储在本地设备上
          </div>
        </footer>
      </div>
    </div>
  );
};

export default OfflineModePage;
