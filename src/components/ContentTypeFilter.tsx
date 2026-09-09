import React from 'react';
import { FileText, Headphones, Play } from 'lucide-react';

interface ContentTypeFilterProps {
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
}

const ContentTypeFilter: React.FC<ContentTypeFilterProps> = ({ selectedTypes, onTypeChange }) => {
  const contentTypes = [
    { value: 'text', label: '文本', icon: FileText, bgColor: 'bg-slate-500', selectColor: 'bg-slate-100 border-slate-300' },
    { value: 'audio', label: '音频', icon: Headphones, bgColor: 'bg-emerald-500', selectColor: 'bg-emerald-100 border-emerald-300' },
    { value: 'video', label: '视频', icon: Play, bgColor: 'bg-teal-500', selectColor: 'bg-teal-100 border-teal-300' }
  ];

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onTypeChange(newTypes);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
      <h3 className="text-sm font-bold text-slate-700 flex items-center mb-4">
        <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center mr-2">
          <FileText className="w-3 h-3 text-white" />
        </div>
        内容类型
      </h3>
      <div className="space-y-3">
        {contentTypes.map(({ value, label, icon: Icon, bgColor, selectColor }) => (
          <label key={value} className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedTypes.includes(value)}
              onChange={() => handleTypeToggle(value)}
              className="sr-only"
            />
            <div className={`flex items-center p-3 rounded-xl border transition-all duration-200 w-full group-hover:shadow-md ${
              selectedTypes.includes(value)
                ? selectColor + ' shadow-sm'
                : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                selectedTypes.includes(value)
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-300 group-hover:border-slate-400'
              }`}>
                {selectedTypes.includes(value) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center mr-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ContentTypeFilter;