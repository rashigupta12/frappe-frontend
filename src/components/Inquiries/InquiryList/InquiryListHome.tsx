// src/components/InquiryPage.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLeads, type Lead } from "../../../context/LeadContext";
import { Alert, AlertDescription } from "../../ui/alert";
import InquiryHeader from "./InquiriesHeader";
import InquiryList from "./InquiryList";
import InspectionDialog from "../IspectionDialog";
import InquiryForm from "../Inquiry-Form/InquiryForm";
import InquiryViewModal from "./InquiryViewModal";

const InquiryPage = () => {
  const {
    leads,
    error,
    fetchLeads,
    fetchJobTypes,
    fetchProjectUrgency,
    fetchUtmSource,
  } = useLeads();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewInquiry, setViewInquiry] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInquiryForDialog, setSelectedInquiryForDialog] =
    useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Lead | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false); // --- Helper Functions (remain in parent for filtering) ---

  const normalizeJobType = useCallback(
    (jobType: string | { job_type: string }): string => {
      if (typeof jobType === "string") return jobType;
      return jobType.job_type;
    },
    []
  );

  const getJobTypesForInquiry = useCallback(
    (inquiry: Lead): string[] => {
      if (
        inquiry.custom_jobtype &&
        Array.isArray(inquiry.custom_jobtype) &&
        inquiry.custom_jobtype.length > 0
      ) {
        return inquiry.custom_jobtype.map(normalizeJobType);
      } else if (inquiry.custom_job_type) {
        return [normalizeJobType(inquiry.custom_job_type)];
      }
      return [];
    },
    [normalizeJobType]
  );

  const getJobTypesAsString = useCallback(
    (inquiry: Lead) => {
      const jobTypes = getJobTypesForInquiry(inquiry);
      return jobTypes.join(" ").toLowerCase();
    },
    [getJobTypesForInquiry]
  );

  const filteredInquiries = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    return leads
      .filter((inquiry: Lead) => inquiry.status === "Lead")
      .filter((inquiry: Lead) => {
        const searchLower = searchTerm.toLowerCase();
        const jobTypesString = getJobTypesAsString(inquiry);
        return (
          (inquiry.lead_name?.toLowerCase() || "").includes(searchLower) ||
          (inquiry.email_id?.toLowerCase() || "").includes(searchLower) ||
          (inquiry.mobile_no?.toLowerCase() || "").includes(searchLower) ||
          jobTypesString.includes(searchLower)
        );
      });
  }, [leads, searchTerm, getJobTypesAsString]); // --- Data Loading Effect ---

  const loadData = useCallback(async () => {
    if (hasInitialized) return;
    setIsLoading(true);
    try {
      const promises = [
        fetchLeads().catch((err) =>
          console.error("Error fetching leads:", err)
        ),
        fetchJobTypes().catch((err) =>
          console.error("Error fetching job types:", err)
        ),
      ];
      if (fetchProjectUrgency)
        promises.push(
          fetchProjectUrgency().catch((err) =>
            console.error("Error fetching project urgency:", err)
          )
        );
      if (fetchUtmSource)
        promises.push(
          fetchUtmSource().catch((err) =>
            console.error("Error fetching UTM source:", err)
          )
        );
      await Promise.allSettled(promises);
      setHasInitialized(true);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchLeads,
    fetchJobTypes,
    fetchProjectUrgency,
    fetchUtmSource,
    hasInitialized,
  ]);

  useEffect(() => {
    let isMounted = true;
    const initializeData = async () => {
      if (isMounted) await loadData();
    };
    initializeData();
    return () => {
      isMounted = false;
    };
  }, [loadData]); // --- Handlers for modals and dialogs ---

  const handleOpenDialog = useCallback((inquiry: Lead) => {
    setSelectedInquiryForDialog(inquiry);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedInquiryForDialog(null);
  }, []);

  const openNewInquiryForm = useCallback(() => {
    setSelectedInquiry(null);
    setIsFormOpen(true);
  }, []);

  const openEditInquiryForm = useCallback((inquiry: Lead) => {
    setSelectedInquiry(inquiry);
    setIsFormOpen(true);
  }, []);

  const closeInquiryForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedInquiry(null);
  }, []);

  const openViewModal = useCallback((inquiry: Lead) => {
    setViewInquiry(inquiry);
    setViewModalOpen(true);
  }, []);

  const closeViewModal = useCallback(() => {
    setViewModalOpen(false);
    setViewInquiry(null);
  }, []);

  return (
    <div className="w-full pb-20">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <InquiryHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenNewInquiry={openNewInquiryForm}
        isLoading={isLoading}
      />

      <InquiryList
        inquiries={filteredInquiries}
        isLoading={isLoading}
        searchTerm={searchTerm}
        openViewModal={openViewModal}
        openEditInquiryForm={openEditInquiryForm}
        handleOpenDialog={handleOpenDialog}
        openNewInquiryForm={openNewInquiryForm}
        getJobTypesForInquiry={getJobTypesForInquiry}
      />

      {isDialogOpen && selectedInquiryForDialog && (
        <InspectionDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          data={selectedInquiryForDialog}
          mode="create"
        />
      )}

      {isFormOpen && (
        <InquiryForm
          isOpen={isFormOpen}
          onClose={closeInquiryForm}
          inquiry={selectedInquiry}
        />
      )}

      {viewModalOpen && viewInquiry && (
        <InquiryViewModal
          inquiry={viewInquiry}
          onClose={closeViewModal}
          onEdit={openEditInquiryForm}
          getJobTypesForInquiry={getJobTypesForInquiry}
        />
      )}
    </div>
  );
};

export default InquiryPage;
