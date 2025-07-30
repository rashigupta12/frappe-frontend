/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building,
  CreditCard,

  FileText,
  X
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { DialogContent, DialogFooter } from "../ui/dialog";

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
  const filename =
    attachment?.file_name || attachment?.image || attachment?.name;

  if (!filename) return false;

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
  ];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return imageExtensions.includes(extension);
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
    const url =
      attachment.file_url ||
      attachment.url ||
      attachment.image ||
      attachment.file_path ||
      attachment.attachment_url ||
      attachment.path;

    if (!url) return "";

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
          alt={
            currentAttachment?.image ||
            currentAttachment?.file_name ||
            "Attachment"
          }
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

const ReceiptDetails: React.FC<Props> = ({ receipt, onClose }) => {
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  const fmt = (d?: string) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    if (!mode) return <FileText className="h-5 w-5 text-gray-500" />;
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes("cash")) return ;
    if (lowerMode.includes("card")) return ;
    return <Building className="h-5 w-5 text-purple-600" />; // bank
  };

  const getImageUrl = (attachment: any) => {
    const imageurl = "https://eits.thebigocommunity.org";

    const url =
      attachment.file_url ||
      attachment.url ||
      attachment.image ||
      attachment.file_path ||
      attachment.attachment_url ||
      attachment.path;

    if (!url) return "";

    if (url.startsWith("http") || url.startsWith("blob:")) {
      return url;
    }
    if (url.startsWith("/")) {
      return `${imageurl}${url}`;
    }
    return `${imageurl}/${url}`;
  };

  const handleAttachmentView = (attachment: any) => {
    if (isImageFile(attachment)) {
      const imageAttachments =
        receipt.custom_attachments?.filter((att) => isImageFile(att)) || [];
      const imageIndex = imageAttachments.findIndex(
        (att) => att === attachment
      );
      setCurrentAttachmentIndex(imageIndex >= 0 ? imageIndex : 0);
      setShowAttachmentPreview(true);
    } else {
      const url = getImageUrl(attachment);
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  const renderBankDetails = () => {
    if (receipt.custom_mode_of_payment?.toLowerCase() === 'bank') {
      return (
        <div className="bg-blue-50 rounded-lg p-3 mb-1 ">
          <h4 className="text-sm font-md text-blue-900 flex items-center gap-2">
            <Building className="h-2 w-2" />
            Bank Details
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DetailField label="Bank Name" value={receipt.custom_name_of_bank} />
            <DetailField label="Account Number" value={receipt.custom_account_number} />
            <DetailField label="Account Holder" value={receipt.custom_account_holder_name} />
            <DetailField label="IFSC/SWIFT Code" value={receipt.custom_ifscibanswift_code} />
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCreditCardDetails = () => {
    if (receipt.custom_mode_of_payment?.toLowerCase() === 'credit card') {
      return (
        <div className="bg-purple-50 rounded-lg p-2">
          <h4 className="text-sm font-semibold text-purple-900  flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Credit Card Details
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <DetailField label="Bank Name" value={receipt.custom_name_of_bank} />
            <DetailField label="Card Number" value={receipt.custom_card_number} />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <DialogContent className="max-w-[95vw] sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto p-0">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-6 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Receipt Details
            </h2>
            <p className="text-sm text-gray-500">{receipt.name}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {getPaymentModeIcon(receipt.custom_mode_of_payment)}
              <span className="text-sm font-medium text-gray-600">
                {receipt.custom_mode_of_payment}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {receipt.amountaed || 0} <span className="text-lg text-gray-600">AED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6  ">
        {/* Primary Information */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
          <SimpleField
            label="Receipt Date"
            value={fmt(receipt.date)}
          />
          <SimpleField
            label="Bill Number"
            value={receipt.bill_number}
          />
          <SimpleField
            label="Paid From"
            value={receipt.paid_from}
          />
          <SimpleField
            label="Paid By"
            value={receipt.paid_by}
          />
          <SimpleField
            label="Status"
            value={receipt.docstatus === 0 ? "Draft" : "Submitted"}
          />
        </div>

        {/* Purpose */}
        {receipt.custom_purpose_of_payment && (
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Purpose of Payment</h4>
                <p className="text-sm text-gray-700">{receipt.custom_purpose_of_payment}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Specific Details */}
        {renderBankDetails()}
        {renderCreditCardDetails()}

        {/* Attachments */}
        {receipt.custom_attachments && receipt.custom_attachments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attachments ({receipt.custom_attachments.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {receipt.custom_attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => handleAttachmentView(attachment)}
                >
                  {isImageFile(attachment) ? (
                    <>
                      <img
                        src={getImageUrl(attachment)}
                        alt={
                          attachment?.image ||
                          attachment?.file_name ||
                          `Attachment ${index + 1}`
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.classList.add(
                              "bg-gray-100",
                              "flex",
                              "items-center",
                              "justify-center"
                            );
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-3 group-hover:bg-gray-100 transition-colors duration-200">
                      <FileText className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 text-center truncate w-full">
                        {attachment?.file_name ||
                          attachment?.image ||
                          `File ${index + 1}`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <DialogFooter className="sticky bottom-0 bg-white border-t p-6 pt-4">
        <Button onClick={onClose} className="w-full sm:w-auto">
          Close
        </Button>
      </DialogFooter>

      <AttachmentPreviewModal
        isOpen={showAttachmentPreview}
        onClose={() => setShowAttachmentPreview(false)}
        attachments={
          receipt.custom_attachments?.filter((att) => isImageFile(att)) || []
        }
        currentIndex={currentAttachmentIndex}
        onIndexChange={setCurrentAttachmentIndex}
      />
    </DialogContent>
  );
};

export default ReceiptDetails;

interface DetailFieldProps {
  label: string;
  value?: string;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value }) => {
  return (
    <div>
      <span className="text-xs font-medium text-gray-600 block mb-1">{label}</span>
      <p className="text-sm font-semibold text-gray-900">{value || "N/A"}</p>
    </div>
  );
};

interface SimpleFieldProps {
  label: string;
  value?: string;
}

const SimpleField: React.FC<SimpleFieldProps> = ({ label, value }) => {
  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium text-gray-900">{value || "N/A"}</p>
    </div>
  );
};