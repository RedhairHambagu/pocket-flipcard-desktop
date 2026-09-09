import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { DateRange } from '../types';
import YearMonthFilter from './YearMonthFilter';

interface DateFilterProps {
  onDateRangeChange: (range: DateRange) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ onDateRangeChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showYearMonthFilter, setShowYearMonthFilter] = useState(false);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    onDateRangeChange({
      start: date ? new Date(date) : null,
      end: endDate ? new Date(endDate) : null
    });
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    onDateRangeChange({
      start: startDate ? new Date(startDate) : null,
      end: date ? new Date(date) : null
    });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange({ start: null, end: null });
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    onDateRangeChange({
      start: new Date(today),
      end: new Date(today)
    });
  };

  const setThisWeek = () => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];
    
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange({
      start: new Date(start),
      end: new Date(end)
    });
  };

  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];
    
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange({
      start: new Date(start),
      end: new Date(end)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          日期筛选
        </h3>
        {(startDate || endDate) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            清除
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">开始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">结束日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={setToday}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
        >
          今天
        </button>
        <button
          onClick={setThisWeek}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
        >
          本周
        </button>
        <button
          onClick={setThisMonth}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
        >
          本月
        </button>
        <button
          onClick={() => setShowYearMonthFilter(!showYearMonthFilter)}
          className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
        >
          {showYearMonthFilter ? '隐藏年月筛选' : '年月筛选'}
        </button>
      </div>

      {showYearMonthFilter && (
        <div className="pt-4 border-t border-gray-200">
          <YearMonthFilter onDateRangeChange={onDateRangeChange} />
        </div>
      )}
    </div>
  );
};

export default DateFilter;