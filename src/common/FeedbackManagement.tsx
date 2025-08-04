/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bug,
  Calendar,
  CheckCircle,
  MessageCircle,
  Paperclip,
  Plus,
  PlusCircle,
  Send,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { frappeAPI } from "../api/frappeClient";
import PaymentImageUpload from "../components/account/imageupload/ImageUpload";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

// Types
interface ImageAttachment {
  name: string;
  owner: string;
  // creation: string;
  // modified: string;
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
  issue_type:
    | "Bug Report"
    | "Feature Request"
    | "General Feedback"
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

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  remarks?: string;
  type: "image" | "pdf" | "doc";
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

// Feedback Form Component
const FeedbackForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Partial<FeedbackItem>) => Promise<void>;
  editingFeedback?: FeedbackItem | null;
}> = ({ isOpen, onClose, onSubmit, editingFeedback }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    issue_type: "General Feedback" as FeedbackItem["issue_type"],
    priority: "Medium" as FeedbackItem["priority"],
    customer: user?.email || "",
  });
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingFeedback) {
      setFormData({
        subject: editingFeedback.subject,
        description: renderHtmlContent(editingFeedback.description),
        issue_type: editingFeedback.issue_type,
        priority: editingFeedback.priority,
        customer: editingFeedback.customer,
      });

      // Convert existing images to ImageItem format
      const convertedImages: ImageItem[] =
        editingFeedback.custom_images?.map((img, index) => {
          let url = img.image;
          // Handle different URL formats from API
          if (url.startsWith("//")) {
            url = `https:${url}`;
          } else if (url.startsWith("/") && !url.startsWith("//")) {
            // For relative URLs like "/private/files/..."
            url = `${window.location.origin}${url}`;
          } else if (!url.startsWith("http")) {
            url = `/${url}`;
          }

          // Determine file type from URL
          let type: "image" | "pdf" | "doc" = "image";
          if (url.toLowerCase().endsWith(".pdf")) {
            type = "pdf";
          } else if (
            url.toLowerCase().endsWith(".doc") ||
            url.toLowerCase().endsWith(".docx")
          ) {
            type = "doc";
          }

          return {
            id: `existing-${index}-${img.name}`,
            url: url,
            remarks: img.remarks || "",
            type: type,
          };
        }) || [];
      setImages(convertedImages);
    } else {
      setFormData({
        subject: "",
        description: "",
        issue_type: "General Feedback",
        priority: "Medium",
        customer: user?.email || "",
      });
      setImages([]);
    }
  }, [editingFeedback, isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentDate = new Date();
      const feedbackData = {
        ...formData,
        custom_images: images.map((img, idx) => ({
          name: `img-${idx}-${Date.now()}`,
          owner: user?.email || "",
          // creation: new Date().toISOString(),
          // modified: new Date().toISOString(),
          modified_by: user?.email || "",
          docstatus: 0,
          idx: idx + 1,
          image: img.url,
          remarks: img.remarks || "",
          parent: editingFeedback?.name || "",
          parentfield: "custom_images",
          parenttype: "Feedback",
          doctype: "ImageAttachment",
        })),
        opening_date: currentDate.toISOString().split("T")[0],
        opening_time: currentDate.toTimeString().split(" ")[0],
        status: "Open" as FeedbackItem["status"],
        ...(editingFeedback ? { name: editingFeedback.name } : {}),
      };

      await onSubmit(feedbackData);

      // Reset form
      setFormData({
        subject: "",
        description: "",
        issue_type: "General Feedback",
        priority: "Medium",
        customer: user?.email || "",
      });
      setImages([]);
      onClose();
      // toast.success(
      //   editingFeedback
      //     ? "Feedback updated successfully!"
      //     : "Feedback submitted successfully!"
      // );
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      // Upload the file first to get the URL
      const uploadResponse = await frappeAPI.upload(file, {});

      // Handle both possible response structures
      const fileData = uploadResponse.data.message || uploadResponse.data;
      const fileUrl = fileData.file_url;

      if (!fileUrl) {
        throw new Error("No file URL returned from upload");
      }

      // Return the full URL
      return fileUrl.startsWith("http") ? fileUrl : `${fileUrl}`;
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("Failed to upload image. Please try again.");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            {editingFeedback ? "View/Edit Feedback" : "Submit New Feedback"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Show resolution details if feedback has been replied */}
          {editingFeedback?.resolution_details &&
            editingFeedback.status === "Replied" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">
                    Response from Support Team
                  </h3>
                </div>
                <div className="text-green-700 bg-white p-3 rounded border">
                  {renderHtmlContent(editingFeedback.resolution_details)}
                </div>
              </div>
            )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief subject for your feedback"
              required
              disabled={!!editingFeedback && editingFeedback.status !== "Open"}
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.issue_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    issue_type: e.target.value as FeedbackItem["issue_type"],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={
                  !!editingFeedback && editingFeedback.status !== "Open"
                }
              >
                <option value="General Feedback">General Feedback</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
          
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as FeedbackItem["priority"],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={
                  !!editingFeedback && editingFeedback.status !== "Open"
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Please provide detailed feedback..."
              required
              disabled={!!editingFeedback && editingFeedback.status !== "Open"}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments (Optional)
            </label>
            <PaymentImageUpload
              images={images}
              onImagesChange={setImages}
              onUpload={handleImageUpload}
              maxImages={5}
              maxSizeMB={10}
            />
            {isUploading && (
              <p className="text-sm text-gray-500 mt-1">Uploading image...</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
            >
              {editingFeedback ? "Close" : "Cancel"}
            </Button>
            {(!editingFeedback || editingFeedback.status === "Open") && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting || isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isUploading ? "Uploading..." : "Submitting..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {editingFeedback ? "Update Feedback" : "Submit Feedback"}
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Feedback List Component
const FeedbackList: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  feedbacks: FeedbackItem[];
  loading: boolean;
  filters: any;
  onFilterChange: (filters: any) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onEditFeedback: (feedback: FeedbackItem | null) => void;
}> = ({
  isOpen,
  onClose,
  feedbacks,
  loading,
  // filters,
  // onFilterChange,
  // showFilters,
  // setShowFilters,
  onEditFeedback,
}) => {
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
        return <Bug className="h-4 w-4" />;
      case "Feature Request":
        return <PlusCircle className="h-4 w-4" />;
      case "General Feedback":
        return <MessageCircle className="h-4 w-4" />;
  
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  // const formatDate = (dateString?: string) => {
  //   if (!dateString) return "N/A";
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6" />
              <h2 className="text-xl font-bold">Feedback Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filters Toggle */}
          {/* <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="text-sm">
              Showing {feedbacks.length} feedback items
            </div>
          </div> */}
        </div>

        {/* Filters */}
        {/* {showFilters && (
          <div className="bg-emerald-50 p-4 border-b border-emerald-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Replied">Replied</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-1">Category</label>
                <select
                  value={filters.issue_type}
                  onChange={(e) => onFilterChange({ ...filters, issue_type: e.target.value })}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="All">All Categories</option>
                  <option value="General Feedback">General Feedback</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Suggestion">Suggestion</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-1">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">Priority (High to Low)</option>
                </select>
              </div>
            </div>
          </div>
        )} */}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin p-5" />
                Loading feedbacks...
              </div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-4">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Feedback Found
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onEditFeedback(null); // This will trigger the form to open for new feedback
                }}
                className="absolute bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                title="Add New Feedback"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-emerald-100">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.name}
                  className="p-3 hover:bg-emerald-50 transition-colors cursor-pointer"
                  onClick={() => onEditFeedback(feedback)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-emerald-900 truncate">
                          {feedback.subject}
                        </h3>
                        <span className="flex-shrink-0">
                          {getIssueTypeIcon(feedback.issue_type)}
                        </span>
                        {feedback.status === "Replied" && (
                          <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2 text-sm">
                        {renderHtmlContent(feedback.description)}
                      </p>

                      {/* Show resolution preview if replied */}
                      {feedback.resolution_details &&
                        feedback.status === "Replied" && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-3 text-sm">
                            <p className="text-blue-800 font-medium">
                              Response:
                            </p>
                            <p className="text-blue-700 line-clamp-2">
                              {renderHtmlContent(feedback.resolution_details)}
                            </p>
                          </div>
                        )}

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {feedback.opening_date
                              ? format(new Date(feedback.opening_date), "dd/MM/yyyy")
                              : "No date"}
                            {feedback.opening_time && ` at ${feedback.opening_time}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              feedback.status
                            )}`}
                          >
                            {feedback.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              feedback.priority
                            )}`}
                          >
                            {feedback.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                        {feedback.issue_type}
                      </span>
                      {feedback.custom_images?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Paperclip className="h-3 w-3" />
                          {feedback.custom_images.length} attachment
                          {feedback.custom_images.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-200 p-4 bg-white">
          <div className="flex justify-between items-center">
            <div className="text-sm text-emerald-600">
              {feedbacks.length} items • Last updated:{" "}
              {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {/* Add this inside FeedbackList, before the closing div of the modal container */}
      <button
        onClick={() => {
          onClose();
          onEditFeedback(null); // This will trigger the form to open for new feedback
        }}
        className="absolute bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        title="Add New Feedback"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Main Feedback Component
const FeedbackComponent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { user } = useAuth();
  const [showList, setShowList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(
    null
  );
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "All",
    issue_type: "All",
    priority: "All",
    sort: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch feedbacks for the current user
  const fetchFeedbacks = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // First get the list of issue IDs for this user
      const listResponse = await frappeAPI.getFeedbackByUserId(user.email);

      if (!listResponse.data) {
        throw new Error("No feedback data received");
      }

      // Then fetch full details for each issue
      const feedbackPromises = listResponse.data.map(
        async (issue: { name: string }) => {
          const detailResponse = await frappeAPI.getFeedbackById(issue.name);
          return detailResponse.data;
        }
      );

      // Wait for all details to be fetched
      const feedbacks = await Promise.all(feedbackPromises);
      setFeedbacks(feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Failed to load feedbacks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showList) {
      fetchFeedbacks();
    }
  }, [showList, user?.email]);

  const handleSubmitFeedback = async (feedbackData: Partial<FeedbackItem>) => {
    try {
      // Prepare the data for the API
      const apiData = {
        ...feedbackData,
        customer: user?.email,
        // Ensure required fields are included
        subject: feedbackData.subject,
        description: feedbackData.description,
        issue_type: feedbackData.issue_type,
        priority: feedbackData.priority,
        status: "Open", // Default status
      };

      // Remove any undefined fields
      Object.keys(apiData as Record<string, any>).forEach(
        (key) =>
          (apiData as Record<string, any>)[key] === undefined &&
          delete (apiData as Record<string, any>)[key]
      );

      let result;
      if (editingFeedback && editingFeedback.name) {
        // Update existing feedback
        result = await frappeAPI.editFeedback(editingFeedback.name, apiData);
      } else {
        // Create new feedback
        result = await frappeAPI.createFeedback(apiData);
      }

      console.log("Feedback operation successful:", result);

      toast.success(
        editingFeedback
          ? "Feedback updated successfully!"
          : "Feedback submitted successfully!"
      );
      setEditingFeedback(null);
      fetchFeedbacks(); // Refresh the list
    } catch (error) {
      console.error("Error in feedback operation:", error);
      throw error;
    }
  };

  const handleNewFeedback = () => {
    setEditingFeedback(null);
    setShowForm(true);
  };

  const sortFeedbacks = (feedbacks: FeedbackItem[], sortType: string) => {
    const sorted = [...feedbacks];
    switch (sortType) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.creation).getTime() - new Date(a.creation).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.creation).getTime() - new Date(b.creation).getTime()
        );
      case "priority": {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return sorted.sort(
          (a, b) =>
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        );
      }
      default:
        return sorted;
    }
  };

  const filteredFeedbacks = sortFeedbacks(
    feedbacks.filter((feedback) => {
      return (
        (filters.status === "All" || feedback.status === filters.status) &&
        (filters.issue_type === "All" ||
          feedback.issue_type === filters.issue_type) &&
        (filters.priority === "All" || feedback.priority === filters.priority)
      );
    }),
    filters.sort
  );

  return (
    <div className={className}>
      <div className="relative">
        {/* Trigger Button */}
        <div onClick={() => setShowList(true)}>{children}</div>

        {/* Feedback List Modal */}
        <FeedbackList
          isOpen={showList}
          onClose={() => setShowList(false)}
          feedbacks={filteredFeedbacks}
          loading={loading}
          filters={filters}
          onFilterChange={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onEditFeedback={function (feedback: FeedbackItem | null): void {
            setEditingFeedback(feedback);
            setShowForm(true);
          }}
        />

        {/* Feedback Form Modal */}
        <FeedbackForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingFeedback(null);
          }}
          onSubmit={handleSubmitFeedback}
          editingFeedback={editingFeedback}
        />

        {/* Floating Add Button - Only show when list is open */}
        {/* Floating Add Button - Only show when list is open */}
        {showList && (
          <button
            onClick={handleNewFeedback}
            className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-[10000]" // Increased z-index
            title="Add New Feedback"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedbackComponent;
