// src/components/JobDetailsSection.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Clock,
  Tag,
  Users
} from "lucide-react";
import React from "react";
import type { LeadFormData } from "../../../context/LeadContext";
import { budgetRanges } from "../../../helpers/helper";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { MultiSelectJobTypes } from "./MultiselectJobtypes";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
      {/* Job Types */}
      <div className="space-y-2">
        <MultiSelectJobTypes
          jobTypes={jobTypes}
          selectedJobTypes={formData.custom_jobtype || []}
          onSelectionChange={onJobTypesChange}
          placeholder="Job Types"
        />
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <Select
          value={formData.custom_budget_range || ""}
          onValueChange={(value) => onSelectChange("custom_budget_range", value)}
        >
          <SelectTrigger className="w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Budget Range" className="text-black placeholder:text-gray-500" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
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
        <Select
          value={formData.custom_project_urgency || ""}
          onValueChange={(value) => onSelectChange("custom_project_urgency", value)}
        >
          <SelectTrigger className="w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Urgency" className="text-black placeholder:text-gray-500" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
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
        <Select
          value={formData.source || ""}
          onValueChange={(value) => onSelectChange("source", value)}
        >
          <SelectTrigger className="w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Source" className="text-black placeholder:text-gray-500" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
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
          <div className="mt-4 relative">
            <Users className="h-4 w-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              id="custom_reference_name"
              name="custom_reference_name"
              value={formData.custom_reference_name || ""}
              onChange={handleInputChange}
              required
              placeholder="Reference name" 
              className="w-full rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-200 pl-10 text-black"
            />
          </div>
        )}
      </div>
    </div>
  );
};