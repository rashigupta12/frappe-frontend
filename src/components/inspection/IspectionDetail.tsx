/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  CalendarIcon,
  FileText,
  Info,
  Plus,
  PlusCircle,
  Ruler,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
// import { showToast } from "react-hot-showToast";
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

import { PasswordResetLoader } from "../../common/Loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
// import { Calendar } from "../ui/calendar";
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
import { Popover, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import InspectionHeader from "./components/InspectionHeader";
import MediaUpload from "./components/MediaUpload/MediaUpload";
import { capitalizeFirstLetter } from "../../helpers/helper";
import { showToast } from "../../helpers/comman";

// Helper function to get current date and time - memoized
const getCurrentDateTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hours}:${minutes}`;

  return {
    currentDate: now,
    currentTime: currentTime,
  };
};

const CreateInspection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract state once and memoize
  const locationState = useMemo(() => location.state || {}, [location.state]);
  const { todo, inspection } = locationState;
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cancelTodoModalOpen, setCancelTodoModalOpen] = useState(false);
  const [dimensionToDelete, setDimensionToDelete] = useState<number | null>(
    null
  );

  // Memoize computed values
  const isSubmitted = useMemo(
    () => inspection?.docstatus === 1,
    [inspection?.docstatus]
  );
  const isReadOnly = useMemo(() => isSubmitted, [isSubmitted]);
  console.log("inspection", inspection);
  console.log("todo", todo);

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

  // Get current date and time once and memoize
  const { currentDate, currentTime } = useMemo(() => getCurrentDateTime(), []);
  console.log(todo);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inspection_date: currentDate,
      inspection_time: currentTime,
      property_type: "Residential",
      inspection_status: "Scheduled",
      measurement_sketch: undefined,
      inspection_notes: "",
      site_dimensions: [],
      custom_site_images: [],
      custom_measurement_notes: "",
      custom_site_images_notes: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "site_dimensions",
  });

  const hasInitializedForm = useRef(false);

  // Memoize fetchLeadData to prevent recreation on every render
  const fetchLeadData = useCallback(async (leadName: string) => {
    try {
      const response = await frappeAPI.getLeadById(leadName);
      return response.data;
    } catch (error) {
      console.error("Error fetching lead data:", error);
      showToast.error("Failed to fetch lead information");
      return null;
    }
  }, []);

  // Memoize formatDimensionsData to prevent recreation
 const formatDimensionsData = useCallback((siteDimensions: any[]) => {
  return siteDimensions.map((dim: any) => {
    let images = [];

    try {
      // Handle cases where media might be double-encoded JSON string, single JSON string, or already an array
      if (typeof dim.media === "string") {
        let mediaString = dim.media;

        // Handle double-encoded JSON strings like "\"[]\""
        if (mediaString.startsWith('"') && mediaString.endsWith('"')) {
          mediaString = JSON.parse(mediaString);
        }

        // Now parse the actual JSON
        images = mediaString ? JSON.parse(mediaString) : [];
      } else if (Array.isArray(dim.media)) {
        images = dim.media;
      }
    } catch (error) {
      console.error(
        "Error parsing media:",
        error,
        "Original media:",
        dim.media
      );
      images = [];
    }

    // Ensure images is always an array before calling map
    if (!Array.isArray(images)) {
      console.warn("Images is not an array after parsing:", images);
      images = [];
    }

    const formattedImages = images
      .map((img: any) => {
        // Handle cases where img might be an object with image_url or just a string
        const imageUrl = typeof img === "string" ? img : img?.image_url;
        if (!imageUrl) return null;

        const mediaType = getMediaType(imageUrl);
        // Ensure only image or video types for the images field
        if (mediaType !== "image" && mediaType !== "video") {
          return null;
        }
        return {
          id: `${imageUrl.split("/").pop()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          url: imageUrl,
          type: mediaType as "image" | "video",
          remarks: imageUrl.split("/").pop() || "",
        };
      })
      .filter(
        (
          img: any
        ): img is {
          id: string;
          url: string;
          type: "image" | "video";
          remarks: string;
        } => img !== null
      );

    // Fix for media_2 (audio) handling
    let media2Item = undefined;
    if (dim.media_2) {
      const media2Type = getMediaType(dim.media_2);
      console.log("Media 2 URL:", dim.media_2, "Detected type:", media2Type);
      
      // Accept audio files regardless of extension
      if (media2Type === "audio" || dim.media_2.includes('.webm')) {
        media2Item = {
          id: `${dim.media_2.split("/").pop()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          url: typeof dim.media_2 === "string" ? dim.media_2 : "",
          type: "audio" as const,
          remarks:
            (typeof dim.media_2 === "string"
              ? dim.media_2.split("/").pop()
              : "") || "",
        };
      }
    }

    return {
      floor: dim.floor || "",
      room: dim.room || "",
      entity: dim.entity || "",
      area_name: dim.area_name || "",
      dimensionsunits: dim.dimensionsunits || "",
      notes: dim.notes || "",
      images: formattedImages,
      media_2: media2Item,
    };
  });
}, []);

  // Memoize formatCustomImages to prevent recreation
  const formatCustomImages = useCallback((customSiteImages: any[]) => {
    return customSiteImages.map((img: any) => ({
      id:
        img.id ||
        `${img.image.split("/").pop()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      url: img.image || "",
      type: getMediaType(img.image),
      remarks: img.remarks || "",
    }));
  }, []);

  // Main initialization effect - only run once
  useEffect(() => {
    const initializeFormData = async () => {
      if (hasInitializedForm.current) {
        return;
      }

      setDataLoaded(false);
      let dataToPopulate = null;
      let isUpdate = false;

      if (inspection) {
        isUpdate = true;
        dataToPopulate = inspection;

        if (inspection.lead) {
          const fetchedLeadData = await fetchLeadData(inspection.lead);
          setLeadData(fetchedLeadData);
          if (fetchedLeadData?.custom_property_type) {
            form.setValue(
              "property_type",
              fetchedLeadData.custom_property_type
            );
          }
        }
      } else if (todo) {
        isUpdate = false;
        dataToPopulate = todo;

        if (todo.inquiry_data?.custom_property_type) {
          form.setValue(
            "property_type",
            todo.inquiry_data.custom_property_type
          );
        }

        if (todo.reference_name) {
          const existingInspection = await fetchFirstInspectionByField(
            "lead",
            todo.reference_name
          );
          if (existingInspection) {
            console.log(
              "Note: Existing inspection found for this lead:",
              existingInspection
            );
          }
        }
      } else if (currentInspection) {
        isUpdate = true;
        dataToPopulate = currentInspection;
      } else {
        navigate("/inspector?tab=inspections");
        return;
      }

      setIsUpdateMode(isUpdate);

      if (dataToPopulate) {
        // Set form values in batches to reduce re-renders
        const formUpdates = [];

        // Only set date/time from existing data if we're in update mode
        if (isUpdate) {
          if (dataToPopulate.inspection_date) {
            try {
              formUpdates.push([
                "inspection_date",
                parseISO(dataToPopulate.inspection_date),
              ]);
            } catch (error) {
              console.error("Error parsing inspection date:", error);
            }
          }
          formUpdates.push([
            "inspection_time",
            dataToPopulate.inspection_time || currentTime,
          ]);
        } else {
          // For new inspections (from todo), keep current date/time
          formUpdates.push(["inspection_date", currentDate]);
          formUpdates.push(["inspection_time", currentTime]);
        }

        formUpdates.push([
          "property_type",
          dataToPopulate.property_type || "Residential",
        ]);
        formUpdates.push([
          "inspection_notes",
          dataToPopulate.inspection_notes || "",
        ]);
        formUpdates.push([
          "inspection_status",
          dataToPopulate.status || "Scheduled",
        ]);

        // Apply all form updates at once
        formUpdates.forEach(([field, value]) => {
          form.setValue(field as any, value);
        });

        // Handle measurement sketch
        if (dataToPopulate.measurement_sketch) {
          const mediaType = getMediaType(dataToPopulate.measurement_sketch);
          if (mediaType !== "unknown") {
            form.setValue("measurement_sketch", {
              id: `sketch-${Date.now()}`,
              url: dataToPopulate.measurement_sketch,
              type: mediaType,
              remarks: "Measurement Sketch",
            } as MediaItem);
          }
        }

        // Handle site dimensions
        if (
          dataToPopulate.site_dimensions &&
          Array.isArray(dataToPopulate.site_dimensions)
        ) {
          const formattedDimensions = formatDimensionsData(
            dataToPopulate.site_dimensions
          );
          replace(formattedDimensions);
        } else {
          replace([]);
        }

        // Handle custom site images
        if (
          dataToPopulate.custom_site_images &&
          Array.isArray(dataToPopulate.custom_site_images)
        ) {
          const formattedImages = formatCustomImages(
            dataToPopulate.custom_site_images
          ).filter((img: any) => img.type !== "unknown") as MediaItem[];
          form.setValue("custom_site_images", formattedImages);
        } else {
          form.setValue("custom_site_images", []);
        }
        if (dataToPopulate.custom_measurement_notes) {
          form.setValue(
            "custom_measurement_notes",
            dataToPopulate.custom_measurement_notes
          );
        }
        if (dataToPopulate.custom_site_images_notes) {
          form.setValue(
            "custom_site_images_notes",
            dataToPopulate.custom_site_images_notes
          );
        }
      }

      setDataLoaded(true);
      hasInitializedForm.current = true;
    };

    initializeFormData();
  }, [
    inspection,
    inspection?.name,
    todo,
    todo?.name,
    currentInspection,
    currentInspection?.name,
    currentDate,
    currentTime,
    fetchFirstInspectionByField,
    fetchLeadData,
    form,
    formatCustomImages,
    formatDimensionsData,
    navigate,
    replace,
  ]);


const validateInspectionForm = (values: z.infer<typeof formSchema>) => {
  const errors: Record<string, string> = {};
  
  // 1. At least one site dimension required
  if (!values.site_dimensions || values.site_dimensions.length === 0) {
    errors.site_dimensions = "At least one site dimension is required";
  } else {
    // 2. Validate each site dimension
    values.site_dimensions.forEach((dimension, index) => {
      const areaName = dimension.area_name?.trim();
      const dimensions = dimension.dimensionsunits?.trim();
      const hasImages = dimension.images && dimension.images.length > 0;

      // Item name is required
      if (!areaName) {
        errors[`site_dimensions.${index}.area_name`] = "Item name is required";
      }

      // Dimensions/Units are required
      if (!dimensions) {
        errors[`site_dimensions.${index}.dimensionsunits`] = "Dimensions/Units are required";
      }

      // At least one media file required
      if (!hasImages) {
        errors[`site_dimensions.${index}.images`] = "At least one media file is required";
      }
    });
  }

  return errors;
};


const getMissingItemsText = (errors: Record<string, string>) => {
  const missingItems: string[] = [];
  
  Object.entries(errors).forEach(([field]) => {
    if (field.includes('area_name')) {
      const index = field.split('.')[1];
      missingItems.push(`Area ${parseInt(index) + 1}: Item name`);
    } else if (field.includes('dimensionsunits')) {
      const index = field.split('.')[1];
      missingItems.push(`Area ${parseInt(index) + 1}: Dimensions/Units`);
    } else if (field.includes('images')) {
      const index = field.split('.')[1];
      missingItems.push(`Area ${parseInt(index) + 1}: Photos/Videos`);
    } else if (field === 'site_dimensions') {
      missingItems.push('Site dimensions');
    }
  });
  
  if (missingItems.length > 0) {
    return missingItems.length === 1 
      ? `Missing: ${missingItems[0]}` 
      : `Missing: ${missingItems.slice(0, 3).join(', ')}${missingItems.length > 3 ? ` and ${missingItems.length - 3} more` : ''}`;
  }
  
  return "Please fix the validation errors before submitting";
};

// Then in your onSubmit function:
const onSubmit = (values: z.infer<typeof formSchema>) => {
  const errors = validateInspectionForm(values);
  
  if (Object.keys(errors).length > 0) {
  // Set errors in the form
  Object.entries(errors).forEach(([field, message]) => {
    form.setError(field as any, {
      type: 'manual',
      message,
    });
  });
  
  // Show detailed toast notification
  const missingText = getMissingItemsText(errors);
  showToast.error(missingText);
  return;
}
  
  // Only call handleSubmit if there are no validation errors
  handleSubmit(values);
};


  // Memoize handleSubmit to prevent recreation
  const handleSubmit = useCallback(

    
    async (values: z.infer<typeof formSchema>) => {

      // const customErrors = validateInspectionForm(values);
      // if (Object.keys(customErrors).length > 0) {
      //   // Set errors in the form
      //   Object.entries(customErrors).forEach(([field, message]) => {
      //     form.setError(field as any, {
      //       type: "manual",
      //       message,
      //     });
      //   });

      //   // Show detailed toast notification
      //   const missingText = getMissingItemsText(customErrors);
      //   showToast.error(missingText);
      //   return;
      // }
      try {
        setLoading(true);
        const leadReference = todo?.reference_name || inspection?.lead;

        const measurementSketchUrl =
          values.measurement_sketch?.url || undefined;

        const siteDimensionsWithUrls = values.site_dimensions?.map((dim) => ({
          floor: dim.floor || "",
          room: dim.room || "",
          entity: dim.entity || "",
          area_name: dim.area_name,
          dimensionsunits: dim.dimensionsunits,
          notes: dim.notes || "",
          images: JSON.stringify(
            dim.images?.map((img) => ({ image_url: img.url })) || "[]"
          ),
          media: JSON.stringify(
            dim.images?.map((img) => ({ image_url: img.url })) || "[]"
          ), // <-- Add this line to satisfy the required 'media' property
          media_2: dim.media_2?.url || "",
        }));

        const customSiteImagesWithUrls = values.custom_site_images
          ?.filter((img) => typeof img.url === "string")
          ?.map((img) => ({
            image: img.url,
            remarks: img.remarks ?? "",
          }));

        const inspectionData = {
          ...values,
          inspection_status: isUpdateMode
            ? inspection?.status || "In Progress"
            : "In Progress",
          lead: leadReference,
          inspection_date: format(values.inspection_date, "yyyy-MM-dd"),
          inspection_time: values.inspection_time,
          doctype: "SiteInspection",
          measurement_sketch: measurementSketchUrl,
          site_dimensions: siteDimensionsWithUrls,
          custom_site_images: customSiteImagesWithUrls,
          custom_measurement_notes: values.custom_measurement_notes,
          custom_site_images_notes: values.custom_site_images_notes,
        };

        if (isUpdateMode && inspection?.name) {
          await updateInspectionbyId(inspection.name, inspectionData);
          showToast.success("Inspection updated successfully!");
        } else {
          await createInspection(inspectionData, todo?.name);
          showToast.success("Inspection created successfully!");
        }

        navigate("/inspector?tab=inspections");
      } catch (error) {
        console.error("Submission error:", error);
        showToast.error(
          `Failed to ${isUpdateMode ? "update" : "create"} inspection.`
        );
      } finally {
        setLoading(false);
      }
    },
     [
      isUpdateMode,
      todo?.reference_name,
      todo?.name,
      inspection?.lead,
      inspection?.name,
      inspection?.status,
      createInspection,
      updateInspectionbyId,
      navigate,
    ]
  );

  // Memoize handleCancelTodo to prevent recreation
  const handleCancelTodo = useCallback(async () => {
    try {
      setCancelling(true);
      if (todo?.name) {
        await updateTodoStatus(todo.name, "Cancelled");
        await UpdateLeadStatus(todo.reference_name, "Lead");
        showToast.success("Todo cancelled successfully!");
        navigate("/inspector?tab=inspections");
      }
    } catch (error) {
      showToast.error("Failed to cancel todo. Please try again.");
      console.error("Error cancelling todo:", error);
    } finally {
      setCancelling(false);
      setCancelTodoModalOpen(false);
    }
  }, [
    todo?.name,
    todo?.reference_name,
    updateTodoStatus,
    UpdateLeadStatus,
    navigate,
  ]);
  

  // Memoize getDisplayData to prevent recreation
  const displayData = useMemo(() => {
    if (todo) {
      return {
        leadDetails: todo.inquiry_data,
        showTodoActions: true,
        inspectionName: null,
        inspectionId: null,
      };
    } else if (inspection) {
      return {
        leadDetails: leadData,
        showTodoActions: false,
        inspectionName: inspection.name || null,
        inspectionId: inspection.inspection_id || null,
      };
    }
    return {
      leadDetails: null,
      showTodoActions: false,
      inspectionName: null,
      inspectionId: null,
    };
  }, [todo, inspection, leadData]);

  // Memoize delete handlers to prevent recreation
  const handleDeleteAreaDimension = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
      e.stopPropagation();
      setDimensionToDelete(index);
      setDeleteModalOpen(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(() => {
    if (dimensionToDelete !== null) {
      remove(dimensionToDelete);
    }
    setDeleteModalOpen(false);
    setDimensionToDelete(null);
  }, [dimensionToDelete, remove]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setDimensionToDelete(null);
  }, []);

  // Memoize append handler to prevent recreation
  const handleAppendDimension = useCallback(() => {
    append({
      area_name: "",
      dimensionsunits: "",
      images: [],
      media_2: undefined,
    });
  }, [append]);

  // Memoize default accordion value to prevent recreation
  const defaultAccordionValue = useMemo(() => ["dimensions"], []);

  if (!dataLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <PasswordResetLoader />
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white min-h-screen m-0 lg:p-4">
      <Card className="border-none shadow-sm max-w-7xl mx-auto p-0 m-0 gap-0">
        <InspectionHeader
          isUpdateMode={isUpdateMode}
          displayData={displayData}
          storeError={storeError}
          isSubmitted={isSubmitted}
        />
        <CardContent className="p-0 m-0">
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="p-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <Accordion
                      type="multiple"
                      defaultValue={defaultAccordionValue}
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
                              Inspection Details
                            </span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="bg-white">
                          <fieldset disabled>
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
                                              className="w-full justify-between text-left font-normal bg-gray-100 border-gray-300 cursor-not-allowed h-10"
                                            >
                                              {field.value ? (
                                                <span className="text-gray-900">
                                                  {format(
                                                    field.value,
                                                    "dd/MM/yyyy"
                                                  )}
                                                </span>
                                              ) : (
                                                <span className="text-gray-400">
                                                  Select date
                                                </span>
                                              )}
                                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
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
                                            className="pl-3 bg-gray-100 border-gray-300 text-gray-900 cursor-not-allowed h-10"
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
                          </fieldset>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Site Dimensions Section */}
                      <AccordionItem
                        value="dimensions"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">Site Dimensions</span>
                            <span className="text-sm text-gray-500">
                              ({fields.length} areas)
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
                          <div className="space-y-4">
                            {fields.map((field, index) => (
                              <div
                                key={field.id}
                                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                              >
                                {/* Header with Area Name and Delete Button */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700 text-sm bg-white px-2 py-1 rounded">
                                      Area {index + 1}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {form.watch(
                                        `site_dimensions.${index}.room`
                                      ) || ""}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isReadOnly}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                                    onClick={(e) =>
                                      handleDeleteAreaDimension(e, index)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Compact Form Grid */}
                                <div className="space-y-3">
                                  {/* Row 1: Floor and Room */}
                                  <div className="grid grid-cols-1 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`site_dimensions.${index}.floor`}
                                      render={({ field: floorField }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700 text-xs font-medium">
                                            Line 1
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Line 1"
                                              disabled={isReadOnly}
                                              className="bg-white border-gray-300 h-8 text-sm"
                                              {...floorField}
                                              onChange={(e) => {
                                                floorField.onChange(
                                                  capitalizeFirstLetter(
                                                    e.target.value
                                                  )
                                                );
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`site_dimensions.${index}.room`}
                                      render={({ field: roomField }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700 text-xs font-medium">
                                            Line 2
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Line 2"
                                              disabled={isReadOnly}
                                              className="bg-white border-gray-300 h-8 text-sm"
                                              {...roomField}
                                              onChange={(e) => {
                                                roomField.onChange(
                                                  capitalizeFirstLetter(
                                                    e.target.value
                                                  )
                                                );
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  {/* Row 2: Entity and Area Name */}
                                  <div className="grid grid-cols-1 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`site_dimensions.${index}.area_name`}
                                      render={({ field: areaNameField }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700 text-xs font-medium">
                                            Item Name{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Right side"
                                              disabled={isReadOnly}
                                              className="bg-white border-gray-300 h-8 text-sm"
                                              {...areaNameField}
                                              onChange={(e) => {
                                                areaNameField.onChange(
                                                  capitalizeFirstLetter(
                                                    e.target.value
                                                  )
                                                );
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`site_dimensions.${index}.dimensionsunits`}
                                      render={({ field: dimensionsField }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700 text-xs font-medium">
                                            Dimensions/Units{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </FormLabel>
                                          <FormControl>
                                            <textarea
                                              placeholder="e.g., 10x12 ft"
                                              disabled={isReadOnly}
                                              className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm min-h-[80px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                              rows={3}
                                              {...dimensionsField}
                                              onChange={(e) => {
                                                dimensionsField.onChange(
                                                  capitalizeFirstLetter(
                                                    e.target.value
                                                  )
                                                );
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  {/* Media Upload - Compact Layout */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`site_dimensions.${index}.images`}
                                      render={({ field: imagesField }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700 text-xs font-medium">
                                            📷 Photos/Videos
                                          </FormLabel>
                                          <MediaUpload
                                            label=""
                                            multiple={true}
                                            allowedTypes={["image", "video"]}
                                            value={
                                              imagesField.value as
                                                | MediaItem[]
                                                | undefined
                                            }
                                            onChange={(newMedia) => {
                                              imagesField.onChange(newMedia);
                                            }}
                                            inspectionStatus={form.watch(
                                              "inspection_status"
                                            )}
                                            isReadOnly={isReadOnly}
                                          />
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`site_dimensions.${index}.media_2`}
                                      render={({ field: mediaField }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700 text-xs font-medium">
                                            🎤 Audio Notes
                                          </FormLabel>
                                          <MediaUpload
                                            label=""
                                            multiple={false}
                                            allowedTypes={["audio"]} // Only audio allowed
                                            value={
                                              mediaField.value as
                                                | MediaItem
                                                | undefined
                                            }
                                            onChange={(newMedia) => {
                                              mediaField.onChange(newMedia);
                                            }}
                                            inspectionStatus={form.watch(
                                              "inspection_status"
                                            )}
                                            isReadOnly={isReadOnly}
                                          />
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="mt-2">
                                    <FormField
                                      control={form.control}
                                      name={`site_dimensions.${index}.notes`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700 text-xs font-medium">
                                            📝 Notes
                                          </FormLabel>
                                          <textarea
                                            className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Enter any notes"
                                            {...field}
                                            disabled={isReadOnly}
                                            onChange={(e) => {
                                              field.onChange(
                                                capitalizeFirstLetter(
                                                  e.target.value
                                                )
                                              );
                                            }}
                                          />
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Add New Area Button */}
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isReadOnly}
                              onClick={handleAppendDimension}
                              className="w-full border-dashed border-gray-300 text-gray-600 hover:text-emerald-700 hover:border-emerald-700 hover:bg-emerald-50 transition-colors h-10"
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add New Area
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Custom Images Section */}
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
                                  label="Additional Site Images/Media"
                                  multiple={true}
                                  allowedTypes={["image", "video"]}
                                  value={field.value as MediaItem[] | undefined}
                                  onChange={(newMedia) => {
                                    field.onChange(newMedia);
                                  }}
                                  inspectionStatus={form.watch(
                                    "inspection_status"
                                  )}
                                  isReadOnly={isReadOnly}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="custom_site_images_notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 text-xs font-medium">
                                  📝 Notes
                                </FormLabel>
                                <textarea
                                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Enter any notes"
                                  {...field}
                                  disabled={isReadOnly}
                                  onChange={(e) => {
                                    field.onChange(
                                      capitalizeFirstLetter(e.target.value)
                                    );
                                  }}
                                />
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* Measurement Sketch Section */}
                      <AccordionItem
                        value="measurement-sketch"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-emerald-600" />
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
                                  label="Upload Measurement Sketch"
                                  multiple={false}
                                  allowedTypes={["image", "video"]}
                                  value={field.value as MediaItem | undefined}
                                  onChange={(newMedia) => {
                                    field.onChange(newMedia);
                                  }}
                                  inspectionStatus={form.watch(
                                    "inspection_status"
                                  )}
                                  isReadOnly={isReadOnly}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="custom_measurement_notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 text-xs font-medium">
                                  📝 Notes
                                </FormLabel>
                                <textarea
                                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Enter any notes"
                                  {...field}
                                  disabled={isReadOnly}
                                  onChange={(e) => {
                                    field.onChange(
                                      capitalizeFirstLetter(e.target.value)
                                    );
                                  }}
                                />
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
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
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter any additional notes or observations..."
                                    disabled={isReadOnly}
                                    className="min-h-[100px] bg-white border-gray-300 resize-none"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(
                                        capitalizeFirstLetter(e.target.value)
                                      );
                                    }}
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
                    {!isReadOnly && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={loading || storeLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {isUpdateMode ? "Updating..." : "Creating..."}
                            </>
                          ) : (
                            <>
                              {isUpdateMode
                                ? "Update Inspection"
                                : "Create Inspection"}
                            </>
                          )}
                        </Button>

                        {displayData.showTodoActions && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={cancelling}
                            onClick={() => setCancelTodoModalOpen(true)}
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium py-2 px-4 rounded-md transition-colors"
                          >
                            {cancelling ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Cancelling...
                              </>
                            ) : (
                              "Cancel Inspection"
                            )}
                          </Button>
                        )}
                      </div>
                    )}
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

      {/* Cancel Inspection Confirmation Modal */}
      <DeleteConfirmation
        text="Are you sure you want to cancel this inspection? This action cannot be undone and the inspection will be marked as cancelled."
        onConfirm={handleCancelTodo}
        onCancel={() => setCancelTodoModalOpen(false)}
        isOpen={cancelTodoModalOpen}
        setIsOpen={setCancelTodoModalOpen}
      />
    </div>
  );
};

export default CreateInspection;
