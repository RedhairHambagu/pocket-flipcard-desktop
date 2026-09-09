import React, { useState, useCallback } from 'react';
import { Upload, FileText, Database, AlertCircle, CheckCircle, X } from 'lucide-react';
import { exportUtils } from '../utils/export';

interface FileDropZoneProps {
  onImportComplete?: (count: number) => void;
  isOfflineMode?: boolean;
}

interface ImportResult {
  success: boolean;
  count?: number;
  message: string;
  file: File;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onImportComplete, isOfflineMode = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedFiles = files.filter(file =>
      file.name.endsWith('.json') ||
      file.name.endsWith('.sql') ||
      file.name.endsWith('.sqlite')
    );

    if (supportedFiles.length === 0) {
      alert('请拖拽 JSON 或 SQLite 文件');
      return;
    }

    setIsProcessing(true);
    setImportResults([]);

    try {
      const results: ImportResult[] = [];

      for (const file of supportedFiles) {
        try {
          let count = 0;
          let success = false;

          if (file.name.endsWith('.json')) {
            count = await exportUtils.importFromJSON(file);
            success = true;
          } else if (file.name.endsWith('.sql') || file.name.endsWith('.sqlite')) {
            count = await exportUtils.importFromSQLite(file);
            success = true;
          }

          results.push({
            success,
            count,
            message: `成功导入 ${count} 条记录`,
            file
          });
        } catch (error) {
          results.push({
            success: false,
            message: error instanceof Error ? error.message : '导入失败',
            file
          });
        }
      }

      setImportResults(results);
      setShowResults(true);

      // 计算总成功导入数量
      const totalCount = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.count || 0), 0);

      if (totalCount > 0 && onImportComplete) {
        onImportComplete(totalCount);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('导入过程中发生错误');
    } finally {
      setIsProcessing(false);
    }
  }, [onImportComplete]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // 模拟拖拽事件
    const fakeEvent = {
      preventDefault: () => {},
      dataTransfer: { files }
    } as any;

    await handleDrop(fakeEvent);

    // 清空文件输入
    e.target.value = '';
  }, [handleDrop]);

  const clearResults = () => {
    setImportResults([]);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">导入结果</h3>
          </div>
          <button
            onClick={clearResults}
            className="p-2 text-slate-400 hover:text-slate-600 transition-all duration-200 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {importResults.map((result, index) => (
            <div
              key={index}
              className={`flex items-start p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                result.success
                  ? 'border-emerald-200/50 bg-gradient-to-r from-emerald-50 to-teal-50'
                  : 'border-rose-200/50 bg-gradient-to-r from-rose-50 to-pink-50'
              }`}
            >
              <div className="flex-shrink-0 mr-4">
                {result.success ? (
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold mb-1 ${
                  result.success ? 'text-emerald-800' : 'text-rose-800'
                }`}>
                  {result.file.name}
                </p>
                <p className={`text-sm font-medium ${
                  result.success ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
          <p className="text-sm font-medium text-slate-700 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            💡 数据已导入到本地存储，您可以立即查看和使用这些数据
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 animate-in slide-in-from-bottom-4">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">
          {isOfflineMode ? '离线数据导入' : '文件导入'}
        </h3>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 group ${
          isDragOver
            ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg scale-[1.02]'
            : 'border-slate-300 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100/50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
            isDragOver
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 scale-110'
              : 'bg-gradient-to-r from-slate-400 to-slate-500 group-hover:from-emerald-400 group-hover:to-teal-400'
          }`}>
            <Upload className={`w-8 h-8 text-white transition-transform duration-300 ${
              isDragOver ? 'scale-110' : 'group-hover:scale-105'
            }`} />
          </div>

          <div>
            <p className="text-xl font-bold text-slate-800 mb-3">
              {isProcessing ? '正在处理文件...' : '拖拽文件到此处导入'}
            </p>
            <p className="text-sm font-medium text-slate-600 mb-6">
              支持 JSON 和 SQLite (.sql) 格式的数据文件
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <label className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
              <input
                type="file"
                multiple
                accept=".json,.sql,.sqlite"
                onChange={handleFileInput}
                className="hidden"
                disabled={isProcessing}
              />
              选择文件
            </label>
            <span className="text-sm font-medium text-slate-500">或拖拽到此处</span>
          </div>

          <div className="flex items-center space-x-8 text-sm">
            <div className="flex items-center bg-slate-100 px-3 py-2 rounded-lg">
              <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center mr-2">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-slate-700">JSON</span>
            </div>
            <div className="flex items-center bg-slate-100 px-3 py-2 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                <Database className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-slate-700">SQLite</span>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
              <p className="text-sm font-medium text-emerald-600">正在处理文件...</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl">
        <p className="text-sm font-bold text-amber-800 mb-3 flex items-center">
          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
          📋 导入说明：
        </p>
        <ul className="text-xs font-medium text-amber-700 space-y-2">
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            支持导入之前导出的 JSON 和 SQLite 格式数据
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            重复数据将被自动跳过或更新
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            导入的数据会保存到本地存储中
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            大文件可能需要较长处理时间
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FileDropZone;