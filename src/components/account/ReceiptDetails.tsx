/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building,
  Calendar,
  CreditCard,
  FileText,
  Hash,
  User,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
// Fixed import path - changed from './ReciptSummary' to './ReceiptSummary'
export interface Receipt {
  name: string;
  bill_number: string;
  amountaed: number;
  paid_by: string;
  paid_from: string;
  custom_purpose_of_payment: string;
  custom_mode_of_payment: string;
  custom_name_of_bank?: string;
  custom_account_number?: string;
  custom_card_number?: string;
  docstatus: number; // 0 = draft, 1 = submitted
  date: string;      // yyyy-mm-dd
  custom_attachments: any[];
  custom_ifscibanswift_code?: string;
  custom_account_holder_name?: string;
}

interface Props {
  receipt: Receipt;
  onClose: () => void;
}

// Helper function to check if file is an image
const isImageFile = (attachment: any): boolean => {
  const filename = attachment?.file_name || attachment?.image || attachment?.name;
  
  console.log('Checking filename:', filename);
  if (!filename) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  console.log('File extension:', extension);
  const isImage = imageExtensions.includes(extension);
  console.log('Is image:', isImage);
  return isImage;
};

// Image Preview Modal Component
const AttachmentPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  attachments: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}> = ({ isOpen, onClose, attachments, currentIndex, onIndexChange }) => {
  const imageurl = "https://eits.thebigocommunity.org";

  if (!isOpen || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex];

  const getImageUrl = (attachment: any) => {
    const url = attachment.file_url || 
                attachment.url || 
                attachment.image ||
                attachment.file_path || 
                attachment.attachment_url ||
                attachment.path;
    
    if (!url) return '';
    
    if (url.startsWith("http") || url.startsWith("blob:")) {
      return url;
    }
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
      {/* Header */}
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

      {/* Image Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <img
          src={getImageUrl(currentAttachment)}
          alt={currentAttachment?.image || currentAttachment?.file_name || "Attachment"}
          className="max-w-full max-h-full object-contain rounded-lg"
        />

        {/* Navigation Arrows */}
        {attachments.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
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

const ReceiptDetails: React.FC<Props> = ({ receipt, onClose }) => {
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  console.log('Receipt attachments:', receipt.custom_attachments);
  console.log('Image attachments:', receipt.custom_attachments?.filter((att: any) => isImageFile(att)));

  const fmt = (d?: string) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    if (!mode) return <FileText className="h-4 w-4" />;
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes('cash')) return ;
    if (lowerMode.includes('card')) return <CreditCard className="h-4 w-4" />;
    return <Building className="h-4 w-4" />;
  };

  const getImageUrl = (attachment: any) => {
    const imageurl = "https://eits.thebigocommunity.org";
    
    const url = attachment.file_url || 
                attachment.url || 
                attachment.image ||
                attachment.file_path || 
                attachment.attachment_url ||
                attachment.path;
    
    console.log('Raw URL from attachment:', url);
    
    if (!url) {
      console.log('No URL property found. Available properties:', Object.keys(attachment));
      return '';
    }
    
    let finalUrl = '';
    if (url.startsWith("http") || url.startsWith("blob:")) {
      finalUrl = url;
    } else if (url.startsWith("/")) {
      finalUrl = `${imageurl}${url}`;
    } else {
      finalUrl = `${imageurl}/${url}`;
    }
    
    console.log('Final constructed URL:', finalUrl);
    return finalUrl;
  };

  const handleAttachmentView = (attachment: any, index: number) => {
    if (isImageFile(attachment)) {
      const imageAttachments = receipt.custom_attachments?.filter((att: any) => isImageFile(att)) || [];
      const imageIndex = imageAttachments.findIndex((att: any) => att === attachment);
      setCurrentAttachmentIndex(imageIndex >= 0 ? imageIndex : 0);
      setShowAttachmentPreview(true);
    } else {
      const url = getImageUrl(attachment);
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl leading-tight flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          Receipt Details – {receipt.name}
        </DialogTitle>
      </DialogHeader>

      {/* Basic Information */}
      <div className="space-y-3 mt-4">
        {/* Date and Bill Number */}
        <div className="grid grid-cols-2 gap-3">
          <Field 
            label="Date" 
            value={fmt(receipt.date)} 
            icon={<Calendar className="h-4 w-4" />}
          />
          <Field 
            label="Bill Number" 
            value={receipt.bill_number} 
            icon={<Hash className="h-4 w-4" />}
          />
        </div>

        {/* Payment From and To */}
        <div className="grid grid-cols-2 gap-3">
          <Field 
            label="Paid From" 
            value={receipt.paid_from}
            icon={<User className="h-4 w-4" />}
          />
          <Field 
            label="Paid By" 
            value={receipt.paid_by}
            icon={<User className="h-4 w-4" />}
          />
        </div>

        {/* Purpose */}
        <Field 
          label="Purpose of Payment" 
          value={receipt.custom_purpose_of_payment}
          icon={<FileText className="h-4 w-4" />}
        />

        {/* Conditional fields */}
        {receipt.custom_name_of_bank && (
          <Field 
            label="Bank Name" 
            value={receipt.custom_name_of_bank}
            icon={<Building className="h-4 w-4" />}
          />
        )}

        {receipt.custom_card_number && (
          <Field 
            label="Card Number" 
            value={`****-****-****-${receipt.custom_card_number.toString().slice(-4)}`}
            icon={<CreditCard className="h-4 w-4" />}
          />
        )}
      </div>

      {/* Attachments Section */}
      {receipt.custom_attachments && receipt.custom_attachments.length > 0 && (
        <Section title={`Attachments (${receipt.custom_attachments.length})`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {receipt.custom_attachments.map((attachment: any, index: number) => (
              <div 
                key={index}
                className="flex flex-col p-3 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow"
              >
                {/* Image Preview or File Icon */}
                {isImageFile(attachment) ? (
                  <div className="mb-3">
                    <img 
                      src={getImageUrl(attachment)} 
                      alt={attachment?.image || attachment?.file_name || `Attachment ${index + 1}`}
                      className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleAttachmentView(attachment, index)}
                      onError={(e) => {
                        console.log('Image failed to load:', e.currentTarget.src);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex flex-col items-center justify-center h-32 bg-gray-200 rounded border">
                    <FileText className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 text-center">
                      {attachment?.image?.split('.').pop()?.toUpperCase() || 'FILE'}
                    </span>
                  </div>
                )}
                
                {/* File Info */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {attachment?.image?.split('/').pop() || attachment?.file_name || `Attachment ${index + 1}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Payment Summary */}
      <Section title="Payment Summary">
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Total Amount</p>
              <p className="text-lg font-bold text-emerald-800">{receipt.amountaed || 0} AED</p>
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Payment Method</p>
              <div className="flex items-center gap-2">
                {getPaymentModeIcon(receipt.custom_mode_of_payment)}
                <span className="font-medium text-emerald-800">
                  {receipt.custom_mode_of_payment || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Image Preview Modal */}
      <AttachmentPreviewModal
        isOpen={showAttachmentPreview}
        onClose={() => setShowAttachmentPreview(false)}
        attachments={receipt.custom_attachments?.filter((att: any) => isImageFile(att)) || []}
        currentIndex={currentAttachmentIndex}
        onIndexChange={setCurrentAttachmentIndex}
      />

      <DialogFooter className="mt-6">
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ReceiptDetails;

/* Helper Components */
interface FieldProps {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, value, icon }) => {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="font-medium">{value || 'N/A'}</p>
    </div>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className="mt-6">
      <h3 className="font-semibold text-emerald-700 mb-2">{title}</h3>
      {children}
    </div>
  );
};