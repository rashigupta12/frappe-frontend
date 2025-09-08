/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LeadFormData } from "../../../context/LeadContext";
import { budgetRanges } from "../../../helpers/helper";
import { MultiSelectJobTypes } from "./MultiselectJobtypes";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";


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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-md font-medium text-gray-700 mb-1">
          Job Types <span className="text-red-500">*</span>
        </Label>
        <MultiSelectJobTypes
          jobTypes={jobTypes}
          selectedJobTypes={formData.custom_jobtype || []}
          onSelectionChange={onJobTypesChange}
          placeholder="Select job types"
        />
      </div>

      <div>
        <Label
          htmlFor="custom_budget_range"
          className="text-md font-medium text-gray-700 mb-1"
        >
          Budget Range{" "}
        </Label>
        <Select
          value={formData.custom_budget_range || ""}
          onValueChange={(value) => onSelectChange("custom_budget_range", value)}
        >
          <SelectTrigger className="w-full text-md">
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

      <div>
        <Label className="text-md font-medium text-gray-700 mb-1">
          Project Urgency{" "}
        </Label>
        <Select
          value={formData.custom_project_urgency || ""}
          onValueChange={(value) => onSelectChange("custom_project_urgency", value)}
        >
          <SelectTrigger className="w-full text-md ">
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

      <div className="col-span-1 md:col-span-2">
        <Label
          htmlFor="source"
          className="text-md font-medium text-gray-700 mb-1"
        >
          Source Of Inquiry{" "}
        </Label>
        <Select
          value={formData.source || ""}
          onValueChange={(value) => onSelectChange("source", value)}
        >
          <SelectTrigger className="w-full text-md">
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
              className="text-md font-medium text-gray-700"
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
            />
          </div>
        )}
      </div>
    </div>
  );
};