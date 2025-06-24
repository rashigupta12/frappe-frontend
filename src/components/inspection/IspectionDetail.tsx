/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  CalendarIcon,
  Check,
  ClockIcon,
  Edit,
  Info,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";
import { frappeAPI } from "../../api/frappeClient";
import { useInspectionStore } from "../../store/inspectionStore";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Progress } from "../ui/progress";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  inspection_date: z.date(),
  inspection_time: z.string(),
  property_type: z.string(),
  site_photos: z.any().optional(),
  measurement_sketch: z.any().optional(),
  inspection_notes: z.string().optional(),
  site_dimensions: z
    .array(
      z.object({
        area_name: z.string(),
        dimensionsunits: z.string(),
        media: z.any().optional(),
      })
    )
    .optional(),
});

const uploadFile = async (file: File): Promise<string> => {
  try {
    const response = await frappeAPI.upload(file);
    if (!response.success) throw new Error(response.error || "Upload failed");

    const data = response.data;
    if (data && data.message)
      return data.message.file_url || data.message.file_name || "";
    if (typeof data === "object" && data !== null)
      return data.file_url || data.file_name || "";
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return parsed.file_url || parsed.file_name || "";
      } catch {
        return data;
      }
    }
    throw new Error("No file URL found in response");
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

const CreateInspection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { todo, inspection, mode = "create" } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(mode === "update");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    createInspection,
    updateTodoStatus,
    updateInspectionbyId,
    loading: storeLoading,
    fetchFirstInspectionByField,
    currentInspection,
    error: storeError,
  } = useInspectionStore();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inspection_date: new Date(),
      inspection_time: "",
      property_type: "Residential",
      site_photos: undefined,
      measurement_sketch: undefined,
      inspection_notes: "",
      site_dimensions: [] as Array<{
        area_name: string;
        dimensionsunits: string;
        media?: any;
      }>,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "site_dimensions",
  });

  const fetchLeadData = async (leadName: string) => {
    try {
      const response = await frappeAPI.getLeadById(leadName);
      setLeadData(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching lead data:", error);
      toast.error("Failed to fetch lead information");
      return null;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setDataLoaded(false);
        if (todo) {
          if (todo.inquiry_data?.custom_property_type) {
            form.setValue(
              "property_type",
              todo.inquiry_data.custom_property_type
            );
          }
          if (todo.reference_name) {
            await fetchFirstInspectionByField("lead", todo.reference_name);
          }
        } else if (inspection) {
          setIsUpdateMode(true);
          if (inspection.lead) {
            const fetchedLeadData = await fetchLeadData(inspection.lead);
            if (fetchedLeadData?.custom_property_type) {
              form.setValue(
                "property_type",
                fetchedLeadData.custom_property_type
              );
            }
          }
        } else {
          toast.error("No data provided for inspection");
          navigate("/inspector?tab=todos");
          return;
        }
        setDataLoaded(true);
      } catch (error) {
        console.error("Error initializing data:", error);
        toast.error("Failed to initialize inspection data");
      }
    };
    initializeData();
  }, [todo, inspection]);

  useEffect(() => {
    if (dataLoaded) {
      const inspectionToUse = inspection || currentInspection;
      if (inspectionToUse) {
        setIsUpdateMode(true);
        if (inspectionToUse.inspection_date) {
          try {
            const parsedDate = parseISO(inspectionToUse.inspection_date);
            form.setValue("inspection_date", parsedDate);
          } catch (error) {
            console.error("Error parsing inspection date:", error);
          }
        }
        if (inspectionToUse.inspection_time)
          form.setValue("inspection_time", inspectionToUse.inspection_time);
        if (inspectionToUse.property_type)
          form.setValue("property_type", inspectionToUse.property_type);
        if (inspectionToUse.inspection_notes)
          form.setValue("inspection_notes", inspectionToUse.inspection_notes);
        if (inspectionToUse.site_photos)
          form.setValue("site_photos", inspectionToUse.site_photos);
        if (inspectionToUse.measurement_sketch)
          form.setValue(
            "measurement_sketch",
            inspectionToUse.measurement_sketch
          );
        if (
          inspectionToUse.site_dimensions &&
          Array.isArray(inspectionToUse.site_dimensions)
        ) {
          const formattedDimensions = inspectionToUse.site_dimensions.map(
            (dim: any) => ({
              area_name: dim.area_name || "",
              dimensionsunits: dim.dimensionsunits || "",
              media: dim.media || undefined,
            })
          );
          replace(formattedDimensions);
        }
      } else {
        setIsUpdateMode(false);
      }
    }
  }, [currentInspection, inspection, dataLoaded, form, replace]);

  const handleFileUpload = async (
    file: File,
    fieldName: string,
    index?: number
  ) => {
    if (!file) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading("Uploading file...", { id: "upload" });

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) throw new Error("File size exceeds 10MB limit");

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "File type not supported. Please use JPEG, PNG, GIF, or PDF."
        );
      }

      const interval = setInterval(() => {
        setUploadProgress((prev) =>
          prev >= 90 ? (clearInterval(interval), prev) : prev + 10
        );
      }, 300);

      const fileUrl = await uploadFile(file);
      setUploadProgress(100);
      clearInterval(interval);

      if (!fileUrl) throw new Error("File uploaded but no URL returned");

      if (index !== undefined) {
        form.setValue(`site_dimensions.${index}.media`, fileUrl);
      } else {
        form.setValue(fieldName as any, fileUrl);
      }

      toast.dismiss(toastId);
      toast.success("File uploaded successfully!");
      form.trigger(fieldName as any);
    } catch (error) {
      toast.dismiss("upload");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast.error(errorMessage);
      console.error("File upload error:", error);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const inspectionToUpdate = inspection || currentInspection;
      const leadReference = todo?.reference_name || inspection?.lead;
      const customerName =
        todo?.inquiry_data?.lead_name ||
        leadData?.lead_name ||
        inspection?.customer_name;

      const inspectionData = {
        ...values,
        lead: leadReference,
        customer_name: customerName,
        inspection_date: format(values.inspection_date, "yyyy-MM-dd"),
        inspection_time: values.inspection_time,
        doctype: "SiteInspection",
        site_dimensions: values.site_dimensions?.map((dim) => ({
          area_name: dim.area_name,
          dimensionsunits: dim.dimensionsunits,
          media: typeof dim.media === "string" ? dim.media : "",
        })),
      };

      if (isUpdateMode && inspectionToUpdate?.name) {
        await updateInspectionbyId(inspectionToUpdate.name, inspectionData);
        toast.success("Inspection updated successfully!");
      } else {
        await createInspection(inspectionData, todo?.name);
        toast.success("Inspection created successfully!");
      }
      navigate("/inspector?tab=inspections");
    } catch (error) {
      const message = isUpdateMode
        ? "Failed to update inspection"
        : "Failed to create inspection";
      toast.error(`${message}. Please try again.`);
      console.error("Error with inspection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTodo = async () => {
    try {
      setCancelling(true);
      if (todo?.name) {
        await updateTodoStatus(todo.name, "Cancelled");
        toast.success("Todo cancelled successfully!");
        navigate("/inspector?tab=todos");
      }
    } catch (error) {
      toast.error("Failed to cancel todo. Please try again.");
      console.error("Error cancelling todo:", error);
    } finally {
      setCancelling(false);
    }
  };

  const getFileDisplayName = (fileUrl: string) => {
    if (!fileUrl) return "";
    const parts = fileUrl.split("/");
    return parts[parts.length - 1] || "Uploaded file";
  };

  const getDisplayData = () => {
    if (todo) {
      return {
        customerName: todo.inquiry_data?.lead_name || "Lead",
        leadDetails: todo.inquiry_data,
        showTodoActions: true,
      };
    } else if (inspection) {
      return {
        customerName: leadData?.lead_name || inspection.customer_name || "Lead",
        leadDetails: leadData,
        showTodoActions: false,
      };
    }
    return null;
  };

  const displayData = getDisplayData();

  if (!displayData) {
    return (
      <div className=" max-w-md mx-auto">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>Inspection Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 space-y-4">
            <h3 className="text-lg font-medium">
              No inspection data available
            </h3>
            <Button
              onClick={() => navigate("/inspector?tab=todos")}
              className="w-full md:w-auto"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inspectionToDisplay = inspection || currentInspection;

  return (
 <div className="w-full bg-gradient-to-b from-gray-50 to-white min-h-screen m-0 p-0">
  <Card className="border-none shadow-sm max-w-7xl mx-auto p-0 m-0">
    {/* Compact Header */}
    <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-t-lg p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg m-0 p-0">
          {isUpdateMode ? (
            <>
              <Edit className="h-4 w-4" />
              <span>Update Inspection for {displayData.customerName}</span>
            </>
          ) : (
            <span>Create Inspection for {displayData.customerName}</span>
          )}
        </CardTitle>

        <div className="flex items-center gap-2">
          {inspectionToDisplay?.name && (
            <Badge variant="secondary" className="text-xs bg-white/20">
              ID: {inspectionToDisplay.name}
            </Badge>
          )}
          <Badge
            variant={isUpdateMode ? "default" : "secondary"}
            className="bg-white/20 text-xs"
          >
            {isUpdateMode ? "Update Mode" : "Create Mode"}
          </Badge>
        </div>
      </div>

      {storeError && (
        <div className="text-yellow-200 text-sm flex items-center gap-1 mt-2">
          <Info className="h-4 w-4" />
          Error: {storeError}
        </div>
      )}
    </CardHeader>

    <CardContent className="p-0 m-0">
      <div className="flex flex-col xl:flex-row">
        {/* Compact Lead Information Sidebar */}
        <div className="xl:w-80 bg-gray-50 border-r border-gray-200">
          <div className="px-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Lead Details
            </h3>
            
            {/* Customer Name */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</p>
              <p className="font-medium text-gray-900 text-sm mt-1">
                {displayData.leadDetails?.lead_name || displayData.customerName}
              </p>
            </div>

            {/* Contact Info - Horizontal Layout */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contact</p>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-xs text-gray-900 truncate">
                    {displayData.leadDetails?.email_id || "N/A"}
                  </p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-xs text-gray-900">
                    {displayData.leadDetails?.mobile_no || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Property Info - Horizontal Layout */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Property</p>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-xs text-gray-900">
                    {displayData.leadDetails?.custom_property_type ||
                      inspection?.property_type ||
                      "N/A"}
                  </p>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-xs text-gray-900">
                    {displayData.leadDetails?.custom_budget_range || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="flex-1">
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {isUpdateMode ? "Update Details" : "Inspection Details"}
            </h3>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {/* Basic Info Section - Compact */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-emerald-600" />
                    Basic Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="inspection_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-gray-700 text-sm">
                            Inspection Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="pl-3 text-left font-normal bg-white border-gray-300 hover:bg-gray-50 h-9"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 bg-white"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inspection_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">
                            Inspection Time
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                type="time"
                                className="pl-10 bg-white border-gray-300 h-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Site Details Section - Compact */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-600" />
                    Site Details
                  </h4>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="site_photos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">
                            Site Photos
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <label
                                htmlFor="site_photos"
                                className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                  uploading
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <Upload className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-600">
                                  {uploading
                                    ? "Uploading..."
                                    : "Click to upload photos"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  JPEG, PNG (max 10MB)
                                </span>
                              </label>
                              <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={async (e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    try {
                                      const file = files[0];
                                      await handleFileUpload(
                                        file,
                                        "site_photos"
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Upload failed:",
                                        error
                                      );
                                    }
                                  }
                                }}
                                className="hidden"
                                id="site_photos"
                                disabled={uploading}
                              />
                              {uploadProgress > 0 && (
                                <Progress
                                  value={uploadProgress}
                                  className="h-2 bg-gray-100"
                                />
                              )}
                              {field.value && (
                                <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                                  <div className="flex items-center gap-2 text-sm text-emerald-800">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    <span className="font-medium">
                                      {getFileDisplayName(field.value)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="measurement_sketch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">
                            Measurement Sketch
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <label
                                htmlFor="measurement_sketch"
                                className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                  uploading
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <Upload className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-600">
                                  {uploading
                                    ? "Uploading..."
                                    : "Click to upload sketch"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  PDF, JPEG, PNG (max 10MB)
                                </span>
                              </label>
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    handleFileUpload(
                                      files[0],
                                      "measurement_sketch"
                                    );
                                  }
                                }}
                                className="hidden"
                                id="measurement_sketch"
                                disabled={uploading}
                              />
                              {uploadProgress > 0 && (
                                <Progress
                                  value={uploadProgress}
                                  className="h-2 bg-gray-100"
                                />
                              )}
                              {field.value && (
                                <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                                  <div className="flex items-center gap-2 text-sm text-emerald-800">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    <span className="font-medium">
                                      {getFileDisplayName(field.value)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inspection_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">
                            Inspection Notes
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              className="resize-none bg-white border-gray-300"
                              placeholder="Add any important notes about the site..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dimensions Section - Compact */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-emerald-600" />
                    Site Dimensions
                  </h4>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium text-gray-700 text-sm">
                            Area #{index + 1}
                          </h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <FormField
                            control={form.control}
                            name={`site_dimensions.${index}.area_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 text-sm">
                                  Area Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Living Room"
                                    className="bg-white border-gray-300 h-9"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`site_dimensions.${index}.dimensionsunits`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 text-sm">
                                  Dimensions
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 10x15 meters"
                                    className="bg-white border-gray-300 h-9"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`site_dimensions.${index}.media`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 text-sm">
                                Media
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <label
                                    htmlFor={`media-${index}`}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                      uploading
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    <Upload className="h-4 w-4 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {uploading
                                        ? "Uploading..."
                                        : "Click to upload media"}
                                    </span>
                                  </label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        handleFileUpload(
                                          files[0],
                                          "",
                                          index
                                        );
                                      }
                                    }}
                                    className="hidden"
                                    id={`media-${index}`}
                                    disabled={uploading}
                                  />
                                  {uploadProgress > 0 && (
                                    <Progress
                                      value={uploadProgress}
                                      className="h-2 bg-gray-100"
                                    />
                                  )}
                                  {field.value && (
                                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                                      <div className="flex items-center gap-2 text-sm text-emerald-800">
                                        <Check className="h-4 w-4 text-emerald-600" />
                                        <span className="font-medium text-xs">
                                          {getFileDisplayName(field.value)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 h-9"
                      onClick={() =>
                        append({
                          area_name: "",
                          dimensionsunits: "",
                          media: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Area Dimension
                    </Button>
                  </div>
                </div>

                {/* Action Buttons - Sticky Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4">
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    {displayData.showTodoActions && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleCancelTodo}
                        disabled={cancelling || storeLoading || uploading}
                        className="w-full sm:w-auto h-9"
                      >
                        {cancelling ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel Inspection
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || storeLoading || uploading}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white h-9"
                    >
                      {loading ? (
                        <span className="animate-pulse">Processing...</span>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {isUpdateMode
                            ? "Update Inspection"
                            : "Submit Inspection"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
  );
};

export default CreateInspection;
