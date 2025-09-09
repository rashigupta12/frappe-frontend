/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";
import { frappeAPI } from "../../../api/frappeClient";
import { useInspectionStore } from "../../../store/inspectionStore";
import DeleteConfirmation from "../../common/DeleteComfirmation";
import { parseISO } from "date-fns/parseISO";
import { showToast } from "../../../helpers/comman";
import { Loader } from "../../common/Loader";
import { Card, CardContent } from "../../ui/card";
import { Form } from "../../ui/form";
import { formSchema, getMediaType, type MediaItem } from "../components/utils/fileUpload";
import ActionButtons from "./ActionButton";
import InspectionHeader from "./InspectionHeader";
import InspectionForm from "./Inspectionform";
import { format } from "date-fns";


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
        if (media2Type === "audio" || dim.media_2.includes(".webm")) {
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
             errors[`site_dimensions.${index}.area_name`] =
               "Item name is required";
           }
   
           // Dimensions/Units are required
           if (!dimensions) {
             errors[`site_dimensions.${index}.dimensionsunits`] =
               "Dimensions/Units are required";
           }
   
           // At least one media file required
           if (!hasImages) {
             errors[`site_dimensions.${index}.images`] =
               "At least one media file is required";
           }
         });
       }
   
       return errors;
     };
   
     const getMissingItemsText = (errors: Record<string, string>) => {
       const missingItems: string[] = [];
   
       Object.entries(errors).forEach(([field]) => {
         if (field.includes("area_name")) {
           const index = field.split(".")[1];
           missingItems.push(`Area ${parseInt(index) + 1}: Item name`);
         } else if (field.includes("dimensionsunits")) {
           const index = field.split(".")[1];
           missingItems.push(`Area ${parseInt(index) + 1}: Dimensions/Units`);
         } else if (field.includes("images")) {
           const index = field.split(".")[1];
           missingItems.push(`Area ${parseInt(index) + 1}: Photos/Videos`);
         } else if (field === "site_dimensions") {
           missingItems.push("Site dimensions");
         }
       });
   
       if (missingItems.length > 0) {
         return missingItems.length === 1
           ? `Missing: ${missingItems[0]}`
           : `Missing: ${missingItems.slice(0, 3).join(", ")}${
               missingItems.length > 3
                 ? ` and ${missingItems.length - 3} more`
                 : ""
             }`;
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
             type: "manual",
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
    //  const handleCancelTodo = useCallback(async () => {
    //    try {
    //      setCancelling(true);
    //      if (todo?.name) {
    //        await updateTodoStatus(todo.name, "Cancelled");
    //        await UpdateLeadStatus(todo.reference_name, "Lead");
    //        showToast.success("Todo cancelled successfully!");
    //        navigate("/inspector?tab=inspections");
    //      }
    //    } catch (error) {
    //      showToast.error("Failed to cancel todo. Please try again.");
    //      console.error("Error cancelling todo:", error);
    //    } finally {
    //      setCancelling(false);
    //      setCancelTodoModalOpen(false);
    //    }
    //  }, [
    //    todo?.name,
    //    todo?.reference_name,
    //    updateTodoStatus,
    //    UpdateLeadStatus,
    //    navigate,
    //  ]);

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

  // ... rest of handlers and validation logic



  if (!dataLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
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
                  <InspectionForm
                    form={form}
                    fields={fields}
                    append={append}
                    remove={remove}
                    isReadOnly={isReadOnly}
                    onDeleteAreaDimension={(index: number) => {
                      setDimensionToDelete(index);
                      setDeleteModalOpen(true);
                    }}
                  />
                  
                  <ActionButtons
                    isReadOnly={isReadOnly}
                    loading={loading}
                    storeLoading={storeLoading}
                    isUpdateMode={isUpdateMode}
                    displayData={displayData}
                    cancelling={cancelling}
                    onSubmit={form.handleSubmit(onSubmit)}

                    onCancelTodo={() => setCancelTodoModalOpen(true)}
                  />
                </Form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        text="Are you sure you want to delete this area dimension? This action cannot be undone."
        onConfirm={() => {
          if (dimensionToDelete !== null) {
            remove(dimensionToDelete);
          }
          setDeleteModalOpen(false);
          setDimensionToDelete(null);
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDimensionToDelete(null);
        }}
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
      />

      {/* Cancel Inspection Confirmation Modal */}
      <DeleteConfirmation
        text="Are you sure you want to cancel this inspection? This action cannot be undone and the inspection will be marked as cancelled."
        onConfirm={async () => {
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
        }}
        onCancel={() => setCancelTodoModalOpen(false)}
        isOpen={cancelTodoModalOpen}
        setIsOpen={setCancelTodoModalOpen}
      />
    </div>
  );
};

export default CreateInspection;