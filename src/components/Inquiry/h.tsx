"use client";

import {
  Building,
  Calendar,
  Edit,
  FileText,
  // Filter,
  Home,
  MapPin,
  Phone,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLeads, type Lead } from "../../context/LeadContext";
import {
  formatDate,
  formatDateCompact,
  getBudgetColor,
  getJobTypeColor,
  getUrgencyColor,
  getUrgencyShortLabel,
} from "../../helpers/helper";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
import InquiryForm from "./InquiryForm";
import IspectionDialog from "./IspectionDialog";

const InquiryPage = () => {
  const {
    leads,
    error,
    fetchLeads,
    // jobTypes,
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

  // States for InquiryForm component
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Lead | null>(null);

  // Fixed: Handle opening dialog with correct inquiry
  const handleOpenDialog = (inquiry: Lead) => {
    setSelectedInquiryForDialog(inquiry);
    setIsDialogOpen(true);
  };

  // Fixed: Handle closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedInquiryForDialog(null);
  };

  useEffect(() => {
    fetchLeads();
    fetchJobTypes();
    if (fetchProjectUrgency) {
      fetchProjectUrgency();
    }
    if (fetchUtmSource) {
      fetchUtmSource();
    }
  }, [fetchLeads, fetchJobTypes, fetchProjectUrgency, fetchUtmSource]);

  // Function to open form for new inquiry
  const openNewInquiryForm = () => {
    setSelectedInquiry(null);
    setIsFormOpen(true);
  };

  // Function to open form for editing existing inquiry
  const openEditInquiryForm = (inquiry: Lead) => {
    setSelectedInquiry(inquiry);
    setIsFormOpen(true);
  };

  // Function to close form
  const closeInquiryForm = () => {
    setIsFormOpen(false);
    setSelectedInquiry(null);
  };

  const openViewModal = (inquiry: Lead) => {
    setViewInquiry(inquiry);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewInquiry(null);
  };

  // Updated filtering logic - removed duplicate job type filter and added job type to search
  const filteredInquiries = leads
    .filter((inquiry: Lead) => inquiry.status === "Lead")
    .filter(
      (inquiry: Lead) =>
        (inquiry.lead_name?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (inquiry.email_id?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (inquiry.mobile_no?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (inquiry.custom_job_type?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        )
    );

  return (
    <div className="w-full pb-20">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm p-3 mb-2 border border-emerald-100">
        <div className="flex flex-col gap-2">
          {/* Filters and Search */}
          <div className="bg-white rounded-md">
            {/* Desktop View */}
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="relative flex-[7]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by customer name, email, phone, or job type"
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                onClick={openNewInquiryForm}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 "
              >
                <Plus className="h-3 w-3 mr-1" />
                Create New Inquiry
              </Button>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex items-center gap-2 w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, phone, job type"
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry List */}
      <div className="">
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-500 lg:py-12 lg:px-6">
            <div className="inline-flex items-center justify-center bg-emerald-50/50 rounded-full p-3 mb-3 lg:p-4 lg:mb-4">
              <FileText className="h-6 w-6 lg:h-7 lg:w-7 text-emerald-500" />
            </div>
            <h3 className="text-base lg:text-lg font-medium text-gray-700 mb-1">
              No inquiries found
            </h3>
            <p className="text-xs lg:text-sm text-gray-500 mb-4">
              Start by creating your first inquiry
            </p>
            <Button
              onClick={openNewInquiryForm}
              className="mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 text-sm lg:text-base lg:px-6 lg:py-2"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1 lg:h-4 lg:w-4" />
              Create New Inquiry
            </Button>
          </div>
        ) : (
          <div className="space-y-3 p-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.name}
                onClick={(e) => {
                  e.stopPropagation();
                  openViewModal(inquiry);
                }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 border border-gray-300 shadow-2xs hover:shadow-sm hover:border-emerald-100 transition-all duration-300 cursor-pointer group lg:p-4 lg:hover:shadow-md"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div className="bg-emerald-100/50 text-emerald-800 rounded-md p-1.5 mt-0.5 flex-shrink-0 ">
                      <User className="h-4 w-4 lg:h-4 lg:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4 className="font-semibold text-sm  text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                          {inquiry.lead_name}
                        </h4>
                        {inquiry.custom_job_type && (
                          <Badge
                            variant="outline"
                            className="text-xs  px-1.5 py-0.5 rounded-full border shadow-none self-start sm:self-auto"
                            style={{
                              backgroundColor:
                                getJobTypeColor(inquiry.custom_job_type).bg +
                                "20",
                              color: getJobTypeColor(inquiry.custom_job_type)
                                .text,
                              borderColor: getJobTypeColor(
                                inquiry.custom_job_type
                              ).border,
                            }}
                          >
                            {inquiry.custom_job_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`tel:${inquiry.mobile_no}`}
                      className="flex items-center justify-center h-5 w-5 lg:h-5 lg:w-5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title={`Call ${inquiry.mobile_no}`}
                    >
                      <Phone className="h-3 w-3 lg:h-3 lg:w-3" />
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 w-5 lg:h-5 lg:w-5 p-0 bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditInquiryForm(inquiry);
                      }}
                    >
                      <Edit className="h-3 w-3 lg:h-3 lg:w-3" />
                    </Button>
                  </div>
                </div>

               <div className="mt-2 space-y-2">
                  {(inquiry.custom_project_urgency ||
                    inquiry.custom_budget_range) && (
                    <div className="flex items-center justify-between gap-2">
                      {inquiry.custom_project_urgency && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: getUrgencyColor(
                                inquiry.custom_project_urgency
                              ).bg,
                            }}
                          />
                          <span
                            className="text-xs font-medium truncate"
                            style={{
                              color: getUrgencyColor(
                                inquiry.custom_project_urgency
                              ).text,
                            }}
                          >
                            {getUrgencyShortLabel(
                              inquiry.custom_project_urgency
                            )}
                          </span>
                        </div>
                      )}
                      {inquiry.custom_budget_range && (
                        <Badge
                          variant="outline"
                          className="px-2 py-0.5 rounded-md text-xs font-medium shadow-none ml-auto"
                          style={{
                            backgroundColor:
                              getBudgetColor(inquiry.custom_budget_range).bg +
                              "15",
                            color: getBudgetColor(inquiry.custom_budget_range)
                              .text,
                            borderColor:
                              getBudgetColor(inquiry.custom_budget_range)
                                .border + "40",
                          }}
                        >
                          {inquiry.custom_budget_range}
                        </Badge>
                      )}
                    </div>
                  )}

                  {inquiry.custom_property_area && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 leading-tight flex-1 line-clamp-2">
                        {inquiry.custom_property_area}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    {inquiry.custom_preferred_inspection_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {formatDateCompact(
                            inquiry.custom_preferred_inspection_date
                          )}
                        </span>
                      </div>
                    )}

                    <div className="ml-auto">
                      {/* Fixed: Corrected the status logic */}
                      {inquiry.status === "Open" ? (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5 rounded-md text-emerald-600 border border-emerald-200 bg-emerald-50"
                        >
                          Assigned
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-none shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(inquiry);
                          }}
                        >
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed: Moved dialog outside of map and used correct inquiry state */}
      {isDialogOpen && selectedInquiryForDialog && (
        <IspectionDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          inquiry={selectedInquiryForDialog}
        />
      )}

      <InquiryForm
        isOpen={isFormOpen}
        onClose={closeInquiryForm}
        inquiry={selectedInquiry}
      />

      {/* View Modal */}
      {viewModalOpen && viewInquiry && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Inquiry Details</h3>

                {/* Fixed: Updated modal dialog logic */}
                <div className="flex items-center gap-2">
                  {/* {viewInquiry.status === "Open" ? (
                    <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                      Assigned
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs bg-white text-emerald-600 hover:bg-emerald-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(viewInquiry);
                      }}
                    >
                      Assign
                    </Button>
                  )} */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
                    onClick={closeViewModal}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  Contact Details
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">
                      {viewInquiry.lead_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <a
                      href={`mailto:${viewInquiry.email_id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {viewInquiry.email_id || "-"}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mobile:</span>
                    <a
                      href={`tel:${viewInquiry.mobile_no}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {viewInquiry.mobile_no || "-"}
                    </a>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Home className="h-5 w-5 text-emerald-600" />
                  Job Details
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Type:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_job_type || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget Range:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_budget_range || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Urgency:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_project_urgency || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5 text-emerald-600" />
                  Property Information
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_property_type || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building Type:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_type_of_building || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building Name:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_building_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building Number:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_bulding__apartment__villa__office_number ||
                        "-"}
                    </span>
                  </div>
                  {viewInquiry.custom_property_area && (
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="text-sm text-gray-800 mt-1">
                        {viewInquiry.custom_property_area}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inspection Schedule */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Inspection Schedule
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preferred Date:</span>
                    <span className="font-medium">
                      {formatDate(viewInquiry.custom_preferred_inspection_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preferred Time:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_preferred_inspection_time || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {viewInquiry.custom_special_requirements && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Special Requirements
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {viewInquiry.custom_special_requirements}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <Button
                onClick={() => {
                  closeViewModal();
                  openEditInquiryForm(viewInquiry);
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={closeViewModal}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiryPage;
