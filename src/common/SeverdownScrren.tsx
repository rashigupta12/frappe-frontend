import React, { useState } from 'react';

interface ServerDownScreenProps {
  onRetry: () => Promise<void>;
}

export const ServerDownScreen: React.FC<ServerDownScreenProps> = ({ onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Server Unavailable
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          We're unable to connect to the server. This may be due to maintenance or technical issues.
        </p>
        
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isRetrying ? 'Checking...' : 'Try Again'}
        </button>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">What you can do:</p>
          <ul className="text-left space-y-1">
            <li>• Check your internet connection</li>
            <li>• Wait a few minutes and try again</li>
            <li>• Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
