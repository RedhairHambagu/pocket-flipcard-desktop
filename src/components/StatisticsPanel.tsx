import React from 'react';
import { Calendar, BarChart3, Headphones, FileText, Play, DollarSign, Users } from 'lucide-react';
import { Statistics } from '../types';

interface StatisticsPanelProps {
  statistics: Statistics;
  settings: {
    showCostStats: boolean;
    showStarStats: boolean;
  };
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics, settings }) => {

  const getRecentMonths = (monthlyStats: Record<string, number>) => {
    return Object.entries(monthlyStats)
      .sort(([a], [b]) => b.localeCompare(a));
  };

  const recentMonths = getRecentMonths(statistics.monthlyStats);

  return (
    <div className="space-y-4">
      {/* Total Statistics */}
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 transition-all duration-300 hover:shadow-xl animate-in slide-in-from-right-4">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center mr-2 shadow-lg">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">数据统计</h3>
        </div>

        <div className="text-center mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50">
          <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            {statistics.totalItems.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-slate-600">总翻牌数</div>
        </div>

        {/* Content Type Distribution */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-slate-500 rounded flex items-center justify-center">
                <FileText className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-700 mb-1">
              {statistics.textCount}
            </div>
            <div className="text-xs font-medium text-slate-600">文字翻牌</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                <Headphones className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-700 mb-1">
              {statistics.audioCount}
            </div>
            <div className="text-xs font-medium text-emerald-600">语音翻牌</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-lg border border-teal-200/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
                <Play className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold text-teal-700 mb-1">
              {statistics.videoCount}
            </div>
            <div className="text-xs font-medium text-teal-600">视频翻牌</div>
          </div>
        </div>
      </div>

      {/* Cost Statistics */}
      {settings.showCostStats && (
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 transition-all duration-300 hover:shadow-xl animate-in slide-in-from-right-4 delay-100">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-2 shadow-lg">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">鸡腿统计</h3>
          </div>

          <div className="flex justify-center">
            <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 min-w-32 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
              <div className="text-3xl font-bold text-amber-600 mb-2">
                🍗{statistics.totalCost.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-amber-700">总鸡腿花费</div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Statistics */}
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 transition-all duration-300 hover:shadow-xl animate-in slide-in-from-right-4 delay-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mr-2 shadow-lg">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">月度统计</h3>
        </div>

        <div className="space-y-1">
          {recentMonths.map(([month, count], index) => (
            <div key={month} className="flex items-center px-2 py-1.5 bg-slate-50/50 rounded border border-slate-100 transition-all duration-200 hover:shadow-sm hover:bg-slate-50">
              <span className="text-xs font-medium text-slate-700 flex-shrink-0 w-16">
                {new Date(month + '-01').toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'short'
                })}
              </span>
              <div className="flex items-center flex-1 ml-2">
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min((count / Math.max(...recentMonths.map(([, c]) => c))) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-slate-800 min-w-8 text-right bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Statistics by Star */}
      {settings.showStarStats && Object.keys(statistics.monthlyStatsByStar).length > 0 && (
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 transition-all duration-300 hover:shadow-xl animate-in slide-in-from-right-4 delay-300">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center mr-2 shadow-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">xox分组统计（近3月）</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(statistics.monthlyStatsByStar).map(([starName, monthlyData]) => {
              const totalForStar = Object.values(monthlyData).reduce((sum, count) => sum + count, 0);
              return (
                <div key={starName} className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200/50 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className="text-sm font-bold text-slate-800 flex items-center min-w-0 flex-1">
                      <span>{starName || '未知偶像'}</span>
                    </span>
                    <span className="text-xs font-semibold text-rose-600 bg-rose-100 px-2 py-1 rounded-lg flex-shrink-0">
                      总计: {totalForStar}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(monthlyData)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 3) // 只显示最近3个月
                      .map(([month, count]) => (
                        <div key={month} className="flex items-center justify-between text-sm p-2 bg-white/60 rounded-lg">
                          <span className="text-slate-600 font-medium">
                            {new Date(month + '-01').toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'short'
                            })}
                          </span>
                          <span className="text-base font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded min-w-8 text-center">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
};

export default StatisticsPanel;