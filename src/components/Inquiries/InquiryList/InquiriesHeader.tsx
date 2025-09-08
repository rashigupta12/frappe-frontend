// src/components/InquiryHeader.tsx

import { Plus, Search } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import React from "react";

interface InquiryHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenNewInquiry: () => void;
  isLoading: boolean;
}

const InquiryHeader: React.FC<InquiryHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onOpenNewInquiry,
  isLoading,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="bg-white shadow-sm p-3 mb-2 border border-emerald-100">

      <div className="flex flex-col gap-2">
    
        <div className="bg-white rounded-md">

          <div className="hidden md:flex items-center gap-4 w-full">

            <div className="relative flex-[7]">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by customer name, email, phone, or job types"
                className="pl-10 w-full bg-white border border-gray-300"
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isLoading}
              />

            </div>

            <Button
              onClick={onOpenNewInquiry}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create New Inquiry
            </Button>
           
          </div>

          <div className="md:hidden flex items-center gap-2 w-full">
           
            <div className="relative w-full">
    
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

              <Input
                type="text"
                placeholder="Search by name, email, phone, job types"
                className="pl-10 w-full bg-white border border-gray-300"
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isLoading}
              />

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default InquiryHeader;
