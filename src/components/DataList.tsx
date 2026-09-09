import React, { useState } from 'react';
import { Loader2, ChevronDown, Download } from 'lucide-react';
import { DataItem } from '../types';
import DataItemComponent from './DataItem';

interface DataListProps {
  data: DataItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onInitialLoad: () => void; // 新增：初始加载数据的回调
  initialLoadTriggered: boolean; // 新增：是否已触发初始加载
}

const DataList: React.FC<DataListProps> = ({ 
  data, 
  loading, 
  hasMore, 
  onLoadMore, 
  onInitialLoad, 
  initialLoadTriggered 
}) => {
  if (!initialLoadTriggered) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Download className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">点击加载数据</h3>
        <p className="text-gray-500 mb-6">数据需要手动加载，请点击下方按钮开始加载</p>
        <button
          onClick={onInitialLoad}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download className="w-5 h-5 mr-2" />
          手动加载10条数据
        </button>
      </div>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
        <p className="text-gray-500">尝试调整搜索条件或筛选条件</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <DataItemComponent key={`${item.id}-${index}`} item={item} />
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ChevronDown className="w-5 h-5 mr-2" />
            加载更多
          </button>
        </div>
      )}

      {!hasMore && data.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">已加载全部数据</p>
        </div>
      )}
    </div>
  );
};

export default DataList;