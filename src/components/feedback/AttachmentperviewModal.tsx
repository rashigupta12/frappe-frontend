/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  X
} from "lucide-react";
import React from "react";
// import { showToast } from "react-hot-showToast";




// Image Preview Modal Component
const AttachmentPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  attachments: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}> = ({ isOpen, onClose, attachments, currentIndex, onIndexChange }) => {
  const imageurl = import.meta.env.VITE_API_BASE_URL;

  if (!isOpen || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex];

  const getImageUrl = (attachment: any) => {
    const url = attachment.image;

    if (!url) return "";

    if (url.startsWith("/")) {
      return `${imageurl}${url}`;
    }
    return `${imageurl}/${url}`;
  };

  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : attachments.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < attachments.length - 1 ? currentIndex + 1 : 0);
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div className="text-white">
          <h2 className="text-lg font-semibold">Attachment Preview</h2>
          <p className="text-sm text-gray-300">
            {currentIndex + 1} of {attachments.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <img
          src={getImageUrl(currentAttachment)}
          alt={currentAttachment?.image || "Attachment"}
          className="max-w-full max-h-full object-contain rounded-lg"
        />

        {attachments.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {attachments.length > 1 && (
        <div className="bg-black/50 backdrop-blur-sm p-4">
          <div className="flex gap-2 justify-center overflow-x-auto">
            {attachments.map((attachment, index) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentIndex
                    ? "border-blue-500"
                    : "border-transparent"
                }`}
              >
                <img
                  src={getImageUrl(attachment)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentPreviewModal;
