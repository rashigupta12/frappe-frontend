// /* eslint-disable @typescript-eslint/no-explicit-any */


// export const uploadFile = async (
//   file: File,
//   onProgress?: (progress: number) => void
// ): Promise<string> => {
//   if (!file || file.size === 0) {
//     throw new Error("Invalid file selected");
//   }

//   try {
//     // Simulate progress if callback provided - for real world, this would be from actual upload events
//     if (onProgress) {
//       onProgress(10);
//     }

//     const response = await frappeAPI.upload(file);

//     if (onProgress) {
//       onProgress(80);
//     }

//     if (!response.success) {
//       throw new Error(response.error || "Upload failed");
//     }

//     const data = response.data;
//     let fileUrl = "";

//     // Robust handling for various response structures
//     if (data?.message?.file_url) {
//       fileUrl = data.message.file_url;
//     } else if (data?.message?.file_name) {
//       fileUrl = data.message.file_name;
//     } else if (data?.file_url) {
//       fileUrl = data.file_url;
//     } else if (data?.file_name) {
//       fileUrl = data.file_name;
//     } else if (typeof data?.message === "string") {
//       fileUrl = data.message;
//     }

//     if (!fileUrl) {
//       throw new Error("No file URL found in response");
//     }

//     // Ensure URL is absolute or correctly relative
//     if (!fileUrl.startsWith("http") && !fileUrl.startsWith("/")) {
//       // Assuming /files/ is the correct base path for Frappe file storage
//       fileUrl = `/files/${fileUrl}`;
//     }

//     if (onProgress) {
//       onProgress(100);
//     }

//     return fileUrl;
//   } catch (error) {
//     console.error("File upload error:", error);
//     throw error;
//   }
// };

// export const captureMediaFromCamera = async (
//   type: "image" | "video"
// ): Promise<File | null> => {
//   return new Promise((resolve, reject) => {
//     const input = document.createElement("input");
//     input.type = "file";
//     input.accept = type === "image" ? "image/*" : "video/*";
//     input.setAttribute("capture", type === "image" ? "environment" : "user"); // 'environment' for rear camera, 'user' for front

//     input.onchange = async (event: Event) => {
//       const target = event.target as HTMLInputElement;
//       if (target.files && target.files.length > 0) {
//         const file = target.files[0];
//         resolve(file);
//       } else {
//         resolve(null);
//       }
//     };

//     input.onerror = (error) => {
//       console.error("Camera capture input error:", error);
//       reject(new Error("Failed to access camera."));
//     };

//     input.click();
//   });
// };

// export const recordAudio = async (): Promise<File | null> => {
//   return new Promise((resolve, reject) => {
//     let mediaRecorder: MediaRecorder | null = null;
//     const audioChunks: Blob[] = [];

//     navigator.mediaDevices
//       .getUserMedia({ audio: true })
//       .then((stream) => {
//         mediaRecorder = new MediaRecorder(stream);

//         mediaRecorder.ondataavailable = (event) => {
//           audioChunks.push(event.data);
//         };

//         mediaRecorder.onstop = () => {
//           const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
//           const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
//             type: "audio/webm",
//           });
//           stream.getTracks().forEach((track) => track.stop());
//           resolve(audioFile);
//         };

//         mediaRecorder.onerror = (event) => {
//           console.error("MediaRecorder error:", event);
//           stream.getTracks().forEach((track) => track.stop());
//           reject(new Error("Audio recording failed."));
//         };

//         mediaRecorder.start();
//         toast.success("Recording audio... click again to stop.");

//         // For simplicity, we'll stop it after a certain time or you can add a stop button
//         // In a real app, you'd have a UI button to stop recording.
//         // For demonstration, let's just expose a global stop function or require user interaction.
//         (window as any).stopAudioRecording = () => {
//           if (mediaRecorder && mediaRecorder.state === "recording") {
//             mediaRecorder.stop();
//             toast.success("Audio recording stopped.");
//           }
//         };
//       })
//       .catch((err) => {
//         console.error("Error accessing microphone:", err);
//         toast.error("Failed to access microphone. Please grant permission.");
//         reject(err);
//       });
//   });
// };

// // Extend formSchema for media types
// import * as z from "zod";
// import { frappeAPI } from "../../../../api/frappeClient";
// import toast from "react-hot-toast";
// // 1. Fix the formSchema to properly handle MediaItem types


// // Helper for file type determination
// export const getMediaType = (file: File | string): "image" | "video" | "audio" | "unknown" => {
//   const mimeType = typeof file === 'string' ? file.split('.').pop()?.toLowerCase() : file.type;

//   if (!mimeType) return "unknown";

//   if (mimeType.startsWith("image/")) return "image";
//   if (mimeType.startsWith("video/")) return "video";
//   if (mimeType.startsWith("audio/")) return "audio";

//   // Fallback for string URLs without direct MIME type
//   if (typeof file === 'string') {
//     if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) return "image";
//     if (/\.(mp4|webm|ogg)$/i.test(file)) return "video";
//     if (/\.(mp3|wav|ogg)$/i.test(file)) return "audio";
//   }

//   return "unknown";
// };

// // A type for our media items
// export interface MediaItem {
//   id: string;
//   url: string;
//   type: "image" | "video" | "audio";
//   remarks?: string;
//   file?: File; // Optional: keep the original file object for new uploads before they are sent to the server.
// }


/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-hot-toast";
import { frappeAPI } from "../../../../api/frappeClient";
import { z } from "zod";


export const formSchema = z.object({
  inspection_date: z.date(),
  inspection_status: z.string().optional(),
  inspection_time: z.string(),
  property_type: z.string(),
  site_photos: z.any().optional(),
  // Fix: Change measurement_sketch to accept MediaItem or undefined
  measurement_sketch: z.union([
    z.object({
      id: z.string(),
      url: z.string(),
      type: z.enum(["image", "video", "audio"]),
      remarks: z.string().optional(),
    }),
    z.undefined()
  ]).optional(),
  inspection_notes: z.string().optional(),
  site_dimensions: z
    .array(
      z.object({
        floor: z.string().optional(),
        room: z.string().optional(),
        entity: z.string().optional(),
        area_name: z.string(),
        dimensionsunits: z.string(),
        // Fix: Change media to accept MediaItem or undefined
        media: z.union([
          z.object({
            id: z.string(),
            url: z.string(),
            type: z.enum(["image", "video", "audio"]),
            remarks: z.string().optional(),
          }),
          z.undefined()
        ]).optional(),
      })
    )
    .optional(),
  custom_site_images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        type: z.enum(["image", "video", "audio"]),
        remarks: z.string().optional(),
      })
    )
    .optional(),
});


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

// Helper to extract file URL from various response formats
const extractFileUrl = (data: any): string => {
  if (data?.message?.file_url) return data.message.file_url;
  if (data?.file_url) return data.file_url;
  if (typeof data?.message === "string" && data.message.startsWith("/")) {
    return data.message;
  }
  return "";
};

/**
 * Captures media (image/video) from device camera
 * @param type - 'image' or 'video'
 * @returns Promise resolving to the captured File or null
 */
export const captureMediaFromCamera = async (
  type: "image" | "video"
): Promise<File | null> => {
  return new Promise((resolve) => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = type === "image" ? "image/*" : "video/*";
      
      // Use these attributes for best mobile compatibility
      input.capture = type === "image" ? "environment" : "user";
      input.setAttribute("capture", "camera");
      
      input.style.display = "none";
      document.body.appendChild(input);

      const cleanup = () => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 30000); // 30 second timeout

      input.onchange = async (event: Event) => {
        clearTimeout(timeout);
        const target = event.target as HTMLInputElement;
        if (target.files?.length) {
          const file = target.files[0];
          // Basic validation
          if (file.size > 0) {
            resolve(file);
          } else {
            toast.error("Captured file is empty");
            resolve(null);
          }
        } else {
          resolve(null);
        }
        cleanup();
      };

      input.onerror = () => {
        clearTimeout(timeout);
        toast.error("Could not access camera");
        cleanup();
        resolve(null);
      };

      input.click();
    } catch (error) {
      console.error("Camera capture error:", error);
      toast.error("Failed to access camera");
      resolve(null);
    }
  });
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
    toast.success("Recording started...");

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
    toast.success("Recording completed");
    return file;

  } catch (error) {
    console.error("Audio recording error:", error);
    toast.error(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Determines media type from file or URL
 * @param file - File object or URL string
 * @returns Media type or 'unknown'
 */
export const getMediaType = (file: File | string): "image" | "video" | "audio" | "unknown" => {
 
  if (typeof file === 'string') {
    const ext = file.split('.').pop()?.toLowerCase();
    if (!ext) return "unknown";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return "image";
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return "video";
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return "audio";
    return "unknown";
  }

  const fileMimeType = file.type;
  if (fileMimeType.startsWith("image/")) return "image";
  if (fileMimeType.startsWith("video/")) return "video";
  if (fileMimeType.startsWith("audio/")) return "audio";

  // Fallback for files without proper type
  const name = file.name.toLowerCase();
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
  if (name.match(/\.(mp4|webm|mov|avi)$/)) return "video";
  if (name.match(/\.(mp3|wav|ogg|m4a)$/)) return "audio";

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