import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface StarNameFilterProps {
  selectedStarName: string;
  onStarNameChange: (starName: string) => void;
  data: any[]; // 用于获取可用的starName列表
}

const StarNameFilter: React.FC<StarNameFilterProps> = ({ selectedStarName, onStarNameChange, data }) => {
  const [availableStarNames, setAvailableStarNames] = useState<string[]>([]);

  // 从数据中提取所有的starName
  useEffect(() => {
    const starNames = new Set<string>();
    data.forEach(item => {
      const starName = item.starName || item.idolNickname;
      if (starName && starName.trim()) {
        starNames.add(starName.trim());
      }
    });
    
    // 转换为数组并排序
    const sortedStarNames = Array.from(starNames).sort();
    setAvailableStarNames(sortedStarNames);
  }, [data]);

  if (availableStarNames.length === 0) {
    return null; // 如果没有可用的starName，不显示筛选器
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
      <h3 className="text-sm font-bold text-slate-700 flex items-center mb-4">
        <div className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center mr-2">
          <Star className="w-3 h-3 text-white" />
        </div>
        偶像筛选
      </h3>
      <div className="space-y-3 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        <label className="flex items-center cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-all duration-200">
          <input
            type="radio"
            name="starName"
            checked={selectedStarName === ''}
            onChange={() => onStarNameChange('')}
            className="mr-3 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">全部</span>
        </label>
        {availableStarNames.map((starName) => (
          <label key={starName} className="flex items-center cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-all duration-200">
            <input
              type="radio"
              name="starName"
              checked={selectedStarName === starName}
              onChange={() => onStarNameChange(starName)}
              className="mr-3 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate" title={starName}>
              {starName}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default StarNameFilter;