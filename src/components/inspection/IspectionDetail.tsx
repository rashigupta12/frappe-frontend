/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  CalendarIcon,
  Check,
  Edit,
  Home,
  Info,
  Phone,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";
import { frappeAPI } from "../../api/frappeClient";
import { useInspectionStore } from "../../store/inspectionStore";
// import { Badge } from "../ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
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
import DeleteConfirmation from "../../common/DeleteComfirmation";

const formSchema = z.object({
  inspection_date: z.date(),
  status: z.string().optional(),
  customer_name: z.string().optional(),
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
  console.log("🎯 uploadFile called with:", file.name);

  // Validate file before upload
  if (!file || file.size === 0) {
    throw new Error("Invalid file selected");
  }

  try {
    console.log("📞 Calling frappeAPI.upload...");
    const response = await frappeAPI.upload(file);

    if (!response.success) {
      console.error("💥 Upload failed in frappeAPI:", response);
      throw new Error(response.error || "Upload failed");
    }

    const data = response.data;
    console.log("🎉 Upload response received:", data);

    // More robust data extraction
    let fileUrl = "";

    // Try different possible response structures
    if (data?.message?.file_url) {
      fileUrl = data.message.file_url;
      console.log("✅ Found file_url in message:", fileUrl);
    } else if (data?.message?.file_name) {
      fileUrl = data.message.file_name;
      console.log("✅ Found file_name in message:", fileUrl);
    } else if (data?.file_url) {
      fileUrl = data.file_url;
      console.log("✅ Found file_url in root:", fileUrl);
    } else if (data?.file_name) {
      fileUrl = data.file_name;
      console.log("✅ Found file_name in root:", fileUrl);
    } else if (data?.message && typeof data.message === "string") {
      console.log("🔍 Attempting to parse string message:", data.message);
      try {
        const parsed = JSON.parse(data.message);
        fileUrl = parsed.file_url || parsed.file_name || "";
        console.log("✅ Parsed file URL:", fileUrl);
      } catch {
        fileUrl = data.message;
        console.log("⚠️ Using raw message as URL:", fileUrl);
      }
    }

    if (!fileUrl) {
      console.error("❌ No file URL found in response!");
      console.error("📋 Full response structure:", JSON.stringify(data, null, 2));
      throw new Error("No file URL found in response. Check server logs.");
    }

    // Ensure the URL is properly formatted
    if (!fileUrl.startsWith("/") && !fileUrl.startsWith("http")) {
      fileUrl = "/files/" + fileUrl;
      console.log("🔧 Formatted URL:", fileUrl);
    }

    console.log("🎯 Final file URL:", fileUrl);
    return fileUrl;
    
  } catch (error) {
    console.error("💥 File upload error:", error);
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dimensionToDelete, setDimensionToDelete] = useState<number | null>(
    null
  );

  console.log(
    "Current Inspection Data",
    inspection,
    "Todo Data",
    todo,
    "Mode",
    mode
  );

  const {
    createInspection,
    updateTodoStatus,
    updateInspectionbyId,
    loading: storeLoading,
    fetchFirstInspectionByField,
    currentInspection,
    error: storeError,
  } = useInspectionStore();

  // Helper function to get customer name properly
  const getCustomerName = () => {
    if (todo?.inquiry_data) {
      // First try lead_name (full name)
      if (todo.inquiry_data.lead_name) {
        return todo.inquiry_data.lead_name;
      }
      // Fallback to constructing from first_name and last_name
      const firstName = todo.inquiry_data.first_name || "";
      const lastName = todo.inquiry_data.last_name || "";
      return `${firstName} ${lastName}`.trim() || "Unknown Lead";
    }

    if (leadData?.lead_name) {
      return leadData.lead_name;
    }

    if (inspection?.customer_name) {
      return inspection.customer_name;
    }

    return "Unknown Lead";
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inspection_date: new Date(),
      inspection_time: "",
      customer_name: getCustomerName(),
      property_type: "Residential",
      status: "Scheduled",
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
          // Set customer name properly
          const customerName = getCustomerName();
          form.setValue("customer_name", customerName);

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
            // Set customer name from fetched lead data
            const customerName =
              fetchedLeadData?.lead_name ||
              inspection.customer_name ||
              "Unknown Lead";
            form.setValue("customer_name", customerName);
          }
        } else {
          navigate("/inspector?tab=inspections");
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
        if (inspectionToUse.customer_name)
          form.setValue("customer_name", inspectionToUse.customer_name);
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
        // Set customer name for new inspection
        const customerName = getCustomerName();
        form.setValue("customer_name", customerName);
      }
    }
  }, [currentInspection, inspection, dataLoaded, form, replace]);

  // Updated file upload handling with proper Frappe requirements
  const handleFileUpload = async (
    file: File,
    fieldName: string,
    index?: number
  ) => {
    // Enhanced validation
    if (!file) {
      toast.error("No file selected");
      return;
    }
    if (!(file instanceof File)) {
      toast.error("Invalid file object");
      return;
    }

    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
    });

    try {
      setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading("Uploading file...", { id: "upload" });

      // Validate file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          `File type "${file.type}" not supported. Please use JPEG, PNG, GIF, or PDF.`
        );
      }

      // Progress simulation
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const fileUrl = await uploadFile(file);
      setUploadProgress(100);
      clearInterval(interval);

      if (!fileUrl) {
        throw new Error("File uploaded but no URL returned");
      }

      // Update form with the file URL
      if (index !== undefined) {
        form.setValue(`site_dimensions.${index}.media`, fileUrl);
      } else {
        form.setValue(fieldName as any, fileUrl);
      }

      toast.dismiss(toastId);
      toast.success(`File "${file.name}" uploaded successfully!`);
      form.trigger(fieldName as any);
    } catch (error) {
      toast.dismiss("upload");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast.error(`Upload failed: ${errorMessage}`);
      console.error("File upload error:", {
        error,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });
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

      // Get customer name properly
      const customerName = getCustomerName();

      console.log("Submitting inspection with values:", values);
      console.log("Customer name being used:", customerName);

      const inspectionData = {
        ...values,
        // Set status based on mode - for new inspections, set to "In Progress"
        // For updates, keep existing status or set to "In Progress" if needed
        status: isUpdateMode
          ? inspectionToUpdate?.status || "In Progress"
          : "In Progress",
        lead: leadReference,
        customer_name: customerName, // Use the properly constructed customer name
        inspection_date: format(values.inspection_date, "yyyy-MM-dd"),
        inspection_time: values.inspection_time,
        doctype: "SiteInspection",
        site_dimensions: values.site_dimensions?.map((dim) => ({
          area_name: dim.area_name,
          dimensionsunits: dim.dimensionsunits,
          media: typeof dim.media === "string" ? dim.media : "",
        })),
      };

      console.log("Final inspection data being submitted:", inspectionData);

      if (isUpdateMode && inspectionToUpdate?.name) {
        await updateInspectionbyId(inspectionToUpdate.name, inspectionData);
        toast.success("Inspection updated successfully!");

        // If updating from a todo, also update the todo status
        if (todo?.name) {
          try {
            await updateTodoStatus(todo.name, "Completed");
          } catch (todoError) {
            console.error("Failed to update todo status:", todoError);
            // Don't fail the whole operation if todo update fails
          }
        }

        navigate("/inspector?tab=inspections");
      } else {
        const result = await createInspection(inspectionData, todo?.name);
        console.log("Create inspection result:", result);

        toast.success("Inspection created successfully!");
        navigate("/inspector?tab=inspections");
      }
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
        navigate("/inspector?tab=inspections");
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
    const customerName = getCustomerName();

    if (todo) {
      return {
        customerName,
        leadDetails: todo.inquiry_data,
        showTodoActions: true,
      };
    } else if (inspection) {
      return {
        customerName:
          leadData?.lead_name || inspection.customer_name || customerName,
        leadDetails: leadData,
        showTodoActions: false,
      };
    }
    return null;
  };

  const displayData = getDisplayData();

  const handleDeleteAreaDimension = (
    e: React.MouseEvent<HTMLButtonElement>,
    index: number
  ) => {
    e.stopPropagation();
    setDimensionToDelete(index);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (dimensionToDelete !== null) {
      remove(dimensionToDelete);
    }
    setDeleteModalOpen(false);
    setDimensionToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDimensionToDelete(null);
  };

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
              onClick={() => navigate("/inspector?tab=inspections")}
              className="w-full md:w-auto"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white min-h-screen m-0 p-0">
      <Card className="border-none shadow-sm max-w-7xl mx-auto p-0 m-0 gap-0">
        {/* Combined Header with Lead Details */}
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white  px-4 py-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col">
              <CardTitle className="flex items-center gap-2 text-lg m-0 p-0">
                {isUpdateMode ? (
                  <>
                    <Edit className="h-4 w-4" />
                    <span>Update Inspection</span>
                  </>
                ) : (
                  <span>Create Inspection</span>
                )}
              </CardTitle>

              {/* Compact Lead Info */}
              <div className="flex flex-wrap items-center gap-x-4  mt-1 text-sm">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 opacity-80" />
                  <span>{displayData.customerName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 opacity-80" />
                  <span>{displayData.leadDetails?.mobile_no || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4 opacity-80" />
                  <span>
                    {displayData.leadDetails?.custom_property_type || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {storeError && (
            <div className="text-yellow-200 text-sm flex items-center  mt-1">
              <Info className="h-4 w-4" />
              Error: {storeError}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 m-0">
          <div className="flex flex-col">
            {/* Main Form Content */}
            <div className="flex-1">
              <div className="p-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    {/* Accordion for Sections */}
                    <Accordion
                      type="multiple"
                      defaultValue={["dimensions"]}
                      className="space-y-3"
                    >
                      {/* Basic Info Accordion */}
                      <AccordionItem
                        value="basic"
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-5 py-2 hover:no-underline bg-gray-50 flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-gray-800">
                              Basic Information
                            </span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="bg-white">
                          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 px-5 py-2">
                            {/* Inspection Date - First Column */}
                            <div className="space-y-2">
                              <FormField
                                control={form.control}
                                name="inspection_date"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700 text-sm font-medium">
                                      Inspection Date
                                    </FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className="w-full justify-between text-left font-normal bg-white border-gray-300 hover:bg-gray-50 h-10"
                                          >
                                            {field.value ? (
                                              <span className="text-gray-900">
                                                {format(field.value, "PPP")}
                                              </span>
                                            ) : (
                                              <span className="text-gray-500">
                                                Select date
                                              </span>
                                            )}
                                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto p-0"
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
                                          className="rounded-md border"
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Inspection Time - Second Column */}
                            <div className="space-y-2">
                              <FormField
                                control={form.control}
                                name="inspection_time"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700 text-sm font-medium">
                                      Inspection Time
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          type="time"
                                          className="pl-3 bg-white border-gray-300 h-10 text-gray-900"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Rest of your accordion items remain the same */}
                      {/* Dimensions Section - Expanded by default */}
                      <AccordionItem
                        value="dimensions"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">Site Dimensions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
                          <div className="space-y-3">
                            <Accordion
                              type="multiple"
                              defaultValue={fields.map(
                                (_, index) => `area-${index}`
                              )}
                              className="w-full space-y-3"
                            >
                              {fields.map((field, index) => (
                                <AccordionItem
                                  key={field.id}
                                  value={`area-${index}`}
                                  className="border border-gray-200 rounded-lg bg-gray-50"
                                >
                                  <AccordionTrigger className="px-3 py-3 hover:no-underline">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700 text-sm">
                                          {field.area_name ||
                                            `Area ${index + 1}`}
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0 mr-2"
                                        onClick={(e) => {
                                          handleDeleteAreaDimension(e, index);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-3 pb-3">
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                                    const files =
                                                      e.target.files;
                                                    if (
                                                      files &&
                                                      files.length > 0
                                                    ) {
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
                                                        {getFileDisplayName(
                                                          field.value
                                                        )}
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
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>

                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-9"
                              onClick={() =>
                                append({
                                  area_name: "",
                                  dimensionsunits: "",
                                  media: undefined,
                                })
                              }
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add New Area
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Media Section */}
                      <AccordionItem
                        value="media"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">Media Files</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Site Photos */}
                            <FormField
                              control={form.control}
                              name="site_photos"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 text-sm font-medium">
                                    Site Photos
                                  </FormLabel>
                                  <FormControl>
                                    <div className="space-y-2">
                                      <label
                                        htmlFor="site-photos"
                                        className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                          uploading
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                      >
                                        <Upload className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600">
                                          {uploading
                                            ? "Uploading..."
                                            : "Upload Site Photos"}
                                        </span>
                                      </label>
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const files = e.target.files;
                                          if (files && files.length > 0) {
                                            const file = files[0];
                                            console.log("Selected file:", file);

                                            // Verify it's a proper File object
                                            if (file instanceof File) {
                                              handleFileUpload(
                                                file,
                                                "site_photos"
                                              );
                                            } else {
                                              console.error(
                                                "Not a proper File object:",
                                                file
                                              );
                                              toast.error(
                                                "Invalid file selected"
                                              );
                                            }
                                          }
                                        }}
                                        className="hidden"
                                        id="site-photos"
                                        disabled={uploading}
                                      />

                                      {uploadProgress > 0 && (
                                        <Progress
                                          value={uploadProgress}
                                          className="h-2 bg-gray-100"
                                        />
                                      )}
                                      {field.value && (
                                        <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
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

                            {/* Measurement Sketch */}
                            <FormField
                              control={form.control}
                              name="measurement_sketch"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 text-sm font-medium">
                                    Measurement Sketch
                                  </FormLabel>
                                  <FormControl>
                                    <div className="space-y-2">
                                      <label
                                        htmlFor="measurement-sketch"
                                        className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                          uploading
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                      >
                                        <Upload className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600">
                                          {uploading
                                            ? "Uploading..."
                                            : "Upload Sketch"}
                                        </span>
                                      </label>
                                      <Input
                                        type="file"
                                        accept="image/*,application/pdf"
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
                                        id="measurement-sketch"
                                        disabled={uploading}
                                      />
                                      {uploadProgress > 0 && (
                                        <Progress
                                          value={uploadProgress}
                                          className="h-2 bg-gray-100"
                                        />
                                      )}
                                      {field.value && (
                                        <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
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
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Notes Section */}
                      <AccordionItem
                        value="notes"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">
                              Inspection Notes
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
                          <FormField
                            control={form.control}
                            name="inspection_notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 text-sm font-medium">
                                  Notes
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Add any additional notes or observations..."
                                    className="bg-white border-gray-300 min-h-[100px] resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {displayData.showTodoActions && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={handleCancelTodo}
                            disabled={cancelling || loading}
                            className="flex-1 sm:flex-none sm:w-auto"
                          >
                            {cancelling ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel Todo
                              </>
                            )}
                          </Button>
                        )}

                        <div className="flex gap-2 flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              navigate("/inspector?tab=inspections")
                            }
                            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                            disabled={loading || cancelling}
                          >
                            Back
                          </Button>

                          <Button
                            type="submit"
                            disabled={loading || storeLoading || uploading}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                          >
                            {loading || storeLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                {isUpdateMode ? "Updating..." : "Creating..."}
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                {isUpdateMode
                                  ? "Update Inspection"
                                  : "Create Inspection"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        text="Are you sure you want to delete this area dimension? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
      />
    </div>
  );
};

export default CreateInspection;
