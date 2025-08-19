/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Check,
  ChevronDown
} from "lucide-react";
import { useState } from "react";



// Multi-Select Dropdown Component for Job Types
export const MultiSelectJobTypes = ({
  jobTypes,
  selectedJobTypes,
  onSelectionChange,
  placeholder = "Select job types",
}: {
  jobTypes: { name: string }[];
  selectedJobTypes: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (jobTypeName: string) => {
    const isSelected = selectedJobTypes.includes(jobTypeName);
    if (isSelected) {
      onSelectionChange(selectedJobTypes.filter(type => type !== jobTypeName));
    } else {
      onSelectionChange([...selectedJobTypes, jobTypeName]);
    }
  };

  const displayText = selectedJobTypes.length > 0 
    ? selectedJobTypes.length === 1 
      ? selectedJobTypes[0]
      : `${selectedJobTypes.length} job types selected`
    : placeholder;

  return (
    <div className="relative">
      <div
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1 text-sm cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedJobTypes.length === 0 ? "text-black" : "text-black"}>
          {displayText}
        </span>
        <ChevronDown className={`h-4 w-4 text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto pb-20 ">
          {jobTypes.map((jobType) => (
            <div
              key={jobType.name}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer "
              onClick={() => handleToggle(jobType.name)}
            >
              <div className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded ">
                {selectedJobTypes.includes(jobType.name) && (
                  <Check className="h-3 w-3 text-emerald-600" />
                )}
              </div>
              <span className="text-sm">{jobType.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};