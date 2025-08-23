/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/helpers/inspectionHelpers.ts

// import { showToast } from "react-hot-showToast";
import { frappeAPI } from "../api/frappeClient";
import { format } from "date-fns";
import { showToast } from "./comman";

/**
 * File Upload Helper Functions
 */

// Enhanced upload function with progress tracking
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file || file.size === 0) {
    throw new Error("Invalid file selected");
  }

  try {
    onProgress?.(10); // Optional progress callback

    const response = await frappeAPI.upload(file);
    onProgress?.(80);

    if (!response.success) {
      throw new Error(response.error || "Upload failed");
    }

    const data = response.data;
    let fileUrl = "";

    // Handle different response formats
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

    // Ensure proper URL format
    if (!fileUrl.startsWith("http") && !fileUrl.startsWith("/")) {
      fileUrl = `/files/${fileUrl}`;
    }

    onProgress?.(100);
    return fileUrl;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

// Validates file before upload
export const validateFile = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (file.size > maxSize) {
    showToast.error(`File "${file.name}" exceeds 10MB limit`);
    return false;
  }

  if (!allowedTypes.includes(file.type)) {
    showToast.error(`File "${file.name}" has unsupported format`);
    return false;
  }

  return true;
};

/**
 * Image Handling Functions
 */

// Handles multiple image uploads
export const handleMultipleImageUpload = async (
  files: FileList,
  currentImages: any[],
  setUploading: (value: boolean) => void,
  setUploadProgress: (value: number) => void,
  setFormValue: (value: any[]) => void
) => {
  if (!files || files.length === 0) {
    showToast.error("No files selected");
    return currentImages;
  }

  const validFiles = Array.from(files).filter(validateFile);

  if (validFiles.length === 0) {
    showToast.error("No valid files to upload");
    return currentImages;
  }

  // let toastId: string | undefined;
  try {
    setUploading(true);
    setUploadProgress(0);
   showToast.loading(`Uploading ${validFiles.length} image(s)...`);

    const newImages = await Promise.all(
      validFiles.map(async (file, index) => {
        try {
          const fileUrl = await uploadFile(file, (progress) => {
            const fileProgress = ((index + progress / 100) / validFiles.length) * 100;
            setUploadProgress(Math.min(fileProgress, 100));
          });

          return {
            id: Math.random().toString(36).substr(2, 9),
            image: fileUrl,
            remarks: file.name.split(".")[0] || `Image ${currentImages.length + index + 1}`,
          };
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          showToast.error(`Failed to upload ${file.name}`);
          return null;
        }
      })
    );

    const successfulUploads = newImages.filter(Boolean);
    if (successfulUploads.length > 0) {
      const updatedImages = [...currentImages, ...successfulUploads];
      setFormValue(updatedImages);
      showToast.success(`${successfulUploads.length} image(s) uploaded successfully!`);
      return updatedImages;
    }
    return currentImages;
  } catch (error) {
    console.error("Multiple image upload error:", error);
    showToast.error("Failed to upload images");
    return currentImages;
  } finally {
    setUploading(false);
    // if (toastId !== undefined) showToast.dismiss(toastId);
    setTimeout(() => setUploadProgress(0), 1000);
  }
};

// Handles single file upload
export const handleSingleFileUpload = async (
  file: File,
  // fieldName: string,
  setUploading: (value: boolean) => void,
  setUploadProgress: (value: number) => void,
  setFormValue: (value: any) => void,
  index?: number
) => {
  if (!file) {
    showToast.error("No file selected");
    return;
  }

  if (!validateFile(file)) return;

  // let toastId: string | undefined;
  try {
    setUploading(true);
    setUploadProgress(0);
    showToast.loading("Uploading file...");

    const fileUrl = await uploadFile(file, setUploadProgress);

    if (!fileUrl) {
      throw new Error("File uploaded but no URL returned");
    }

    if (index !== undefined) {
      setFormValue((prev: any) => {
        const newValue = [...prev];
        newValue[index] = { ...newValue[index], media: fileUrl };
        return newValue;
      });
    } else {
      setFormValue(fileUrl);
    }

    showToast.success(`File "${file.name}" uploaded successfully!`);
  } catch (error) {
    console.error("File upload error:", error);
    showToast.error("Failed to upload file");
  } finally {
    setUploading(false);
    // if (toastId !== undefined) showToast.dismiss(toastId);
    setTimeout(() => setUploadProgress(0), 1000);
  }
};

/**
 * Camera Capture Functions
 */

export const captureImageFromCamera = async (): Promise<string | null> => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not available");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: 1280, height: 720 }
    });

    return new Promise((resolve) => {
      const modal = createCameraModal(stream, resolve);
      document.body.appendChild(modal);
    });
  } catch (error) {
    console.error("Camera capture error:", error);
    showToast.error("Failed to access camera");
    return null;
  }
};

const createCameraModal = (stream: MediaStream, resolve: (value: string | null) => void): HTMLElement => {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col";

  const video = document.createElement("video");
  video.className = "w-full h-full max-w-md object-cover rounded-lg";
  video.autoplay = true;
  video.playsInline = true;
  video.srcObject = stream;

  const cleanup = () => {
    stream.getTracks().forEach(track => track.stop());
    document.body.removeChild(modal);
  };

  modal.innerHTML = `
    <div class="flex items-center justify-between p-4 text-white">
      <h3 class="text-lg font-semibold">Take Photo</h3>
      <button id="close-camera" class="p-2 hover:bg-gray-700 rounded-full">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class="flex-1 flex items-center justify-center p-4">
      ${video.outerHTML}
    </div>
    <div class="flex items-center justify-center gap-4 p-4">
      <button id="capture-btn" class="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-4 shadow-lg">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 10v6m11-7h-6m-10 0H1"></path>
        </svg>
      </button>
    </div>
  `;

  modal.querySelector("#close-camera")?.addEventListener("click", () => {
    cleanup();
    resolve(null);
  });

  modal.querySelector("#capture-btn")?.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.8);
    cleanup();
    resolve(imageUrl);
  });

  video.onloadedmetadata = () => video.play();

  return modal;
};

/**
 * Form Data Preparation
 */

export const prepareInspectionData = (
  values: any,
  isUpdateMode: boolean,
  inspectionToUpdate?: any,
  todo?: any
) => {
  const leadReference = todo?.reference_name || inspectionToUpdate?.lead;
  
  return {
    ...values,
    status: isUpdateMode ? inspectionToUpdate?.status || "In Progress" : "In Progress",
    lead: leadReference,
    inspection_date: format(values.inspection_date, "yyyy-MM-dd"),
    site_dimensions: values.site_dimensions?.map((dim: any) => ({
      area_name: dim.area_name,
      dimensionsunits: dim.dimensionsunits,
      media: typeof dim.media === "string" ? dim.media : "",
    })),
    custom_site_images: values.custom_site_images
      ?.filter((img: any) => img.image && img.remarks)
      ?.map((img: any) => ({
        image: img.image,
        remarks: img.remarks,
      })),
    doctype: "SiteInspection",
  };
};

/**
 * Customer Data Helpers
 */

export const getCustomerName = (todo?: any, leadData?: any, inspection?: any): string => {
  if (todo?.inquiry_data) {
    if (todo.inquiry_data.lead_name) return todo.inquiry_data.lead_name;
    const firstName = todo.inquiry_data.first_name || "";
    const lastName = todo.inquiry_data.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Unknown Lead";
  }

  if (leadData?.lead_name) return leadData.lead_name;
  if (inspection?.customer_name) return inspection.customer_name;
  
  return "Unknown Lead";
};

export const fetchLeadData = async (leadName: string) => {
  try {
    const response = await frappeAPI.getLeadById(leadName);
    return response.data;
  } catch (error) {
    console.error("Error fetching lead data:", error);
    showToast.error("Failed to fetch lead information");
    return null;
  }
};

/**
 * Image Management Functions
 */

export const removeCustomImage = (
  index: number,
  currentImages: any[],
  setFormValue: (value: any[]) => void
) => {
  if (index < 0 || index >= currentImages.length) {
    showToast.error("Invalid image index");
    return currentImages;
  }

  const updatedImages = currentImages.filter((_, i) => i !== index);
  setFormValue(updatedImages);
  showToast.success("Image removed successfully");
  return updatedImages;
};

export const clearAllCustomImages = (setFormValue: (value: any[]) => void) => {
  setFormValue([]);
  showToast.success("All images cleared");
  return [];
};