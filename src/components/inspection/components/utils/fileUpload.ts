/* eslint-disable @typescript-eslint/no-explicit-any */


export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file || file.size === 0) {
    throw new Error("Invalid file selected");
  }

  try {
    // Simulate progress if callback provided - for real world, this would be from actual upload events
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

    // Robust handling for various response structures
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

    // Ensure URL is absolute or correctly relative
    if (!fileUrl.startsWith("http") && !fileUrl.startsWith("/")) {
      // Assuming /files/ is the correct base path for Frappe file storage
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

export const captureMediaFromCamera = async (
  type: "image" | "video"
): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.setAttribute("capture", type === "image" ? "environment" : "user"); // 'environment' for rear camera, 'user' for front

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        resolve(file);
      } else {
        resolve(null);
      }
    };

    input.onerror = (error) => {
      console.error("Camera capture input error:", error);
      reject(new Error("Failed to access camera."));
    };

    input.click();
  });
};

export const recordAudio = async (): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    let mediaRecorder: MediaRecorder | null = null;
    const audioChunks: Blob[] = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          stream.getTracks().forEach((track) => track.stop());
          resolve(audioFile);
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error("Audio recording failed."));
        };

        mediaRecorder.start();
        toast.success("Recording audio... click again to stop.");

        // For simplicity, we'll stop it after a certain time or you can add a stop button
        // In a real app, you'd have a UI button to stop recording.
        // For demonstration, let's just expose a global stop function or require user interaction.
        (window as any).stopAudioRecording = () => {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            toast.success("Audio recording stopped.");
          }
        };
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
        toast.error("Failed to access microphone. Please grant permission.");
        reject(err);
      });
  });
};

// Extend formSchema for media types
import * as z from "zod";
import { frappeAPI } from "../../../../api/frappeClient";
import toast from "react-hot-toast";
// 1. Fix the formSchema to properly handle MediaItem types

export const formSchema = z.object({
  inspection_date: z.date(),
  status: z.string().optional(),
  customer_name: z.string().optional(),
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
// Helper for file type determination
export const getMediaType = (file: File | string): "image" | "video" | "audio" | "unknown" => {
  const mimeType = typeof file === 'string' ? file.split('.').pop()?.toLowerCase() : file.type;

  if (!mimeType) return "unknown";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";

  // Fallback for string URLs without direct MIME type
  if (typeof file === 'string') {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) return "image";
    if (/\.(mp4|webm|ogg)$/i.test(file)) return "video";
    if (/\.(mp3|wav|ogg)$/i.test(file)) return "audio";
  }

  return "unknown";
};

// A type for our media items
export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video" | "audio";
  remarks?: string;
  file?: File; // Optional: keep the original file object for new uploads before they are sent to the server.
}