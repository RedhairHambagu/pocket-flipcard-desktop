import React, { useState } from 'react';
import { X, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { CHANGELOG, ChangelogEntry } from '../config/version';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogItem: React.FC<{ entry: ChangelogEntry }> = ({ entry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-emerald-100 text-emerald-800';
      case 'bugfix': return 'bg-red-100 text-red-800';
      case 'improvement': return 'bg-cyan-100 text-cyan-800';
      case 'breaking': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-800';
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
    <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 bg-slate-50 hover:bg-slate-100 transition-all duration-200 flex items-center justify-between text-left"
      >
        <div>
          <h4 className="font-semibold text-slate-900 text-lg">版本 {entry.version}</h4>
          <p className="text-sm text-slate-600 mt-1">{entry.date}</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-slate-600 transition-transform duration-200" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-600 transition-transform duration-200" />
        )}
      </button>

      {isExpanded && (
        <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-3">
            {entry.changes.map((change, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getTypeColor(change.type)}`}>
                  {getTypeText(change.type)}
                </span>
                <p className="text-sm text-slate-700 flex-1 leading-relaxed">{change.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">更新日志</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-all duration-200 p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-4">
            {CHANGELOG.map((entry, index) => (
              <ChangelogItem key={index} entry={entry} />
            ))}
          </div>
          
          {CHANGELOG.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无更新日志</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200/50 p-6 bg-slate-50/50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};