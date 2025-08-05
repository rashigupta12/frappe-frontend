/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAssignStore } from "../../store/assign";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

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
  console.log("todoData", todoData);
  const { fetchInspectors, inspectors, updateTodo } = useAssignStore();
  // const [showPropertyInfo, setShowPropertyInfo] = useState(false);
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
        inspectionDate: todoData.date
          ? format(new Date(todoData.date), "yyyy-MM-dd")
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-emerald-600 p-4 text-white rounded-t-lg sticky top-0 z-10">
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
        <div className="p-4 space-y-2">
          {/* Customer Details */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Customer Details</h3>
            <div className="text-sm">
              {todoData?.inquiry_data?.lead_name ||
              todoData?.inquiry_data?.mobile_no ||
              todoData?.inquiry_data?.email ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      todoData?.inquiry_data?.lead_name,
                      todoData?.inquiry_data?.mobile_no,
                      todoData?.inquiry_data?.email,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              ) : (
                <div className="text-gray-500">
                  No customer details available
                </div>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Job Details</h3>
            <div className="text-sm">
              {todoData?.inquiry_data?.custom_job_type ||
              todoData?.inquiry_data?.custom_project_urgency ||
              todoData?.inquiry_data?.custom_budget_range ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      todoData?.inquiry_data?.custom_job_type,
                      todoData?.inquiry_data?.custom_project_urgency,
                      todoData?.inquiry_data?.custom_budget_range,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Property Information</h3>
            <div className="text-sm">
              <div className="break-words">
                <span className="text-gray-900">
                  {[
                    todoData?.inquiry_data?.custom_building_name,
                    todoData?.inquiry_data?.custom_property_area,
                    todoData?.inquiry_data?.custom_property_type,
                    todoData?.inquiry_data?.custom_type_of_building,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </span>
              </div>
            </div>
          </div>

          {/* Inspection Schedule */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Inspection Schedule</h3>
            <div className="text-sm">
              {todoData?.inquiry_data?.custom_preferred_inspection_date ||
              todoData?.inquiry_data?.custom_preferred_inspection_time ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      todoData?.inquiry_data?.custom_preferred_inspection_date
                        ? format(
                            new Date(
                              todoData.inquiry_data.custom_preferred_inspection_date
                            ),
                            "dd/MM/yyyy"
                          )
                        : null,
                      todoData?.inquiry_data?.custom_preferred_inspection_time,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-2">
            {/* Inspector Selection */}
            <div className="space-y-2 p-4 py-2 bg-gray-50 rounded-lg">
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
                        <span className="font-medium">
                          {inspector.full_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Priority */}
            <div className="grid grid-cols-1 gap-2 px-4 bg-gray-50 rounded-lg">
              <div>
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
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>High</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative">
                <Label className="text-gray-700 text-sm font-medium">
                  Inspection Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal bg-white border border-gray-300 text-sm h-10"
                    >
                      {formData.inspectionDate ? (
                        <>
                          <span className="text-gray-900">
                            {format(
                              new Date(formData.inspectionDate),
                              "dd/MM/yyyy"
                            )}
                          </span>
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">Select date</span>
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                        </>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-md">
                    <Calendar
                      mode="single"
                      selected={
                        formData.inspectionDate
                          ? new Date(formData.inspectionDate)
                          : undefined
                      }
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          handleSelectChange(
                            "inspectionDate",
                            selectedDate.toISOString().split("T")[0] // yyyy-mm-dd
                          );
                        }
                      }}
                      initialFocus
                      disabled={(date) => {
                        // Disable dates before today
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      modifiers={{
                        highlighted: formData.inspectionDate
                          ? new Date(formData.inspectionDate)
                          : undefined,
                      }}
                      modifiersStyles={{
                        highlighted: {
                          backgroundColor: "#3b82f6", // blue-500
                          color: "white",
                          borderRadius: "4px",
                        },
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="space-y-2 p-4 py-2 bg-gray-50 rounded-lg">
              <Label className="text-gray-700 text-sm font-medium">
                Notes/Special Requirements
              </Label>
              <Textarea
                value={formData.specialRequirements}
                onChange={(e) => handleChange(e)}
                name="specialRequirements"
                placeholder="Enter any special requirements or notes..."
                rows={3}
                className="w-full border border-gray-300 rounded-md bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            {mode === "edit" && (
              <Button
                type="submit"
                onClick={handleSubmit}
                className="px-6 bg-emerald-700 text-white hover:bg-emerald-800"
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
