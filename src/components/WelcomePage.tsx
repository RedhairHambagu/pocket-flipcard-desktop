import React, { useState } from 'react';
import { Info, Database, Trash2, Chrome, RefreshCw, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { VERSION_INFO, CHANGELOG, ChangelogEntry } from '../config/version';

interface WelcomePageProps {
  onContinue: () => void;
}

const ChangelogItem: React.FC<{ entry: ChangelogEntry }> = ({ entry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-green-100 text-green-800';
      case 'bugfix': return 'bg-red-100 text-red-800';
      case 'improvement': return 'bg-blue-100 text-blue-800';
      case 'breaking': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTypeText = (type: string) => {
    switch (type) {
      case 'feature': return '新功能';
      case 'bugfix': return '问题修复';
      case 'improvement': return '改进优化';
      case 'breaking': return '重大变更';
      default: return '其他';
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-left"
      >
        <div>
          <h4 className="font-semibold text-gray-900">版本 {entry.version}</h4>
          <p className="text-sm text-gray-600">{entry.date}</p>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-white">
          <div className="space-y-2">
            {entry.changes.map((change, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(change.type)}`}>
                  {getTypeText(change.type)}
                </span>
                <p className="text-sm text-gray-700 flex-1">{change.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const WelcomePage: React.FC<WelcomePageProps> = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-48 h-48 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-32 w-64 h-64 bg-teal-200/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-cyan-200/25 rounded-full blur-2xl"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 max-w-4xl w-full relative animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Info className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            欢迎使用 口袋翻牌 数据导出工具
          </h1>
          <p className="text-slate-600 text-lg mb-4">
            安全、便捷地管理和导出您的翻牌数据
          </p>
          <div className="bg-slate-100 px-4 py-2 rounded-full inline-flex items-center space-x-2 text-sm text-slate-700">
            <span>版本 {VERSION_INFO.version}</span>
            <span>•</span>
            <span>{VERSION_INFO.releaseDate}</span>
          </div>
        </div>

        {/* 功能特性网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 数据存储说明 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 mb-3 text-lg">数据存储说明</h3>
                <ul className="text-sm text-emerald-800 space-y-2">
                  <li>• 所有数据存储在浏览器本地缓存中（IndexedDB）</li>
                  <li>• 数据不会上传到任何服务器，确保您的隐私安全</li>
                  <li>• 支持离线浏览已同步的数据</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 清空数据说明 */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-in slide-in-from-right-4 duration-500 delay-100">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-3 text-lg">清空数据方式</h3>
                <ul className="text-sm text-orange-800 space-y-2">
                  <li>• 更换浏览器或使用无痕模式</li>
                  <li>• 清除浏览器数据：开发者工具 → Application → IndexedDB</li>
                  <li>• 清除浏览器缓存和存储数据</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 使用建议 */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-in slide-in-from-left-4 duration-500 delay-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <Chrome className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-teal-900 mb-3 text-lg">使用建议</h3>
                <ul className="text-sm text-teal-800 space-y-2">
                  <li>• 建议使用 Chrome、Edge 等现代浏览器以获得最佳体验</li>
                  <li>• 首次使用需要登录并同步数据</li>
                  <li>• 定期导出重要数据以防丢失</li>
                  <li>• 手机号登录不要频繁请求</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 功能特性 */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-in slide-in-from-right-4 duration-500 delay-300">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-cyan-900 mb-3 text-lg">主要功能</h3>
                <ul className="text-sm text-cyan-800 space-y-2">
                  <li>• 数据同步：从 口袋 同步最新翻牌数据</li>
                  <li>• 智能搜索：支持内容、用户名等多维度搜索</li>
                  <li>• 分类筛选：按日期、标签、内容类型筛选</li>
                  <li>• 统计分析：查看数据统计和趋势分析</li>
                  <li>• 多格式导出：CSV、JSON、SQL 格式导出，aac MP4文件一键打包下载</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 更新日志 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 animate-in slide-in-from-bottom-4 duration-500 delay-400">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="w-full">
              <h3 className="font-semibold text-amber-900 mb-4 text-lg">更新日志</h3>
              <div className="space-y-3">
                {CHANGELOG.slice(0, 3).map((entry, index) => (
                  <ChangelogItem key={index} entry={entry} />
                ))}
              </div>
              {CHANGELOG.length > 3 && (
                <p className="text-xs text-amber-700 mt-3">
                  更多版本历史请在应用内查看完整更新日志
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center animate-in slide-in-from-bottom-4 duration-500 delay-500">
          <button
            onClick={onContinue}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-lg"
          >
            开始使用
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {/* 隐私声明 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-slate-700">
                <p className="font-medium mb-1">隐私保护承诺</p>
                <p>数据仅在本地缓存，不会上传到服务器，不会被记录在系统日志中。您的隐私数据安全。</p>
              </div>
            </div>
          </div>

          {/* 反馈渠道 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-center text-sm text-slate-500">
              <p className="mb-2">
                <span className="text-slate-600 font-medium">💬 问题反馈与建议：</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <a href="https://pome.vip/HP65kMaW" target="_blank" rel="noopener noreferrer"
                   className="text-emerald-600 hover:text-emerald-700 transition-colors">📝 意见反馈</a>
                <a href="https://github.com/RedhairHambagu/flipcard-export/issues" target="_blank" rel="noopener noreferrer"
                   className="text-emerald-600 hover:text-emerald-700 transition-colors">🐛 GitHub Issues（即将开源）</a>
                <a href="https://weibo.com/u/2630524321" target="_blank" rel="noopener noreferrer"
                   className="text-emerald-600 hover:text-emerald-700 transition-colors">🧣 大眼仔</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};