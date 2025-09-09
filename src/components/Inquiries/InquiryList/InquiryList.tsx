// src/components/InquiryList.tsx

import React from "react";
import { FileText, Plus } from "lucide-react";
import { type Lead } from "../../../context/LeadContext";
import { Button } from "../../ui/button";
import SkeletonCard from "./SkeletonCard";
import InquiryCard from "./InquiryCard";
import InquiryTable from "./InquiryTable";

interface InquiryListProps {
  inquiries: Lead[];
  isLoading: boolean;
  searchTerm: string;
  openViewModal: (inquiry: Lead) => void;
  openEditInquiryForm: (inquiry: Lead) => void;
  handleOpenDialog: (inquiry: Lead) => void;
  openNewInquiryForm: () => void;
  getJobTypesForInquiry: (inquiry: Lead) => string[];
}

const InquiryList: React.FC<InquiryListProps> = ({
  inquiries,
  isLoading,
  searchTerm,
  openViewModal,
  openEditInquiryForm,
  handleOpenDialog,
  openNewInquiryForm,
  getJobTypesForInquiry,
}) => {
  const cardView = (
    <div className="space-y-3  block lg:hidden">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))
      ) : inquiries.length === 0 ? (
        // No inquiries UI
        <div className="text-center py-8 px-4 text-gray-500">
          {/* ...  same as existing no inquiries UI  ... */}
          <div className="text-center py-8 px-4 text-gray-500 lg:py-12 lg:px-6 col-span-2">
            <div className="inline-flex items-center justify-center bg-emerald-50/50 rounded-full p-3 mb-3 lg:p-4 lg:mb-4">
              <FileText className="h-6 w-6 lg:h-7 lg:w-7 text-emerald-500" />
            </div>

            <h3 className="text-base lg:text-lg font-medium text-gray-700 mb-1">
              No inquiries found
            </h3>
            <p className="text-xs lg:text-sm text-gray-500 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by creating your first inquiry"}
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
        </div>
      ) : (
        inquiries.map((inquiry) => (
          <InquiryCard
            key={inquiry.name}
            inquiry={inquiry}
            openViewModal={openViewModal}
            openEditInquiryForm={openEditInquiryForm}
            handleOpenDialog={handleOpenDialog}
            getJobTypesForInquiry={getJobTypesForInquiry}
          />
        ))
      )}
    </div>
  );

  // Desktop/Table view
  const tableView = (
    <div className="hidden lg:block p-2">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))
      ) : inquiries.length === 0 ? (
        <div className="text-center py-8 px-4 text-gray-500 lg:py-12 lg:px-6">
          <div className="text-center py-8 px-4 text-gray-500 lg:py-12 lg:px-6 col-span-2">
            <div className="inline-flex items-center justify-center bg-emerald-50/50 rounded-full p-3 mb-3 lg:p-4 lg:mb-4">
              <FileText className="h-6 w-6 lg:h-7 lg:w-7 text-emerald-500" />
            </div>

            <h3 className="text-base lg:text-lg font-medium text-gray-700 mb-1">
              No inquiries found
            </h3>
            <p className="text-xs lg:text-sm text-gray-500 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by creating your first inquiry"}
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
        </div>
      ) : (
        <InquiryTable
          inquiries={inquiries}
          openViewModal={openViewModal}
          openEditInquiryForm={openEditInquiryForm}
          handleOpenDialog={handleOpenDialog}
          getJobTypesForInquiry={getJobTypesForInquiry}
        />
      )}
    </div>
  );
  return (
    <>
      {cardView}
      {tableView}
    </>
  );
};

export default InquiryList;
