import React from 'react';
import { Tag } from 'lucide-react';

interface TagFilterProps {
  selectedTag: string;
  onTagChange: (tag: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ selectedTag, onTagChange }) => {
  const fixedTags = ['公开', '私密'];
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
      <h3 className="text-sm font-bold text-slate-700 flex items-center mb-4">
        <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center mr-2">
          <Tag className="w-3 h-3 text-white" />
        </div>
        标签筛选
      </h3>
      <div className="space-y-3">
        <label className="flex items-center cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-all duration-200">
          <input
            type="radio"
            name="tag"
            checked={selectedTag === ''}
            onChange={() => onTagChange('')}
            className="mr-3 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">全部</span>
        </label>
        {fixedTags.map((tag) => (
          <label key={tag} className="flex items-center cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-all duration-200">
            <input
              type="radio"
              name="tag"
              checked={selectedTag === tag}
              onChange={() => onTagChange(tag)}
              className="mr-3 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{tag}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TagFilter;