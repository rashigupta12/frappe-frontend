/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { showToast } from "react-hot-showToast";
import { frappeAPI } from "../../../../api/frappeClient";
import { z } from "zod";
import { showToast } from "../../../../helpers/comman";

// export const formSchema = z.object({
//   inspection_date: z.date(),
//   inspection_status: z.string().optional(),
//   inspection_time: z.string(),
//   property_type: z.string(),
//   site_photos: z.any().optional(),
//   measurement_sketch: z.union([
//     z.object({
//       id: z.string(),
//       url: z.string(),
//       type: z.enum(["image", "video", "audio"]),
//       remarks: z.string().optional(),
//     }),
//     z.undefined()
//   ]).optional(),
//   inspection_notes: z.string().optional(),
//   site_dimensions: z.array(
//     z.object({
//       floor: z.string().optional(),
//       room: z.string().optional(),
//       entity: z.string().optional(),
//       area_name: z.string(),
//       dimensionsunits: z.string(),
//       notes: z.string().optional(),
//       images: z.array(
//         z.object({
//           id: z.string(),
//           url: z.string(),
//           type: z.enum(["image", "video"]), // Only image and video allowed for images
//           remarks: z.string().optional(),
//         })
//       ).optional(),
//       media_2: z.union([
//         z.object({
//           id: z.string(),
//           url: z.string(),
//           type: z.literal("audio"), // Strictly only audio allowed
//           remarks: z.string().optional(),
//         }),
//         z.undefined()
//       ]).optional(),
//     })
//   ).optional(),
//   custom_site_images: z
//     .array(
//       z.object({
//         id: z.string(),
//         url: z.string(),
//         type: z.enum(["image", "video", "audio"]),
//         remarks: z.string().optional(),
//       })
//     )
//     .optional(),
//   custom_measurement_notes: z.string().optional(),
//   custom_site_images_notes: z.string().optional(),
// });


export const formSchema = z.object({
  inspection_date: z.date({
    required_error: "Inspection date is required",
  }),
  inspection_status: z.string().optional(),
  inspection_time: z.string().min(1, "Inspection time is required"),
  property_type: z.string().min(1, "Property type is required"),
  
  measurement_sketch: z
    .object({
      id: z.string(),
      url: z.string(),
      type: z.enum(["image", "video", "audio", "unknown"]),
      remarks: z.string().optional(),
    })
    .optional()
    .nullable(),
  inspection_notes: z.string().optional(),
  site_dimensions: z.array(
    z.object({
      floor: z.string().optional(),
      room: z.string().optional(),
      entity: z.string().optional(),
      area_name: z.string().min(1, "Item name is required"),
      dimensionsunits: z.string().min(1, "Dimensions/Units are required"),
      notes: z.string().optional(),
      images: z.array(
        z.object({
          id: z.string(),
          url: z.string(),
          type: z.enum(["image", "video", "audio", "unknown"]),
          remarks: z.string().optional(),
        })
      ).min(1, "At least one media file is required"),
      media_2: z
        .object({
          id: z.string(),
          url: z.string(),
          type: z.enum(["image", "video", "audio", "unknown"]),
          remarks: z.string().optional(),
        })
        .optional()
        .nullable(),
    })
  ).min(1, "At least one site dimension is required"),
  custom_site_images: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      type: z.enum(["image", "video", "audio", "unknown"]),
      remarks: z.string().optional(),
    })
  ).optional(),
  custom_measurement_notes: z.string().optional(),
  custom_site_images_notes: z.string().optional(),
});

// MediaItem type for TypeScriptexport type MediaItem = z.infer<typeof formSchema>["measurement_sketch"];


// Type for our media items
export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video" | "audio";
  remarks?: string;
  file?: File; // Optional: keep original file for new uploads
}



/**
 * Uploads a file to the server with progress tracking
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @param retries - Number of retry attempts (default: 3)
 * @returns Promise resolving to the file URL
 */
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void,
  retries = 3
): Promise<string> => {
  if (!file || file.size === 0) {
    throw new Error("Invalid file selected");
  }

  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Initial progress
      if (onProgress) onProgress(5);

      const response = await frappeAPI.upload(file, {
        // Add any required options here, e.g. folder, is_private, etc.
        // If frappeAPI.upload supports a progress callback, add it as a property in the API definition.
      });

      if (onProgress) onProgress(97);

      if (!response.success) {
        throw new Error(response.error || "Upload failed");
      }

      const fileUrl = extractFileUrl(response.data);
      if (!fileUrl) {
        throw new Error("No file URL found in response");
      }

      if (onProgress) onProgress(100);

      return fileUrl;
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt + 1} failed:`, error);
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Upload failed after retries");
};




/**
 * Records audio from microphone
 * @returns Promise resolving to recorded audio File or null
 */
export const recordAudio = async (): Promise<File | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Find supported MIME type
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    const mimeType = mimeTypes.find(MediaRecorder.isTypeSupported) || '';
    if (!mimeType) {
      throw new Error("No supported audio format available");
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

    const recordingPromise = new Promise<File>((resolve, reject) => {
      recorder.onstop = () => {
        if (chunks.length === 0) {
          reject(new Error("No audio data recorded"));
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const extension = mimeType.includes('wav') ? 'wav' :
          mimeType.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `recording-${Date.now()}.${extension}`, {
          type: mimeType,
          lastModified: Date.now()
        });

        resolve(file);
      };

      recorder.onerror = (event) => {
        reject(new Error(`Recording error: ${event.error?.message || 'Unknown error'}`));
      };
    });

    recorder.start();
    showToast.success("Recording started...");

    // In a real app, you'd have a UI button to stop recording
    // For this example, we'll stop after 30 seconds max
    const maxDuration = 30000; // 30 seconds
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, maxDuration);

    const file = await recordingPromise;
    stream.getTracks().forEach(track => track.stop());
    showToast.success("Recording completed");
    return file;

  } catch (error) {
    console.error("Audio recording error:", error);
    showToast.error(`Recording failed`);
    return null;
  }
};

/**
 * Determines media type from file or URL
 * @param file - File object or URL string
 * @returns Media type or 'unknown'
 */
export const getMediaType = (fileOrUrl: File | string): "image" | "video" | "audio" | "unknown" => {
  let fileName: string;
  let fileSize: number = 0;
  
  if (typeof fileOrUrl === 'string') {
    fileName = fileOrUrl.toLowerCase();
  } else {
    fileName = fileOrUrl.name.toLowerCase();
    fileSize = fileOrUrl.size;
  }

  // Enhanced image extensions
  if (/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i.test(fileName)) {
    return "image";
  }
  
  // Handle webm files - check context or size to determine if it's video or audio
  if (fileName.includes('.webm')) {
    // If file size is available and it's small (< 5MB), likely audio
    // If no size info, check if it's in an audio context
    if (fileSize > 0 && fileSize < 5 * 1024 * 1024) {
      return "audio";
    }
    // For larger files or when context suggests video, return video
    // You might need to adjust this logic based on your specific use case
    return "video"; // Default to video for webm files
  }
  
  // Enhanced video extensions
  if (/\.(mp4|avi|mov|wmv|flv|mkv|m4v|3gp|ogv)(\?.*)?$/i.test(fileName)) {
    return "video";
  }
  
  // Enhanced audio extensions
  if (/\.(mp3|wav|ogg|aac|m4a|wma|flac|opus)(\?.*)?$/i.test(fileName)) {
    return "audio";
  }

  return "unknown";
};

/**
 * Checks if device has camera support
 * @param type - 'image' or 'video'
 * @returns Promise resolving to boolean
 */
export const hasCameraSupport = async (type: 'image' | 'video'): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return false;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');

    if (type === 'video') {
      return hasCamera && typeof MediaRecorder !== 'undefined';
    }
    return hasCamera;
  } catch (error) {
    console.error('Camera support check failed:', error);
    return false;
  }
};

/**
 * Checks if device has microphone support
 * @returns Promise resolving to boolean
 */
export const hasMicrophoneSupport = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return false;

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Microphone support check failed:', error);
    return false;
  }
};

/**
 * Validates a file against constraints
 * @param file - File to validate
 * @param allowedTypes - Allowed media types
 * @param maxSizeMB - Maximum size in MB
 * @returns Validation error message or null if valid
 */
export const validateFile = (
  file: File,
  allowedTypes: ("image" | "video" | "audio")[],
  maxSizeMB: number
): string | null => {
  const type = getMediaType(file);

  if (type === "unknown") {
    return `File "${file.name}" has an unsupported format.`;
  }

  if (!allowedTypes.includes(type)) {
    return `File "${file.name}" type (${type}) is not allowed.`;
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File "${file.name}" exceeds ${maxSizeMB}MB size limit.`;
  }

  // Special validation for videos
  if (type === "video" && file.size > 50 * 1024 * 1024) {
    return "Video files must be smaller than 50MB";
  }

  return null;
};


// Fixed camera capture function with better laptop support
const captureMediaFromCamera = async (
  type: "image" | "video"
): Promise<File | null> => {
  return new Promise((resolve) => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = type === "image" ? "image/*" : "video/*";

      // Remove capture attribute for laptop compatibility
      // The capture attribute forces mobile camera, which doesn't work on laptops
      // input.setAttribute("capture", "environment"); // Remove this line

      input.style.display = "none";
      document.body.appendChild(input);

      const cleanup = () => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        cleanup();

        resolve(null);
      }, 60000); // 60 second timeout

      input.onchange = async (event: Event) => {
        clearTimeout(timeout);
        const target = event.target as HTMLInputElement;

        if (target.files && target.files.length > 0) {
          const file = target.files[0];


          // Validate file
          if (file.size > 0) {
            resolve(file);
          } else {
            console.error("Selected file is empty");
            resolve(null);
          }
        } else {

          resolve(null);
        }
        cleanup();
      };

      input.onerror = (error) => {
        clearTimeout(timeout);
        console.error("File input error:", error);
        cleanup();
        resolve(null);
      };

      // Trigger file dialog
      input.click();

    } catch (error) {
      console.error("Camera capture setup error:", error);
      resolve(null);
    }
  });
};

// Alternative: Use WebRTC for actual camera access (better for laptops)
const captureFromWebRTCCamera = async (
  type: "image" | "video"
): Promise<File | null> => {
  try {
    // Check if browser supports camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera access not supported in this browser");
    }

    // Request camera permissions
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: "environment" // Use back camera if available
      },
      audio: type === "video" ? true : false
    });

    if (type === "image") {
      return await captureImageFromStream(stream);
    } else {
      return await captureVideoFromStream(stream);
    }
  } catch (error) {
    console.error("WebRTC camera error:", error);

    // Provide user-friendly error messages
    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
          throw new Error("Camera access denied. Please allow camera permissions and try again.");
        case "NotFoundError":
          throw new Error("No camera found on this device.");
        case "NotReadableError":
          throw new Error("Camera is already in use by another application.");
        case "NotSupportedError":
          throw new Error("Camera access is not supported on this device.");
        default:
          throw new Error(`Camera error: ${error.message}`);
      }
    }

    throw error;
  }
};

// Capture image from camera stream
const captureImageFromStream = async (stream: MediaStream): Promise<File | null> => {
  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;

    // Wait for video to load
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(void 0);
    });

    // Create canvas and capture frame
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    // Stop the stream
    stream.getTracks().forEach(track => track.stop());

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now()
          });
          resolve(file);
        } else {
          resolve(null);
        }
      }, "image/jpeg", 0.8); // 80% quality
    });

  } catch (error) {
    console.error("Image capture error:", error);
    // Stop stream if it exists
    stream.getTracks().forEach(track => track.stop());
    return null;
  }
};

// Capture video from camera stream
const captureVideoFromStream = async (stream: MediaStream): Promise<File | null> => {
  try {
    // Check for MediaRecorder support
    if (!window.MediaRecorder) {
      throw new Error("Video recording is not supported in this browser");
    }

    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];

    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      throw new Error("No supported video format found");
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 2500000 // 2.5 Mbps
    });

    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // Start recording
    recorder.start();

    // Record for 10 seconds (you can modify this or add UI controls)
    return new Promise((resolve) => {
      const recordingTimer = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 10000); // 10 seconds

      recorder.onstop = () => {
        clearTimeout(recordingTimer);
        stream.getTracks().forEach(track => track.stop());

        if (chunks.length === 0) {
          resolve(null);
          return;
        }

        const blob = new Blob(chunks, { type: selectedMimeType });
        const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `video-${Date.now()}.${extension}`, {
          type: selectedMimeType,
          lastModified: Date.now()
        });

        resolve(file);
      };

      recorder.onerror = (event) => {
        clearTimeout(recordingTimer);
        console.error("Recording error:", event);
        stream.getTracks().forEach(track => track.stop());
        resolve(null);
      };
    });

  } catch (error) {
    console.error("Video capture error:", error);
    stream.getTracks().forEach(track => track.stop());
    return null;
  }
};

// Fixed upload function with better error handling
export const uploadFileFixed = async (
  file: File,
  onProgress?: (progress: number) => void,
  retries = 3
): Promise<string> => {


  if (!file || file.size === 0) {
    throw new Error("Invalid file selected");
  }

  // Validate file size (50MB limit)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("File is too large. Maximum size is 50MB.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {


      if (onProgress) onProgress(5);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Add additional fields if needed
      formData.append('is_private', '0');
      formData.append('folder', 'Home');

      // Use XMLHttpRequest for better progress tracking
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 90) + 5; // 5-95%
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid response format"));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error occurred"));
        };

        xhr.ontimeout = () => {
          reject(new Error("Upload timeout"));
        };
      });

      // Configure request
      xhr.timeout = 60000; // 60 seconds timeout
      xhr.open('POST', '/api/method/upload_file', true);

      // Add authentication headers if needed
      // xhr.setRequestHeader('Authorization', 'Bearer ' + token);

      // Start upload
      xhr.send(formData);

      const response = await uploadPromise;

      if (onProgress) onProgress(97);

      // Extract file URL from response
      const fileUrl = extractFileUrl(response);
      if (!fileUrl) {
        throw new Error("No file URL found in response");
      }

      if (onProgress) onProgress(100);

      return fileUrl;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Upload attempt ${attempt + 1} failed:`, lastError);

      if (attempt < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Upload failed after retries");
};

// Helper function to extract file URL from response
const extractFileUrl = (data: any): string => {


  // Try different response formats
  if (data?.message?.file_url) return data.message.file_url;
  if (data?.message?.file_name) return data.message.file_name;
  if (data?.file_url) return data.file_url;
  if (data?.file_name) return data.file_name;
  if (data?.message && typeof data.message === 'string') {
    if (data.message.startsWith('/')) return data.message;
    if (data.message.includes('file_url')) {
      // Try to extract URL from message string
      const match = data.message.match(/file_url['":]?\s*['"]?([^'",\s]+)/);
      if (match) return match[1];
    }
  }

  console.error("Could not extract file URL from response:", data);
  return "";
};

// Enhanced camera support detection
export const hasEnhancedCameraSupport = async (): Promise<{
  hasWebRTC: boolean;
  hasFileInput: boolean;
  cameras: MediaDeviceInfo[];
}> => {
  const result = {
    hasWebRTC: false,
    hasFileInput: true, // File input is widely supported
    cameras: [] as MediaDeviceInfo[]
  };

  try {
    // Check WebRTC support
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
      result.hasWebRTC = true;

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      result.cameras = devices.filter(device => device.kind === 'videoinput');
    }
  } catch (error) {
    console.error('Camera support check failed:', error);
  }

  return result;
};

// Usage example for the fixed camera capture
export const handleCameraCapture = async (
  type: "image" | "video",
  useWebRTC: boolean = false
): Promise<File | null> => {
  try {
    if (useWebRTC) {
      // Use WebRTC for actual camera access (better for laptops)
      return await captureFromWebRTCCamera(type);
    } else {
      // Use file input (fallback, works on all devices)
      return await captureMediaFromCamera(type);
    }
  } catch (error) {
    console.error("Camera capture failed:", error);
    throw error;
  }
};