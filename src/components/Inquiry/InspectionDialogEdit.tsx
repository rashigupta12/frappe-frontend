/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "../ui/button";

import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { format } from "date-fns";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useAssignStore } from "../../store/assign";
import { Input } from "../ui/input";
import toast from "react-hot-toast";

interface InspectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  todoData: any;
  mode: "edit" | "create";
}

export default function InspectionDialog({
  isOpen,
  onClose,
  todoData,
  mode,
}: InspectionDialogProps) {
  const { fetchInspectors, inspectors , updateTodo} = useAssignStore();
  const [showPropertyInfo, setShowPropertyInfo] = useState(false);
  const [formData, setFormData] = useState({
    leadName: "",
    inspector: "",
    priority: "",
    status: "",
    inspectionDate: "",
    inspectionTime: "",
    propertyArea: "",
    specialRequirements: "",
    jobType: "",
    projectUrgency: "",
    propertyType: "",
    buildingType: "",
    unitNumber: "",
    phone: "",
    budgetRange: "",
  });
  useEffect(() => {
    fetchInspectors();
  }, [fetchInspectors]);
  useEffect(() => {
    if (todoData) {
      setFormData({
        leadName: todoData.inquiry_data?.lead_name || todoData.reference_name,
        inspector: todoData.allocated_to,
        priority: todoData.priority,
        status: todoData.status,
        inspectionDate: todoData.inquiry_data?.custom_preferred_inspection_date
          ? format(
              new Date(todoData.inquiry_data.custom_preferred_inspection_date),
              "yyyy-MM-dd"
            )
          : "",
        inspectionTime:
          todoData.inquiry_data?.custom_preferred_inspection_time || "",
        propertyArea: todoData.inquiry_data?.custom_property_area || "",
        specialRequirements:
          todoData.inquiry_data?.custom_special_requirements || "",
        jobType: todoData.inquiry_data?.custom_job_type || "",
        projectUrgency: todoData.inquiry_data?.custom_project_urgency || "",
        propertyType: todoData.inquiry_data?.custom_property_type || "",
        buildingType: todoData.inquiry_data?.custom_type_of_building || "",
        unitNumber:
          todoData.inquiry_data
            ?.custom_bulding__apartment__villa__office_number || "",
        phone: todoData.inquiry_data?.mobile_no || "",
        budgetRange: todoData.inquiry_data?.custom_budget_range || "",
      });
    }
  }, [todoData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "edit") {
      await updateTodo(todoData.name, formData);
      toast.success("Inspection updated successfully!");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {mode === "edit" ? "Edit Inspection" : "Inspection Details"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 ">
          {/* Basic Information - Static */}
          {/* <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-sm">
              <div className="break-words">
                <Label className="font-medium text-gray-600">Name:</Label>
                <div className="ml-2 text-gray-900 mt-1 p-2 bg-white rounded border border-gray-200">
                  {formData.leadName || "N/A"}
                </div>
              </div>
              <div className="break-words">
                <Label className="font-medium text-gray-600">Phone:</Label>
                <div className="ml-2 text-gray-900 mt-1 p-2 bg-white rounded border border-gray-200">
                  {formData.phone || "N/A"}
                </div>
              </div>
              <div className="break-words">
                <Label className="font-medium text-gray-600">Job Type:</Label>
                <div className="ml-2 text-gray-900 mt-1 p-2 bg-white rounded border border-gray-200">
                  {formData.jobType || "N/A"}
                </div>
              </div>
              <div className="break-words">
                <Label className="font-medium text-gray-600">
                  Budget Range:
                </Label>
                <div className="ml-2 text-gray-900 mt-1 p-2 bg-white rounded border border-gray-200">
                  {formData.budgetRange || "N/A"}
                </div>
              </div>
            </div>
          </div> */}

          <div className="bg-gray-50 p-4  rounded-lg">
            <h3 className="font-medium text-gray-900 ">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2  text-sm">
              <div className="break-words">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900">
                  {todoData?.inquiry_data?.lead_name || "N/A"}
                </span>
              </div>
              <div className="break-words">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="ml-2 text-gray-900">
                  {todoData?.inquiry_data?.mobile_no || "N/A"}
                </span>
              </div>
              <div className="break-words">
                <span className="font-medium text-gray-600">Job Type:</span>
                <span className="ml-2 text-gray-900">
                  {todoData?.inquiry_data?.custom_job_type || "N/A"}
                </span>
              </div>
            </div>
            <div className="break-words">
              <span className="font-medium text-gray-600">Budget Range:</span>
              <span className="ml-2 text-gray-900">
                {todoData?.inquiry_data?.custom_budget_range || "N/A"}
              </span>
            </div>
          </div>

          {/* Property Information - Static */}
          <div className="bg-gray-50 rounded-lg">
            <button
              onClick={() => setShowPropertyInfo(!showPropertyInfo)}
              className="w-full px-4 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
            >
              <h3 className="font-medium text-gray-900">
                Property & Project Details
              </h3>
              {showPropertyInfo ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>

            {showPropertyInfo && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="grid grid-cols-1 gap-3 text-sm mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Property Type:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {todoData?.inquiry_data?.custom_property_type || "N/A"}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Building Type:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {todoData?.inquiry_data?.custom_building_type || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Budget Range:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {todoData?.inquiry_data?.custom_budget_range || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Project Urgency:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {todoData?.inquiry_data?.custom_project_urgency || "N/A"}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Location:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {todoData?.inquiry_data?.custom_location || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Preferred Date:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {todoData?.inquiry_data?.custom_preferred_inspection_date || "N/A"}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Preferred Time:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {todoData?.inquiry_data?.custom_preferred_inspection_time || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* {formData. && (
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Building Name:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry.custom_building_name}
                      </span>
                    </div>
                  )} */}
                </div>
              </div>
            )}
          </div>

          {/* Editable Todo Information */}
          <div className="space-y-4 mt-4">
           
            {/* Inspector */}
            <div className="space-y-2 px-4">
              <Label className="text-gray-700 text-sm font-medium">
                Inspector <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.inspector}
                onValueChange={(value) =>
                  handleSelectChange("inspector", value)
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 max-h-[200px] overflow-y-auto">
                  {inspectors.map((inspector) => (
                    <SelectItem
                      key={inspector.email}
                      value={inspector.name || inspector.name}
                      className="break-words"
                    >
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-medium">{inspector.full_name}</span>
                          
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.inspector && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>Current:</span>
                  <span className="font-medium">{formData.inspector}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 ">
              {/* Inspection Date - Uncomment if needed */}
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm font-medium">
                  Inspection Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => handleChange(e)}
                  name="inspectionDate"
                />
              </div>

              {/* Priority Selector */}
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm font-medium">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    handleSelectChange("priority", value)
                  }
                >
                  <SelectTrigger className="w-full bg-white border border-gray-300">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Low</span>
                        {formData.priority === "Low" && (
                          <span className="ml-auto text-xs text-gray-500">
                            Current
                          </span>
                        )}
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Medium</span>
                        {formData.priority === "Medium" && (
                          <span className="ml-auto text-xs text-gray-500">
                            Current
                          </span>
                        )}
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>High</span>
                        {formData.priority === "High" && (
                          <span className="ml-auto text-xs text-gray-500">
                            Current
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Notes/Special Requirements
              </Label>
              <Textarea
                value={formData.specialRequirements}
                onChange={(e) => handleChange(e)}
                name="specialRequirements"
                placeholder="Enter any special requirements or notes..."
                rows={3}
                className="w-full border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 w-full sm:w-auto"
            >
              Cancel
            </Button>
            {mode === "edit" && (
              <Button
                type="submit"
                onClick={handleSubmit}
                className="px-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 w-full sm:w-auto"
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
