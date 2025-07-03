/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  CalendarIcon,
  FileText,
  Info,
  Plus,
  Ruler,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react"; // Added useCallback, useRef
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";
import { frappeAPI } from "../../api/frappeClient";
import DeleteConfirmation from "../../common/DeleteComfirmation";
import { useInspectionStore } from "../../store/inspectionStore";
import {
  formSchema,
  getMediaType,
  type MediaItem,
} from "./components/utils/fileUpload";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent } from "../ui/card";
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
import { Textarea } from "../ui/textarea";
import InspectionHeader from "./components/InspectionHeader";
import MediaUpload from "./components/MediaUpload/MediaUpload";

const CreateInspection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { todo, inspection } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dimensionToDelete, setDimensionToDelete] = useState<number | null>(
    null
  );
  console.log("CreateInspection component initialized");
  console.log("Todo:", todo);
  console.log("Inspection:", inspection);

  const {
    createInspection,
    updateTodoStatus,
    updateInspectionbyId,
    loading: storeLoading,
    fetchFirstInspectionByField,
    currentInspection,
    error: storeError,
    UpdateLeadStatus,
  } = useInspectionStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inspection_date: new Date(),
      inspection_time: "",
      customer_name: "",
      property_type: "Residential",
      status: "Scheduled",
      measurement_sketch: undefined,
      inspection_notes: "",
      site_dimensions: [],
      custom_site_images: [],
    },
  });

  // Fix: Move useFieldArray declarations BEFORE useEffect
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "site_dimensions",
  });



  const hasInitializedForm = useRef(false);

  const getCustomerName = useCallback(() => {
    if (todo?.inquiry_data) {
      if (todo.inquiry_data.lead_name) {
        return todo.inquiry_data.lead_name;
      }
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
  }, [todo, inspection, leadData]);
  // Replace the existing useEffect with this simplified version

useEffect(() => {
  const initializeFormData = async () => {
    if (hasInitializedForm.current) {
      return;
    }

    setDataLoaded(false);
    let dataToPopulate = null;
    let isUpdate = false;
    if (inspection) {
      // Direct inspection access -> Update mode
      isUpdate = true;
      dataToPopulate = inspection;
      
      // Fetch lead data if needed
      if (inspection.lead) {
        const fetchedLeadData = await fetchLeadData(inspection.lead);
        setLeadData(fetchedLeadData);
        if (fetchedLeadData?.custom_property_type) {
          form.setValue("property_type", fetchedLeadData.custom_property_type);
        }
        form.setValue(
          "customer_name",
          fetchedLeadData?.lead_name || inspection.customer_name || "Unknown Lead"
        );
      }
    } else if (todo) {
      // Todo -> Create mode (always create new inspection)
      isUpdate = false;
      dataToPopulate = todo;
      
      // Set customer name from todo
      form.setValue("customer_name", getCustomerName());
      
      // Set property type if available
      if (todo.inquiry_data?.custom_property_type) {
        form.setValue("property_type", todo.inquiry_data.custom_property_type);
      }
      
      // Optional: Check if there's an existing inspection for this lead
      // This is just for informational purposes, we still create a new one
      if (todo.reference_name) {
        const existingInspection = await fetchFirstInspectionByField(
          "lead",
          todo.reference_name
        );
        if (existingInspection) {
          console.log("Note: Existing inspection found for this lead:", existingInspection);
          // You could populate some fields from existing inspection if needed
          // but still maintain CREATE mode
        }
      }
    } else if (currentInspection) {
      // Fallback to current inspection -> Update mode
      isUpdate = true;
      dataToPopulate = currentInspection;
    } else {
      // No data available, redirect
      navigate("/inspector?tab=inspections");
      return;
    }

    setIsUpdateMode(isUpdate);
    console.log("Mode determined:", isUpdate ? "UPDATE" : "CREATE");
    console.log("Data source:", inspection ? "inspection" : todo ? "todo" : "currentInspection");

    // Populate form with data
    if (dataToPopulate) {
      // Set basic fields
      if (dataToPopulate.inspection_date) {
        try {
          form.setValue("inspection_date", parseISO(dataToPopulate.inspection_date));
        } catch (error) {
          console.error("Error parsing inspection date:", error);
        }
      }
      
      form.setValue("inspection_time", dataToPopulate.inspection_time || "");
      form.setValue("property_type", dataToPopulate.property_type || "Residential");
      form.setValue("inspection_notes", dataToPopulate.inspection_notes || "");
      form.setValue("status", dataToPopulate.status || "Scheduled");

      // Set measurement_sketch (MediaItem)
      if (dataToPopulate.measurement_sketch) {
        const mediaType = getMediaType(dataToPopulate.measurement_sketch);
        if (mediaType !== "unknown") {
          form.setValue("measurement_sketch", {
            id: `sketch-${Date.now()}`,
            url: dataToPopulate.measurement_sketch,
            type: mediaType,
            remarks: "Measurement Sketch",
          } as MediaItem);
        } else {
          form.setValue("measurement_sketch", undefined);
        }
      } else {
        form.setValue("measurement_sketch", undefined);
      }

      // Set site_dimensions with MediaItem for media field
      if (dataToPopulate.site_dimensions && Array.isArray(dataToPopulate.site_dimensions)) {
        const formattedDimensions = dataToPopulate.site_dimensions.map((dim: any) => ({
          area_name: dim.area_name || "",
          dimensionsunits: dim.dimensionsunits || "",
          media: dim.media
            ? ({
                id: `${dim.media.split("/").pop()}-${Math.random().toString(36).substr(2, 9)}`,
                url: dim.media,
                type: getMediaType(dim.media),
                remarks: dim.media.split("/").pop(),
              } as MediaItem)
            : undefined,
        }));
        replace(formattedDimensions);
      } else {
        replace([]);
      }

      // Set custom_site_images
      if (dataToPopulate.custom_site_images && Array.isArray(dataToPopulate.custom_site_images)) {
        form.setValue(
          "custom_site_images",
          dataToPopulate.custom_site_images.map((img: any) => ({
            id: img.id || `${img.image.split("/").pop()}-${Math.random().toString(36).substr(2, 9)}`,
            url: img.image || "",
            type: getMediaType(img.image),
            remarks: img.remarks || "",
          }))
        );
      } else {
        form.setValue("custom_site_images", []);
      }
    }

    setDataLoaded(true);
    hasInitializedForm.current = true;
  };

  initializeFormData();
}, [
  todo,
  inspection,
  currentInspection,
  getCustomerName,
  form,
  replace,
  navigate,
  fetchFirstInspectionByField,
]);

// Also update the handleSubmit function to be clearer
const handleSubmit = async (values: z.infer<typeof formSchema>) => {
  console.log("Form values before submission:", values);
  console.log("Submission mode:", isUpdateMode ? "UPDATE" : "CREATE");

  try {
    setLoading(true);
    const leadReference = todo?.reference_name || inspection?.lead;
    const customerName = getCustomerName();

    // Extract URLs from MediaItems
    const measurementSketchUrl = values.measurement_sketch?.url || undefined;
    const siteDimensionsWithUrls = values.site_dimensions?.map((dim) => ({
      area_name: dim.area_name,
      dimensionsunits: dim.dimensionsunits,
      media: dim.media?.url || "",
    }));
    const customSiteImagesWithUrls = values.custom_site_images
      ?.filter((img) => typeof img.url === "string")
      ?.map((img) => ({
        image: img.url,
        remarks: img.remarks ?? "",
      }));

    const inspectionData = {
      ...values,
      status: isUpdateMode ? (inspection?.status || "In Progress") : "In Progress",
      lead: leadReference,
      customer_name: customerName,
      inspection_date: format(values.inspection_date, "yyyy-MM-dd"),
      inspection_time: values.inspection_time,
      doctype: "SiteInspection",
      measurement_sketch: measurementSketchUrl,
      site_dimensions: siteDimensionsWithUrls,
      custom_site_images: customSiteImagesWithUrls,
    };

    console.log("Final submission data:", inspectionData);

    if (isUpdateMode && inspection?.name) {
      // Update existing inspection
      await updateInspectionbyId(inspection.name, inspectionData);
      toast.success("Inspection updated successfully!");
    } else {
      // Create new inspection
      await createInspection(inspectionData, todo?.name);

      toast.success("Inspection created successfully!");
    }

    navigate("/inspector?tab=inspections");
  } catch (error) {
    console.error("Submission error:", error);
    toast.error(`Failed to ${isUpdateMode ? "update" : "create"} inspection.`);
  } finally {
    setLoading(false);
  }
};

  const fetchLeadData = async (leadName: string) => {
    try {
      const response = await frappeAPI.getLeadById(leadName);
      return response.data;
    } catch (error) {
      console.error("Error fetching lead data:", error);
      toast.error("Failed to fetch lead information");
      return null;
    }
  };



  const handleCancelTodo = async () => {
    try {
      setCancelling(true);
      if (todo?.name) {
        await updateTodoStatus(todo.name, "Cancelled");
        await UpdateLeadStatus(todo.reference_name,"Lead")
        
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
  // Return a fallback object instead of null
  return {
    customerName: customerName || "Unknown Customer",
    leadDetails: null,
    showTodoActions: false,
  };
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

  if (!dataLoaded) {
    // Show loading or empty state until data is loaded
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading inspection data...</p>
      </div>
    );
  }
console.log("Display Data:", displayData);
console.log("is update" ,isUpdateMode)
  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white min-h-screen m-0 p-0">
      <Card className="border-none shadow-sm max-w-7xl mx-auto p-0 m-0 gap-0">
        {/* <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-1">
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

              <div className="flex flex-wrap items-center gap-x-4 mt-1 text-sm">
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
            <div className="text-yellow-200 text-sm flex items-center mt-1">
              <Info className="h-4 w-4" />
              Error: {storeError}
            </div>
          )}
        </CardHeader> */}
   <InspectionHeader
          isUpdateMode={isUpdateMode}
          displayData={displayData}
          storeError={storeError}
        />
        <CardContent className="p-0 m-0">
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="p-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
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

                      {/* Site Dimensions Section (Single media per dimension) */}
                      <AccordionItem
                        value="dimensions"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-emerald-600" />
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
                                          {form.watch(
                                            `site_dimensions.${index}.area_name`
                                          ) || `Area ${index + 1}`}
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
                                          render={({
                                            field: areaNameField,
                                          }) => (
                                            <FormItem>
                                              <FormLabel className="text-gray-700 text-sm">
                                                Area Name
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  placeholder="e.g., Living Room"
                                                  className="bg-white border-gray-300 h-9"
                                                  {...areaNameField}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`site_dimensions.${index}.dimensionsunits`}
                                          render={({
                                            field: dimensionsField,
                                          }) => (
                                            <FormItem>
                                              <FormLabel className="text-gray-700 text-sm">
                                                Dimensions/Units
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  placeholder="e.g., 10x12 ft"
                                                  className="bg-white border-gray-300 h-9"
                                                  {...dimensionsField}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>

                                      {/* Site Dimensions Media Upload - Only ONE file and image/vedio(both select and caputer) */}
                                      <FormField
                                        control={form.control}
                                        name={`site_dimensions.${index}.media`}
                                        render={({ field: mediaField }) => (
                                          <FormItem>
                                            <MediaUpload
                                              label="Area Photo/Video"
                                              multiple={false} // Only one file
                                              allowedTypes={["image", "video"]}
                                              value={
                                                mediaField.value as
                                                  | MediaItem
                                                  | undefined
                                              }
                                              onChange={(newMedia) => {
                                                mediaField.onChange(newMedia);
                                              }}
                                            />
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
                              onClick={() =>
                                append({
                                  area_name: "",
                                  dimensionsunits: "",
                                  media: undefined,
                                })
                              }
                              className="w-full border-dashed border-gray-300 text-gray-600 hover:text-emerald-700 hover:border-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Area
                              Dimension
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Custom Images Section (Multiple images, videos, audio)  */}
                      <AccordionItem
                        value="custom-images"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">
                              Custom Images/Media
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
                          <FormField
                            control={form.control}
                            name="custom_site_images"
                            render={({ field }) => (
                              <FormItem>
                                <MediaUpload
                                  label="Upload Custom Photos/Videos/Audio"
                                  multiple={true} // Allow multiple files
                                  allowedTypes={["image", "video", "audio"]}
                                  value={field.value as MediaItem[]}
                                  onChange={(newMediaArray) => {
                                    field.onChange(newMediaArray);
                                  }}
                                  maxFiles={20} // Example: limit to 20 files
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        
                        </AccordionContent>
                      </AccordionItem>

                      {/* Measurement Sketch Section (Single Image/Video) selection / caputer */}
                      <AccordionItem
                        value="measurement-sketch"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">
                              Measurement Sketch
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
                          <FormField
                            control={form.control}
                            name="measurement_sketch"
                            render={({ field }) => (
                              <FormItem>
                                <MediaUpload
                                  label="Upload Measurement Sketch (Image or Video)"
                                  multiple={false} // Only one file
                                  allowedTypes={["image", "video"]}
                                  value={field.value as MediaItem | undefined}
                                  onChange={(newMedia) => {
                                    field.onChange(newMedia);
                                  }}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* Inspection Notes Section */}
                      <AccordionItem
                        value="notes"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-5 py-2 hover:no-underline bg-gray-50 flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-gray-800">
                              Inspection Notes
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-white">
                          <div className="px-5 py-2">
                            <FormField
                              control={form.control}
                              name="inspection_notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only">
                                    Inspection Notes
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Add detailed inspection notes here..."
                                      className="min-h-[120px] resize-y bg-white border-gray-300"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex justify-end gap-2 p-4 pt-0">
                      {displayData?.showTodoActions && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelTodo}
                          disabled={cancelling || loading || storeLoading}
                          className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                        >
                          {cancelling ? "Cancelling..." : "Cancel Todo"}
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={loading || storeLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {loading || storeLoading
                          ? "Saving..."
                          : isUpdateMode
                          ? "Update Inspection"
                          : "Create Inspection"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
