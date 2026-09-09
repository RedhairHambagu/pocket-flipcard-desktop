import React, { useState } from 'react';
import { apiUtils } from '../utils/api';
import { authUtils } from '../utils/auth';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface DataSyncProps {
  onSyncComplete: () => void;
}

const DataSync: React.FC<DataSyncProps> = ({ onSyncComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncProgress(0);
    setErrorMessage('');
    
try {
      console.log('Starting data sync...');
      
      const syncedCount = await apiUtils.syncData(
        (current, total) => {
          console.log(`Sync progress: ${current}/${total}`);
          setSyncProgress(current);
          setSyncTotal(total);
        }
      );
      
      console.log('Sync completed, total items:', syncedCount);
      
      setSyncStatus('success');
      onSyncComplete();
      
      // 3秒后重置状态
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('数据同步失败:', error);
      setSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <RefreshCw size={14} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">数据同步</h3>
          {syncStatus === 'success' && (
            <div className="ml-4 flex items-center">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="ml-2 text-sm font-medium text-emerald-600">同步完成</span>
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="ml-4 flex items-center">
              <AlertCircle size={16} className="text-rose-600" />
              <span className="ml-2 text-sm font-medium text-rose-600">同步失败</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`flex items-center px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 ${
            isSyncing
              ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105'
          }`}
        >
          <RefreshCw size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? '同步中...请等待' : '一键同步'}
        </button>
      </div>
      
      {syncStatus === 'syncing' && (
        <div className="mt-4 space-y-3">
          <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${syncTotal > 0 ? (syncProgress / syncTotal) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-sm font-medium text-slate-600 text-right">
            已同步 {syncProgress} 条数据
          </p>
        </div>
      )}

      {(syncStatus === 'success' || syncStatus === 'error') && (
        <div className="mt-4 p-3 rounded-lg bg-slate-50">
          <p className="text-sm font-medium text-slate-700">
            {syncStatus === 'success'
              ? `数据同步完成！共同步 ${syncProgress} 条数据。`
              : (errorMessage || '数据同步失败，请重试。')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataSync;