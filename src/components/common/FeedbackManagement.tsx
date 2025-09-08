/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
// import { showToast } from "react-hot-showToast";
import { frappeAPI } from "../../api/frappeClient";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../helpers/comman";
import FeedbackList from "../feedback/FeedBackList";
import FeedbackForm from "../feedback/FeedbackForm";
import FeedbackDetails from "../feedback/FeedBackDetails";

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

// Main Feedback Component
const FeedbackComponent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { user } = useAuth();
  const [showList, setShowList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  console.log(showDetails);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null
  );
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch feedbacks for the current user
  const fetchFeedbacks = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const listResponse = await frappeAPI.getFeedbackByUserId(user.email);

      if (!listResponse.data) {
        throw new Error("No feedback data received");
      }

      const feedbackPromises = listResponse.data.map(
        async (issue: { name: string }) => {
          const detailResponse = await frappeAPI.getFeedbackById(issue.name);
          return detailResponse.data;
        }
      );

      const feedbacks = await Promise.all(feedbackPromises);
      setFeedbacks(feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      showToast.error("Failed to load feedbacks. Please try again.");
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
      const apiData = {
        ...feedbackData,
        customer: user?.email,
        subject: feedbackData.subject,
        description: feedbackData.description,
        issue_type: feedbackData.issue_type,
        priority: feedbackData.priority,
        status: "Open",
      };

      Object.keys(apiData as Record<string, any>).forEach(
        (key) =>
          (apiData as Record<string, any>)[key] === undefined &&
          delete (apiData as Record<string, any>)[key]
      );

      await frappeAPI.createFeedback(apiData);

      showToast.success("Feedback submitted successfully!");
      await fetchFeedbacks(); // Refresh the list
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast.error("Failed to submit feedback. Please try again.");
      throw error;
    }
  };

  // In FeedbackComponent, update the state management
  const handleViewFeedback = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setShowDetails(true);
    setShowList(false); // Close the list when viewing details
  };

  const handleNewFeedback = () => {
    setShowForm(true);
    setShowList(false);
  };

  const handleCloseDetails = () => {
    setSelectedFeedback(null);
    setShowDetails(false);
    setShowList(true); // Show the list again when closing details
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowList(true);
  };

  return (
    <>
      <div
        className={className}
        onClick={() => setShowList(true)}
        style={{ cursor: "pointer" }}
      >
        {children}
      </div>

      <FeedbackList
        isOpen={showList}
        onClose={() => setShowList(false)}
        feedbacks={feedbacks}
        loading={loading}
        onViewFeedback={handleViewFeedback}
        onNewFeedback={handleNewFeedback}
      />
      <FeedbackForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitFeedback}
      />
      {selectedFeedback && (
        <FeedbackDetails
          feedback={selectedFeedback}
          onClose={handleCloseDetails}
        />
      )}
    </>
  );
};

export default FeedbackComponent;
