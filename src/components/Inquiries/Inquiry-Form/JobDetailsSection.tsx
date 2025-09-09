// src/components/JobDetailsSection.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LeadFormData } from "../../../context/LeadContext";
import { budgetRanges } from "../../../helpers/helper";
import { MultiSelectJobTypes } from "./MultiselectJobtypes";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import React from "react";

interface JobDetailsSectionProps {
  formData: LeadFormData;
  jobTypes: any[];
  projectUrgency: any[];
  utmSource: any[];
  showReferenceInput: boolean;
  onSelectChange: (name: string, value: string) => void;
  onJobTypesChange: (selected: string[]) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const JobDetailsSection: React.FC<JobDetailsSectionProps> = ({
  formData,
  jobTypes,
  projectUrgency,
  utmSource,
  showReferenceInput,
  onSelectChange,
  onJobTypesChange,
  handleInputChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Job Types */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-800">
          Job Types <span className="text-red-500">*</span>
        </Label>
        <MultiSelectJobTypes
          jobTypes={jobTypes}
          selectedJobTypes={formData.custom_jobtype || []}
          onSelectionChange={onJobTypesChange}
          placeholder="Select job types"
        />
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <Label
          htmlFor="custom_budget_range"
          className="text-sm font-semibold text-gray-800"
        >
          Budget Range
        </Label>
        <Select
          value={formData.custom_budget_range || ""}
          onValueChange={(value) => onSelectChange("custom_budget_range", value)}
        >
          <SelectTrigger className="w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200">
            <SelectValue placeholder="Select budget range" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {budgetRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Urgency */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-800">
          Project Urgency
        </Label>
        <Select
          value={formData.custom_project_urgency || ""}
          onValueChange={(value) => onSelectChange("custom_project_urgency", value)}
        >
          <SelectTrigger className="w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200">
            <SelectValue placeholder="Select urgency" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {projectUrgency.map((urgency) => (
              <SelectItem key={urgency.name} value={urgency.name}>
                {urgency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Source of Inquiry & Reference */}
      <div className="space-y-2">
        <Label
          htmlFor="source"
          className="text-sm font-semibold text-gray-800"
        >
          Source Of Inquiry
        </Label>
        <Select
          value={formData.source || ""}
          onValueChange={(value) => onSelectChange("source", value)}
        >
          <SelectTrigger className="w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200">
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {[...utmSource]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((utms) => (
                <SelectItem key={utms.name} value={utms.name}>
                  {utms.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {showReferenceInput && (
          <div className="mt-4">
            <Label
              htmlFor="custom_reference_name"
              className="text-sm font-semibold text-gray-800"
            >
              Reference Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="custom_reference_name"
              name="custom_reference_name"
              value={formData.custom_reference_name || ""}
              onChange={handleInputChange}
              required
              placeholder="Enter reference name"
              className="w-full rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};