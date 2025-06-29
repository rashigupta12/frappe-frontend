/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  CalendarIcon,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Home,
  Image as ImageIcon,
  Info,
  Phone,
  Plus,
  Ruler,
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
import DeleteConfirmation from "../../common/DeleteComfirmation";
import { useInspectionStore } from "../../store/inspectionStore";
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
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";

const formSchema = z.object({
  inspection_date: z.date(),
  status: z
    .enum(["Scheduled", "In Progress", "Completed"])
    .default("Scheduled"),
  customer_name: z.string().optional(),
  inspection_time: z.string(),
  property_type: z.string(),
  site_photos: z.any().optional(),
  measurement_sketch: z.union([z.string(), z.instanceof(File)]).optional(),
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
  custom_site_images: z
    .array(
      z.object({
        image: z.string().optional(),
        remarks: z.string().optional(),
      })
    )
    .optional(),
});

// Enhanced upload function with better progress tracking
// Enhanced upload function with better progress tracking
const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file || file.size === 0) {
    throw new Error("Invalid file selected");
  }

  try {
    // Simulate progress if callback provided
    if (onProgress) {
      onProgress(10);
    }

    const response = await frappeAPI.upload(file);

    if (onProgress) {
      onProgress(80);
    }

    if (!response.success) {
      throw new Error(response.error || "Upload failed");
    }

    const data = response.data;
    let fileUrl = "";

    if (data?.message?.file_url) {
      fileUrl = data.message.file_url;
    } else if (data?.message?.file_name) {
      fileUrl = data.message.file_name;
    } else if (data?.file_url) {
      fileUrl = data.file_url;
    } else if (data?.file_name) {
      fileUrl = data.file_name;
    } else if (typeof data?.message === "string") {
      fileUrl = data.message;
    }

    if (!fileUrl) {
      throw new Error("No file URL found in response");
    }

    if (!fileUrl.startsWith("http") && !fileUrl.startsWith("/")) {
      fileUrl = `/files/${fileUrl}`;
    }

    if (onProgress) {
      onProgress(100);
    }

    return fileUrl;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};
const CreateInspection = () => {
  const ImageUrl =
    import.meta.env.VITE_IMAGEURL || "https://eits.thebigocommunity.org";
  const cleanImageUrl = ImageUrl.endsWith("/")
    ? ImageUrl.slice(0, -1)
    : ImageUrl;
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

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
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

  const getCustomerName = () => {
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
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inspection_date: new Date(),
      inspection_time: "",
      customer_name: getCustomerName(),
      property_type: "Residential",
      status: inspection?.status || "Scheduled",
      site_photos: undefined,
      measurement_sketch: inspection?.measurement_sketch || undefined,
      inspection_notes: "",
      site_dimensions: [] as Array<{
        area_name: string;
        dimensionsunits: string;
        media?: any;
      }>,
      custom_site_images: [] as Array<{
        image: string;
        remarks: string;
      }>,
    },
  });

  // Add near the top of your component
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "measurement_sketch" || !name) {
        console.log(
          "Measurement sketch value changed:",
          value.measurement_sketch
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "site_dimensions",
  });

  const { fields: customImageFields } = useFieldArray({
    control: form.control,
    name: "custom_site_images",
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
        if (inspectionToUse.status)
          form.setValue("status", inspectionToUse.status);
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
        if (
          inspectionToUse.custom_site_images &&
          Array.isArray(inspectionToUse.custom_site_images)
        ) {
          form.setValue(
            "custom_site_images",
            inspectionToUse.custom_site_images.map((img: any) => ({
              image: img.image || "",
              remarks: img.remarks || "",
            }))
          );
        }
      } else {
        setIsUpdateMode(false);
        const customerName = getCustomerName();
        form.setValue("customer_name", customerName);
      }
    }
  }, [currentInspection, inspection, dataLoaded, form, replace]);
  const handleMultipleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) {
      toast.error("No files selected");
      return;
    }

    const validFiles = Array.from(files).filter((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File "${file.name}" has unsupported format`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      toast.error("No valid files to upload");
      return;
    }

    const totalFiles = validFiles.length;
    const currentImages = form.getValues("custom_site_images") || [];

    try {
      setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading(`Uploading ${totalFiles} image(s)...`, {
        id: "upload",
      });

      const newImages = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileProgress = (i / totalFiles) * 100;
        setUploadProgress(fileProgress);

        try {
          const fileUrl = await uploadFile(file, (progress) => {
            const totalProgress = fileProgress + progress / totalFiles;
            setUploadProgress(Math.min(totalProgress, 100));
          });

          if (fileUrl) {
            newImages.push({
              id: Math.random().toString(36).substr(2, 9),
              image: fileUrl,
              remarks:
                file.name.split(".")[0] ||
                `Image ${currentImages.length + newImages.length + 1}`,
            });
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...currentImages, ...newImages];
        form.setValue("custom_site_images", updatedImages);
        form.trigger("custom_site_images");

        toast.dismiss(toastId);
        toast.success(`${newImages.length} image(s) uploaded successfully!`);
      } else {
        toast.dismiss(toastId);
        toast.error("No images were uploaded successfully");
      }
    } catch (error) {
      toast.dismiss("upload");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload images";
      toast.error(`Upload failed: ${errorMessage}`);
      console.error("Multiple image upload error:", error);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Keep your existing single file upload function for backward compatibility
  // const handleFileUpload = async (
  //   file: File,
  //   fieldName: string,
  //   index?: number
  // ) => {
  //   if (!file) {
  //     toast.error("No file selected");
  //     return;
  //   }
  //   if (!(file instanceof File)) {
  //     toast.error("Invalid file object");
  //     return;
  //   }

  //   try {
  //     setUploading(true);
  //     setUploadProgress(0);
  //     const toastId = toast.loading("Uploading file...", { id: "upload" });

  //     const maxSize = 10 * 1024 * 1024;
  //     if (file.size > maxSize) {
  //       throw new Error("File size exceeds 10MB limit");
  //     }

  //     const allowedTypes = [
  //       "image/jpeg",
  //       "image/jpg",
  //       "image/png",
  //       "image/gif",
  //       "application/pdf",
  //     ];
  //     if (!allowedTypes.includes(file.type)) {
  //       throw new Error(
  //         `File type "${file.type}" not supported. Please use JPEG, PNG, GIF, or PDF.`
  //       );
  //     }

  //     const fileUrl = await uploadFile(file, (progress) => {
  //       setUploadProgress(progress);
  //     });

  //     if (!fileUrl) {
  //       throw new Error("File uploaded but no URL returned");
  //     }

  //     if (index !== undefined) {
  //       form.setValue(`site_dimensions.${index}.media`, fileUrl);
  //     } else {
  //       form.setValue(fieldName as any, fileUrl);
  //     }

  //     toast.dismiss(toastId);
  //     toast.success(`File "${file.name}" uploaded successfully!`);
  //     form.trigger(fieldName as any);
  //   } catch (error) {
  //     toast.dismiss("upload");
  //     const errorMessage =
  //       error instanceof Error ? error.message : "Failed to upload file";
  //     toast.error(`Upload failed: ${errorMessage}`);
  //     console.error("File upload error:", {
  //       error,
  //       file: {
  //         name: file.name,
  //         size: file.size,
  //         type: file.type,
  //       },
  //     });
  //   } finally {
  //     setUploading(false);
  //     setTimeout(() => setUploadProgress(0), 1000);
  //   }
  // };

  // Function to remove a specific image
  const removeCustomImage = (index: number) => {
    try {
      const currentImages = form.getValues("custom_site_images") || [];

      if (index < 0 || index >= currentImages.length) {
        toast.error("Invalid image index");
        return;
      }

      const imageToRemove = currentImages[index];
      const updatedImages = currentImages.filter((_, i) => i !== index);

      form.setValue("custom_site_images", updatedImages);
      form.trigger("custom_site_images");

      toast.success(
        `Image "${imageToRemove.remarks || "Image"}" removed successfully`
      );
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    }
  };

  // Function to clear all images
  const clearAllCustomImages = () => {
    try {
      const currentImages = form.getValues("custom_site_images") || [];
      const imageCount = currentImages.length;

      form.setValue("custom_site_images", []);
      form.trigger("custom_site_images");

      toast.success(`All ${imageCount} images removed successfully`);
    } catch (error) {
      console.error("Error clearing all images:", error);
      toast.error("Failed to clear images");
    }
  };

  // Function to replace a specific image
  const replaceCustomImage = async (files: FileList, index: number) => {
    if (!files || files.length === 0) {
      toast.error("No file selected");
      return;
    }

    const file = files[0]; // Take only the first file for replacement

    try {
      setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading("Replacing image...", { id: "upload" });

      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Unsupported file type");
      }

      const fileUrl = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      // Update the specific image
      const currentImages = form.getValues("custom_site_images") || [];
      const updatedImages = [...currentImages];

      if (index >= 0 && index < updatedImages.length) {
        updatedImages[index] = {
          ...updatedImages[index],
          image: fileUrl,
          remarks:
            updatedImages[index].remarks ||
            file.name.split(".")[0] ||
            `Image ${index + 1}`,
        };

        form.setValue("custom_site_images", updatedImages);
        form.trigger("custom_site_images");
      }

      toast.dismiss(toastId);
      toast.success("Image replaced successfully!");
    } catch (error) {
      toast.dismiss("upload");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to replace image";
      toast.error(`Replace failed: ${errorMessage}`);
      console.error("Image replacement error:", error);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };
  const captureImageFromCamera = async () => {
    try {
      // Check if browser supports mediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available in this browser");
      }

      // For mobile devices, try to use the rear camera
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      return new Promise((resolve) => {
        // Create modal container
        const modal = document.createElement("div");
        modal.className =
          "fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col";

        // Create header
        const header = document.createElement("div");
        header.className = "flex items-center justify-between p-4 text-white";
        header.innerHTML = `
        <h3 class="text-lg font-semibold">Take Photo</h3>
        <button id="close-camera" class="p-2 hover:bg-gray-700 rounded-full">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      `;

        // Create video container
        const videoContainer = document.createElement("div");
        videoContainer.className =
          "flex-1 flex items-center justify-center p-4";

        const video = document.createElement("video");
        video.className = "w-full h-full max-w-md object-cover rounded-lg";
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = stream;

        // Create controls
        const controls = document.createElement("div");
        controls.className = "flex items-center justify-center gap-4 p-4";
        controls.innerHTML = `
        <button id="capture-btn" class="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-4 shadow-lg transition-colors">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 10v6m11-7h-6m-10 0H1"></path>
          </svg>
        </button>
      `;

        // Assemble modal
        videoContainer.appendChild(video);
        modal.appendChild(header);
        modal.appendChild(videoContainer);
        modal.appendChild(controls);
        document.body.appendChild(modal);

        // Event listeners
        const cleanup = () => {
          stream.getTracks().forEach((track) => track.stop());
          document.body.removeChild(modal);
        };

        const closeCameraBtn = document.getElementById("close-camera");
        if (closeCameraBtn) {
          closeCameraBtn.onclick = () => {
            cleanup();
            resolve(null);
          };
        }

        const captureBtn = document.getElementById("capture-btn");
        if (captureBtn) {
          captureBtn.onclick = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const imageUrl = canvas.toDataURL("image/jpeg", 0.8);
              cleanup();
              resolve(imageUrl);
            } else {
              cleanup();
              resolve(null);
            }
          };
        }

        // Handle video load
        video.onloadedmetadata = () => {
          video.play();
        };
      });
    } catch (error) {
      console.error("Camera capture error:", error);
      toast.error("Failed to access camera. Please check permissions.");
      return null;
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("Form values before submission:", values); // Debug

    try {
      setLoading(true);
      const inspectionToUpdate = inspection || currentInspection;
      const leadReference = todo?.reference_name || inspection?.lead;
      const customerName = getCustomerName();

      // Debug: Check measurement sketch value
      console.log("Measurement sketch value:", values.measurement_sketch);
      console.log(
        "Type of measurement sketch:",
        typeof values.measurement_sketch
      );

      const inspectionData = {
        ...values,
        status: isUpdateMode
          ? inspectionToUpdate?.status || "In Progress"
          : "In Progress",
        lead: leadReference,
        customer_name: customerName,
        inspection_date: format(values.inspection_date, "yyyy-MM-dd"),
        inspection_time: values.inspection_time,
        doctype: "SiteInspection",
        measurement_sketch: values.measurement_sketch || undefined, // Explicitly include
        site_dimensions: values.site_dimensions?.map((dim) => ({
          area_name: dim.area_name,
          dimensionsunits: dim.dimensionsunits,
          media: typeof dim.media === "string" ? dim.media : "",
        })),
        custom_site_images: values.custom_site_images
          ?.filter(
            (img) =>
              typeof img.image === "string" && typeof img.remarks === "string"
          )
          ?.map((img) => ({
            image: img.image ?? "",
            remarks: img.remarks ?? "",
          })),
      };

      console.log("Final submission data:", inspectionData); // Debug

      if (isUpdateMode && inspectionToUpdate?.name) {
        await updateInspectionbyId(inspectionToUpdate.name, inspectionData);
        toast.success("Inspection updated successfully!");

        if (todo?.name) {
          await updateTodoStatus(todo.name, "Completed");
        }
        navigate("/inspector?tab=inspections");
      } else {
        await createInspection(inspectionData, todo?.name);
        toast.success("Inspection created successfully!");
        navigate("/inspector?tab=inspections");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        `Failed to ${isUpdateMode ? "update" : "create"} inspection.`
      );
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

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Enhanced camera capture function
  const handleCameraCapture = async () => {
    try {
      const imageUrl = await captureImageFromCamera();
      if (imageUrl) {
        // Convert data URL to File object
        const response = await fetch(imageUrl as string);
        const blob = await response.blob();
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        // Create FileList-like object
        const fileList = new DataTransfer();
        fileList.items.add(file);

        // Use existing upload function
        handleMultipleImageUpload(fileList.files);
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      toast.error("Failed to capture image from camera");
    }
  };
  if (!displayData) {
    return (
      <div className="max-w-md mx-auto">
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
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-1">
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
        </CardHeader>

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

                      {/* Dimensions Section */}
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
                                        render={({ field }) => {
                                          const mediaArray = field.value
                                            ? Array.isArray(field.value)
                                              ? field.value
                                              : [field.value]
                                            : [];

                                          return (
                                            <FormItem>
                                              <FormLabel className="text-gray-700 text-sm">
                                                Media (Photos/Sketches)
                                              </FormLabel>
                                              <FormControl>
                                                <div className="space-y-2">
                                                  <div className="flex gap-2">
                                                    <label
                                                      htmlFor={`media-upload-${index}`}
                                                      className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                        uploading
                                                          ? "opacity-50 cursor-not-allowed"
                                                          : ""
                                                      }`}
                                                    >
                                                      <Upload className="h-5 w-5 text-gray-400" />
                                                      <span className="text-sm">
                                                        Upload
                                                      </span>
                                                      <Input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        id={`media-upload-${index}`}
                                                        onChange={async (e) => {
                                                          if (
                                                            e.target.files &&
                                                            e.target.files
                                                              .length > 0
                                                          ) {
                                                            const uploadedUrls: string[] =
                                                              [];
                                                            for (const file of Array.from(
                                                              e.target.files
                                                            )) {
                                                              try {
                                                                const url =
                                                                  await uploadFile(
                                                                    file
                                                                  );
                                                                uploadedUrls.push(
                                                                  url
                                                                );
                                                              } catch (error) {
                                                                console.error(
                                                                  "Upload failed:",
                                                                  error
                                                                );
                                                                toast.error(
                                                                  `Failed to upload ${file.name}`
                                                                );
                                                              }
                                                            }
                                                            field.onChange([
                                                              ...mediaArray,
                                                              ...uploadedUrls,
                                                            ]);
                                                          }
                                                        }}
                                                        disabled={uploading}
                                                      />
                                                    </label>

                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      className="flex-1 gap-2"
                                                      onClick={async () => {
                                                        const imageUrl =
                                                          await captureImageFromCamera();
                                                        if (imageUrl) {
                                                          try {
                                                            setUploading(true);
                                                            // Convert data URL to File object
                                                            const response =
                                                              await fetch(
                                                                imageUrl as string
                                                              );
                                                            const blob =
                                                              await response.blob();
                                                            const file =
                                                              new File(
                                                                [blob],
                                                                `camera-${Date.now()}.jpg`,
                                                                {
                                                                  type: "image/jpeg",
                                                                }
                                                              );
                                                            const uploadedUrl =
                                                              await uploadFile(
                                                                file
                                                              );
                                                            field.onChange([
                                                              ...mediaArray,
                                                              uploadedUrl,
                                                            ]);
                                                          } catch (error) {
                                                            toast.error(
                                                              "Failed to upload camera image"
                                                            );
                                                          } finally {
                                                            setUploading(false);
                                                          }
                                                        }
                                                      }}
                                                      disabled={uploading}
                                                    >
                                                      <Camera className="h-5 w-5" />
                                                      <span>Camera</span>
                                                    </Button>
                                                  </div>

                                                  {mediaArray.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                                      {mediaArray.map(
                                                        (media, mediaIndex) => (
                                                          <div
                                                            key={mediaIndex}
                                                            className="relative group aspect-square"
                                                          >
                                                            <div
                                                              className="w-full h-full rounded-md overflow-hidden border border-gray-200 cursor-pointer"
                                                              onClick={() => {
                                                                window.open(
                                                                  `${ImageUrl}${media}`,
                                                                  "_blank"
                                                                );
                                                              }}
                                                            >
                                                              <img
                                                                src={`${ImageUrl}${media}`}
                                                                alt={`Media ${
                                                                  mediaIndex + 1
                                                                }`}
                                                                className="w-full h-full object-cover"
                                                                onError={(
                                                                  e
                                                                ) => {
                                                                  (
                                                                    e.target as HTMLImageElement
                                                                  ).src =
                                                                    "/placeholder-image.jpg";
                                                                }}
                                                              />
                                                            </div>
                                                            <button
                                                              type="button"
                                                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updatedMedia =
                                                                  [
                                                                    ...mediaArray,
                                                                  ];
                                                                updatedMedia.splice(
                                                                  mediaIndex,
                                                                  1
                                                                );
                                                                field.onChange(
                                                                  updatedMedia.length >
                                                                    0
                                                                    ? updatedMedia
                                                                    : null
                                                                );
                                                              }}
                                                            >
                                                              <X className="h-3 w-3" />
                                                            </button>
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          );
                                        }}
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

                      <AccordionItem
                        value="custom-images"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium">Site Images</span>
                              {customImageFields.length > 0 && (
                                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                                  {customImageFields.length}
                                </span>
                              )}
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-2 ml-2">
                              <button
                                type="button"
                                className="p-2 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  document
                                    .getElementById("multiple-images-upload")
                                    ?.click();
                                }}
                                disabled={uploading}
                                title="Upload Images"
                              >
                                <Upload className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCameraCapture();
                                }}
                                disabled={uploading}
                                title="Take Photo"
                              >
                                <Camera className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
                          <div className="space-y-4">
                            {/* Hidden File Input */}
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              capture="environment"
                              className="hidden"
                              id="multiple-images-upload"
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  handleMultipleImageUpload(e.target.files);
                                }
                              }}
                              disabled={uploading}
                            />

                            {/* Upload Area - Compact for Mobile */}
                            {customImageFields.length === 0 && (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-6 w-6 text-emerald-600" />
                                    <Upload className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <div className="text-center">
                                    <span className="text-sm font-medium text-gray-700 block">
                                      Add Site Images
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                      Tap icons above to upload or take photos
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Images Grid - Mobile Optimized */}
                            {customImageFields.length > 0 && (
                              <div className="space-y-3">
                                {/* Header with Count and Clear All */}
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-gray-700">
                                    Images ({customImageFields.length})
                                  </h4>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 text-xs px-2 py-1"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Remove all ${customImageFields.length} images?`
                                        )
                                      ) {
                                        clearAllCustomImages();
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Clear All
                                  </Button>
                                </div>

                                {/* Compact Images Grid */}
                                <div className="grid grid-cols-4 gap-2">
                                  {customImageFields.map((field, index) => (
                                    <div
                                      key={field.id}
                                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-emerald-400 transition-colors"
                                      onClick={() => openImageModal(index)}
                                    >
                                      <FormField
                                        control={form.control}
                                        name={`custom_site_images.${index}.image`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormControl>
                                              <div className="relative w-full h-full">
                                                {field.value && (
                                                  <>
                                                    <img
                                                      src={`${ImageUrl}${field.value}`}
                                                      alt={`Site Image ${
                                                        index + 1
                                                      }`}
                                                      className="w-full h-full object-cover"
                                                    />
                                                    {/* Overlay with index */}
                                                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                                                      {index + 1}
                                                    </div>
                                                    {/* Remarks indicator */}
                                                    {form.getValues(
                                                      `custom_site_images.${index}.remarks`
                                                    ) && (
                                                      <div className="absolute bottom-1 right-1 bg-emerald-500 rounded-full w-2 h-2"></div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upload Progress */}
                            {uploading && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    Uploading...
                                  </span>
                                  <span className="text-gray-600">
                                    {uploadProgress}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Measurement Sketch Section */}
                      <AccordionItem
                        value="media"
                        className="border border-gray-200 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 py-2 hover:no-underline bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">
                              Measurement Sketch
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-2 bg-white rounded-b-lg">
                          <FormField
                            control={form.control}
                            name="measurement_sketch"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 text-sm font-medium">
                                  Measurement Sketch
                                </FormLabel>
                                <FormControl>
                                  <div className="space-y-3">
                                    {field.value && (
                                      <div className="relative group">
                                        {typeof field.value === "string" ? (
                                          field.value.match(/\.(pdf)$/i) ? (
                                            <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                                              <FileText className="h-8 w-8 text-red-500" />
                                              <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                  PDF Sketch
                                                </p>
                                                <a
                                                  href={`${ImageUrl}${field.value}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:underline"
                                                >
                                                  View PDF
                                                </a>
                                              </div>
                                              <button
                                                type="button"
                                                className="p-2 text-red-500 hover:text-red-700"
                                                onClick={() =>
                                                  field.onChange(undefined)
                                                }
                                              >
                                                <Trash2 className="h-5 w-5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                                              <img
                                                src={`${ImageUrl}${field.value}`}
                                                alt="Measurement Sketch"
                                                className="w-full h-48 object-contain bg-gray-50"
                                                onError={(e) => {
                                                  (
                                                    e.target as HTMLImageElement
                                                  ).src =
                                                    "/placeholder-image.jpg";
                                                }}
                                              />
                                              <button
                                                type="button"
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() =>
                                                  field.onChange(undefined)
                                                }
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            </div>
                                          )
                                        ) : (
                                          <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                                            <FileText className="h-8 w-8 text-gray-400" />
                                            <div className="flex-1">
                                              <p className="text-sm font-medium">
                                                {field.value.name}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {(
                                                  field.value.size / 1024
                                                ).toFixed(1)}{" "}
                                                KB
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              className="p-2 text-red-500 hover:text-red-700"
                                              onClick={() =>
                                                field.onChange(undefined)
                                              }
                                            >
                                              <Trash2 className="h-5 w-5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                      <label
                                        htmlFor="measurement-sketch-upload"
                                        className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                          uploading
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                      >
                                        <Upload className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm font-medium">
                                          {field.value
                                            ? "Replace Sketch"
                                            : "Upload Measurement Sketch"}
                                        </span>
                                        <Input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          className="hidden"
                                          id="measurement-sketch-upload"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              try {
                                                setUploading(true);
                                                const uploadedUrl =
                                                  await uploadFile(file);
                                                field.onChange(uploadedUrl);
                                              } catch (error) {
                                                toast.error(
                                                  "Failed to upload measurement sketch"
                                                );
                                              } finally {
                                                setUploading(false);
                                              }
                                            }
                                          }}
                                          disabled={uploading}
                                        />
                                      </label>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="flex items-center justify-center gap-2"
                                        onClick={async () => {
                                          const imageUrl =
                                            await captureImageFromCamera();
                                          if (imageUrl) {
                                            try {
                                              setUploading(true);
                                              // Convert data URL to File object
                                              const response = await fetch(
                                                typeof imageUrl === "string"
                                                  ? imageUrl
                                                  : ""
                                              );
                                              const blob =
                                                await response.blob();
                                              const file = new File(
                                                [blob],
                                                `sketch-${Date.now()}.jpg`,
                                                {
                                                  type: "image/jpeg",
                                                }
                                              );
                                              const uploadedUrl =
                                                await uploadFile(file);
                                              field.onChange(uploadedUrl);
                                            } catch (error) {
                                              toast.error(
                                                "Failed to upload camera image"
                                              );
                                            } finally {
                                              setUploading(false);
                                            }
                                          }
                                        }}
                                        disabled={uploading}
                                      >
                                        <Camera className="h-5 w-5" />
                                        <span>Capture from Camera</span>
                                      </Button>
                                    </div>

                                    {uploading && (
                                      <div className="space-y-1">
                                        <Progress
                                          value={uploadProgress}
                                          className="h-2 bg-gray-100"
                                        />
                                        <p className="text-xs text-gray-500">
                                          Uploading...
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
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

      {selectedImageIndex !== null &&
        (console.log("Selected Image Index:", selectedImageIndex),
        (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  Image {selectedImageIndex + 1} of {customImageFields.length}
                </h3>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Image Display */}
                <div className="relative w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                  {customImageFields[selectedImageIndex]?.image ? (
                    (console.log(
                      "Displaying Image:",
                      customImageFields[selectedImageIndex].image
                    ),
                    (
                      <img
                        src={
                          customImageFields[
                            selectedImageIndex
                          ]?.image?.startsWith("http")
                            ? customImageFields[selectedImageIndex].image
                            : `${cleanImageUrl}${
                                customImageFields[
                                  selectedImageIndex
                                ]?.image?.startsWith("/")
                                  ? ""
                                  : "/"
                              }${
                                customImageFields[selectedImageIndex]?.image ||
                                ""
                              }`
                        }
                        alt={`Site Image ${selectedImageIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-image.jpg";
                          target.classList.add("bg-gray-200");
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-gray-500 flex flex-col items-center">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <span>No image available</span>
                    </div>
                  )}
                </div>

                {/* Remarks Input */}
                <FormField
                  control={form.control}
                  name={`custom_site_images.${selectedImageIndex}.remarks`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-sm font-medium">
                        Remarks
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Front view, Damaged wall, etc."
                          className="bg-white border-gray-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        document
                          .getElementById(`replace-image-${selectedImageIndex}`)
                          ?.click();
                      }}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={async () => {
                        const imageUrl = await captureImageFromCamera();
                        if (
                          typeof imageUrl === "string" &&
                          imageUrl.length > 0
                        ) {
                          // Convert data URL to File object
                          const response = await fetch(imageUrl);
                          const blob = await response.blob();
                          const file = new File(
                            [blob],
                            `camera-${Date.now()}.jpg`,
                            { type: "image/jpeg" }
                          );
                          const fileList = new DataTransfer();
                          fileList.items.add(file);
                          replaceCustomImage(
                            fileList.files,
                            selectedImageIndex
                          );
                        }
                      }}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm("Remove this image?")) {
                        removeCustomImage(selectedImageIndex);
                        setSelectedImageIndex(null);
                      }
                    }}
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>

                {/* Navigation Buttons */}
                {customImageFields.length > 1 && (
                  <div className="flex justify-between pt-2 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedImageIndex(
                          Math.max(0, selectedImageIndex - 1)
                        )
                      }
                      disabled={selectedImageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedImageIndex(
                          Math.min(
                            customImageFields.length - 1,
                            selectedImageIndex + 1
                          )
                        )
                      }
                      disabled={
                        selectedImageIndex === customImageFields.length - 1
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Hidden file input for replacement */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id={`replace-image-${selectedImageIndex}`}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    replaceCustomImage(e.target.files, selectedImageIndex);
                  }
                }}
                disabled={uploading}
              />
            </div>
          </div>
        ))}

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
