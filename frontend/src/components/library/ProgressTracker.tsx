import React from 'react';
import { Package, FileText, Tag } from 'lucide-react';

interface ProgressTrackerProps {
  productCount: number;
  itemCount: number;
  subCount: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  productCount,
  itemCount,
  subCount,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Progress Summary</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Product Categories</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{productCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">Item Categories</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{itemCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600">Sub-Categories</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{subCount}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;

