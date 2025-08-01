import { memo } from 'react';
import type { Driver } from '@/types';

interface LazyDriverDetailsProps {
  driver: Driver;
  isExpanded: boolean;
  onToggle: () => void;
}

const LazyDriverDetails = memo(({ driver, isExpanded, onToggle }: LazyDriverDetailsProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {driver.OriginalFilename || driver.Filename || 'Unknown'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Company:</span>
                <span className="ml-2 text-gray-600">{driver.Company || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">MD5:</span>
                <span className="ml-2 text-gray-600 font-mono text-xs">{driver.MD5 || 'N/A'}</span>
              </div>
            </div>
          </div>
          <button className="ml-4 p-2 hover:bg-gray-100 rounded">
            <svg 
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Complete driver details */}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">SHA1:</span>
                <span className="ml-2 text-gray-600 font-mono text-xs break-all">{driver.SHA1 || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">SHA256:</span>
                <span className="ml-2 text-gray-600 font-mono text-xs break-all">{driver.SHA256 || 'N/A'}</span>
              </div>
            </div>
            
            {driver.Description && (
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <p className="mt-1 text-gray-600">{driver.Description}</p>
              </div>
            )}
            
            {/* Other details as needed */}
          </div>
        </div>
      )}
    </div>
  );
});

LazyDriverDetails.displayName = 'LazyDriverDetails';

export default LazyDriverDetails;
