import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="relative group">
      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200">
        <Search size={14} className="text-slate-400 group-focus-within:text-emerald-500 sm:w-5 sm:h-5" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜索内容或标签..."
        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-white/95 backdrop-blur-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-400 hover:shadow-lg focus:shadow-lg transition-all duration-200 shadow-md font-medium text-slate-700 placeholder:text-slate-400 text-sm sm:text-base"
      />
      {searchTerm && (
        <button
          onClick={clearSearch}
          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200 p-1 rounded-lg hover:bg-slate-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;