"use client";

import React from 'react';


interface DeleteConfirmationProps {
  text: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ 
  text, 
  onConfirm, 
  onCancel, 
  isOpen, 
  setIsOpen 
}) => {
  if (!isOpen) return null;

  // Close modal and call onCancel
  const handleCancel = () => {
    setIsOpen(false);
    if (onCancel) onCancel();
  };

  // Close modal and call onConfirm
  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h3 className="mb-5 text-lg font-bold text-gray-800">Confirm Deletion</h3>
          <p className="mb-6 text-sm text-gray-600">{text}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DeleteConfirmation;