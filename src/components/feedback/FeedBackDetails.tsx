/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bug,
  Calendar,
  CheckCircle,
  Eye,
  MessageCircle,
  Paperclip,
  PlusCircle,
  X
} from "lucide-react";
import React, { useState } from "react";
import AttachmentPreviewModal from "./AttachmentperviewModal";
import { Button } from "../ui/button";


// Types
interface ImageAttachment {
  name: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  image: string;
  remarks?: string;
  parent: string;
  parentfield: string;
  parenttype: string;
  doctype: string;
}

interface FeedbackItem {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  naming_series: string;
  subject: string;
  customer: string;
  status: "Open" | "Replied" | "On Hold" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  issue_type: "Bug Report" | "Feature Request" | "General Feedback";
  description: string;
  resolution_details?: string;
  opening_date: string;
  opening_time: string;
  agreement_status: string;
  company: string;
  via_customer_portal: number;
  doctype: string;
  custom_images: ImageAttachment[];
}



// Helper function to strip HTML tags
const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Helper function to render HTML content safely
const renderHtmlContent = (htmlContent: string): string => {
  if (!htmlContent) return "";
  return stripHtml(htmlContent);
};

// Helper function to check if file is an image
const isImageFile = (attachment: any): boolean => {
  const filename = attachment?.image;

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


// Feedback Details Component
const FeedbackDetails: React.FC<{
  feedback: FeedbackItem;
  onClose: () => void;
}> = ({ feedback, onClose }) => {
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800";
      case "Replied":
        return "bg-blue-100 text-blue-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      case "Low":
        return "bg-emerald-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case "Bug Report":
        return <Bug className="h-5 w-5" />;
      case "Feature Request":
        return <PlusCircle className="h-5 w-5" />;
      case "General Feedback":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  const getImageUrl = (attachment: any) => {
    const imageurl = import.meta.env.VITE_API_BASE_URL;
    const url = attachment.image;

    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (url.startsWith("blob:")) {
      return url;
    }

    if (url.startsWith("/")) {
      return `${imageurl}${url}`;
    }

    return `${imageurl}/${url}`;
  };

  const handleAttachmentView = (attachment: any, index: number) => {
    if (isImageFile(attachment)) {
      setCurrentAttachmentIndex(index);
      setShowAttachmentPreview(true);
    } else {
      const url = getImageUrl(attachment);
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

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

return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 capitalize">
    <div
      className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-emerald-500 text-white p-6 flex-shrink-0 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIssueTypeIcon(feedback.issue_type)}
            <h2 className="text-2xl font-bold">Feedback Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Status and Priority */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  feedback.status
                )}`}
              >
                {feedback.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getPriorityColor(
                  feedback.priority
                )}`}
              >
                {feedback.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                {feedback.issue_type}
              </span>
            </div>
          </div>

          {/* Subject */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Subject
            </h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg text-lg">
              {feedback.subject}
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Description
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {renderHtmlContent(feedback.description)}
              </p>
            </div>
          </div>

          {/* Resolution Details if available */}
          {feedback.resolution_details && feedback.status === "Replied" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-green-800 text-xl">
                  Response from Support Team
                </h3>
              </div>
              <div className="text-green-700 bg-white p-4 rounded border leading-relaxed">
                {renderHtmlContent(feedback.resolution_details)}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">
                Created
              </h4>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span className="text-base">
                  {fmt(feedback.opening_date)}
                  {feedback.opening_time && ` at ${feedback.opening_time}`}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {feedback.custom_images && feedback.custom_images.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <Paperclip className="h-6 w-6" />
                Attachments ({feedback.custom_images.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedback.custom_images.map((attachment, index) => {
                  const isImage = isImageFile(attachment);
                  const fileName =
                    attachment.image?.split("/").pop() ||
                    `Attachment ${index + 1}`;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isImage ? (
                          <div className="w-12 h-12 rounded bg-blue-50 flex items-center justify-center">
                            <Eye className="h-6 w-6 text-blue-500" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                            <Paperclip className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileName}
                          </p>
                          {attachment.remarks && (
                            <p className="text-xs text-gray-500 truncate">
                              {attachment.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAttachmentView(attachment, index)}
                        className="h-8 ml-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
        <div className="flex justify-end">
          <Button onClick={onClose} size="lg">Close</Button>
        </div>
      </div>

      <AttachmentPreviewModal
        isOpen={showAttachmentPreview}
        onClose={() => setShowAttachmentPreview(false)}
        attachments={feedback.custom_images || []}
        currentIndex={currentAttachmentIndex}
        onIndexChange={setCurrentAttachmentIndex}
      />
    </div>
  </div>
);
};

export default FeedbackDetails;
