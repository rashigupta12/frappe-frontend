import React, { useState } from "react";

interface ServerDownScreenProps {
  onRetry: () => Promise<void>;
}

export const ServerDownScreen: React.FC<ServerDownScreenProps> = ({
  onRetry,
}) => {
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
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 border border-emerald-200">
        {/* Company Logo */}
        <div className="flex justify-center mb-6 ">
          <img
            src="/logo.jpg" // replace with your actual logo path
            alt="Company Logo"
            className="h-16 w-auto"
          />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold text-gray-900 mb-3">
          Server Unavailable
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-4 leading-relaxed">
          We're unable to connect to the server. This may be due to maintenance
          or technical issues.
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isRetrying ? "Checking..." : "Try Again"}
        </button>

        {/* Help Box */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-2">
          <p className="font-medium">What you can do:</p>
          <ul className="text-left list-disc list-inside space-y-1">
            <li>Check your internet connection</li>
            <li>Wait a few minutes and try again</li>
            <li>
              Contact
              <span className="font-semibold text-blue-600">
                {" "}
                Eits Support{" "}
              </span>
              if the issue persists
            </li>
          </ul>

          {/* Contact Info */}
          
           <div className="mt-3 border-t pt-3 text-center space-y-1">
  <p className="text-gray-600">If you have any questions, reach us at:</p>

  {/* Email (click opens mail app) */}
  <a
    href="mailto:info@eitsdubai.com"
    className="font-medium text-blue-700 hover:underline"
  >
    info@eitsdubai.com
  </a>

  {/* Phone (click opens dialer) */}
  <a
    href="tel:+971501768742"
    className="block font-medium text-gray-900 hover:text-blue-600"
  >
    +971 050 176 8742
  </a>
</div>
</div>
          
        </div>
      </div>
  
  );
};
