import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { DateRange } from '../types';

interface YearMonthFilterProps {
  onDateRangeChange: (range: DateRange) => void;
}

const YearMonthFilter: React.FC<YearMonthFilterProps> = ({ onDateRangeChange }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // 生成年份选项（最近5年）
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  
  // 月份选项
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    updateDateRange(year, selectedMonth);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    updateDateRange(selectedYear, month);
  };

  const updateDateRange = (year: number, month: number) => {
    // 创建该月的第一天和最后一天
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    onDateRangeChange({
      start: startDate,
      end: endDate
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-3">
        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-medium text-gray-900">按年月筛选</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">月份</label>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {months.map(month => (
              <option key={month} value={month}>
                {month}月
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-500">
        当前选择: {selectedYear}年{selectedMonth}月
      </div>
    </div>
  );
};

export default YearMonthFilter;