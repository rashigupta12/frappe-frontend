/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  ArrowLeft,
  Building,
  CalendarIcon,
  Camera,
  Check,
  ClockIcon,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Info,
  Mail,
  Phone,
  Plus,
  Ruler,
  Trash2,
  Upload,
  User,
  X
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

    if (!response.success) {
      throw new Error(response.error || "Upload failed");
    }

    const data = response.data;

    if (data && data.message) {
      const message = data.message;
      return message.file_url || message.file_name || "";
    }

    if (typeof data === "object" && data !== null) {
      return data.file_url || data.file_name || "";
    }

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
  const [showLeadDetails, setShowLeadDetails] = useState(false);

  const {
    createInspection,
    updateTodoStatus,
    updateInspectionbyId,
    loading: storeLoading,
    fetchFirstInspectionByField,
    currentInspection,
    // error: storeError,
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

        if (inspectionToUse.inspection_time) {
          form.setValue("inspection_time", inspectionToUse.inspection_time);
        }

        if (inspectionToUse.property_type) {
          form.setValue("property_type", inspectionToUse.property_type);
        }

        if (inspectionToUse.inspection_notes) {
          form.setValue("inspection_notes", inspectionToUse.inspection_notes);
        }

        if (inspectionToUse.site_photos) {
          form.setValue("site_photos", inspectionToUse.site_photos);
        }

        if (inspectionToUse.measurement_sketch) {
          form.setValue(
            "measurement_sketch",
            inspectionToUse.measurement_sketch
          );
        }

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
      if (file.size > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

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
      <div className="p-4 max-w-md mx-auto">
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/inspector?tab=todos")}
              className="p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold truncate">
                {isUpdateMode ? "Update" : "Create"} Inspection
              </h1>
              <p className="text-sm text-gray-600 truncate">
                {displayData.customerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inspectionToDisplay?.name && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                {inspectionToDisplay.name.split("-").pop()}
              </Badge>
            )}
            <Badge
              variant={isUpdateMode ? "default" : "secondary"}
              className="text-xs px-2 py-1"
            >
              {isUpdateMode ? "Update" : "Create"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Lead Information Card - Compact */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Lead Information
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadDetails(!showLeadDetails)}
                className="p-1"
              >
                {showLeadDetails ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Always visible summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500" />
                <span className="truncate font-medium">
                  {displayData.leadDetails?.lead_name ||
                    displayData.customerName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-3 w-3 text-gray-500" />
                <span className="truncate">
                  {displayData.leadDetails?.custom_property_type ||
                    inspection?.property_type ||
                    "N/A"}
                </span>
              </div>
            </div>

            {/* Expandable details */}
            {showLeadDetails && (
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="truncate text-xs">
                    {displayData.leadDetails?.email_id || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="truncate text-xs">
                    {displayData.leadDetails?.mobile_no || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-gray-500" />
                  <span className="truncate text-xs">
                    {displayData.leadDetails?.custom_budget_range || "N/A"}
                  </span>
                </div>
                {inspectionToDisplay && (
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-500" />
                    <span className="truncate text-xs text-blue-600">
                      {inspectionToDisplay.inspection_status}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspection Form */}
        <Card>
          <CardContent className="p-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                {/* Date & Time - Single Row */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="inspection_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal text-sm h-9"
                              >
                                {field.value ? (
                                  format(field.value, "MMM dd")
                                ) : (
                                  <span>Pick date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
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
                        <FormLabel className="text-sm flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="text-sm h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* File Uploads - Compact */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="site_photos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Site Photos
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <label
                              htmlFor="site_photos"
                              className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                uploading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <Upload className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {uploading ? "Uploading..." : "Upload Photos"}
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
                                    await handleFileUpload(
                                      files[0],
                                      "site_photos"
                                    );
                                  } catch (error) {
                                    console.error("Upload failed:", error);
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
                                className="h-1"
                              />
                            )}
                            {field.value && (
                              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="text-xs font-medium truncate">
                                  {getFileDisplayName(field.value)}
                                </span>
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
                        <FormLabel className="text-sm flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Measurement Sketch
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <label
                              htmlFor="measurement_sketch"
                              className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                uploading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <Upload className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {uploading ? "Uploading..." : "Upload Sketch"}
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
                                className="h-1"
                              />
                            )}
                            {field.value && (
                              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="text-xs font-medium truncate">
                                  {getFileDisplayName(field.value)}
                                </span>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="inspection_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          className="resize-none text-sm"
                          placeholder="Add inspection notes..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Site Dimensions - Compact Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      Site Dimensions ({fields.length})
                    </FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          area_name: "",
                          dimensionsunits: "",
                          media: "",
                        })
                      }
                      className="h-8 px-3"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {fields.map((field: any, index: number) => (
                    <Card key={field.id} className="p-3 border">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Area {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`site_dimensions.${index}.area_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Area name"
                                    className="text-sm h-8"
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
                                <FormControl>
                                  <Input
                                    placeholder="Dimensions"
                                    className="text-sm h-8"
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
                              <FormControl>
                                <div className="space-y-2">
                                  <label
                                    htmlFor={`media-${index}`}
                                    className={`flex items-center justify-center gap-2 p-2 border border-dashed rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                                      uploading
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    <Upload className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs">
                                      {uploading
                                        ? "Uploading..."
                                        : "Upload Media"}
                                    </span>
                                  </label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        handleFileUpload(files[0], "", index);
                                      }
                                    }}
                                    className="hidden"
                                    id={`media-${index}`}
                                    disabled={uploading}
                                  />
                                  {uploadProgress > 0 && (
                                    <Progress
                                      value={uploadProgress}
                                      className="h-1"
                                    />
                                  )}
                                  {field.value && (
                                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                                      <Check className="h-3 w-3 text-green-500" />
                                      <span className="text-xs font-medium truncate">
                                        {getFileDisplayName(field.value)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sticky Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t p-4 space-y-3">
          {displayData.showTodoActions && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelTodo}
              disabled={cancelling || storeLoading || uploading}
              className="w-full"
            >
              {cancelling ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">↻</span>
                  Cancelling...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel Todo
                </span>
              )}
            </Button>
          )}
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={loading || storeLoading || uploading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">↻</span>
                {isUpdateMode ? "Updating..." : "Creating..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                {isUpdateMode ? "Update Inspection" : "Create Inspection"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateInspection;
