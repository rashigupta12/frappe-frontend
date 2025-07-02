/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { Button } from "../../../ui/button";
import { Upload, Camera, Mic, X, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Progress } from "../../../ui/progress";
import {
  uploadFile,
  captureMediaFromCamera,
  recordAudio,
  getMediaType,
  type MediaItem,
} from "../utils/fileUpload"; // Adjust path as needed
import MediaPreviewModal from "./MediaPreviewModal";
import { FormLabel } from "../../../ui/form";

interface MediaUploadProps {
  label: string;
  multiple?: boolean; // True for Custom Images, False for Site Dimensions/Measurement Sketch
  allowedTypes: ("image" | "video" | "audio")[];
  value: MediaItem[] | MediaItem | undefined; // Array for multiple, single object for single
  onChange: (newValue: MediaItem[] | MediaItem | undefined) => void;
  maxFiles?: number; // Maximum number of files for multiple uploads
  maxSizeMB?: number; // Max size per file in MB
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  label,
  multiple = false,
  allowedTypes,
  value,
  onChange,
  maxFiles,
  maxSizeMB = 10, // Default to 10MB
}) => {
  const imageurl = "https://eits.thebigocommunity.org";
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMediaItems = multiple
    ? (value as MediaItem[]) || []
    : value
    ? [value as MediaItem]
    : [];

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files);

    if (!multiple && filesToUpload.length > 1) {
      toast.error(`Only one ${label.toLowerCase()} file is allowed.`);
      return;
    }

    if (
      multiple &&
      maxFiles &&
      currentMediaItems.length + filesToUpload.length > maxFiles
    ) {
      toast.error(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of filesToUpload) {
      const type = getMediaType(file);
      if (type === "unknown" || !allowedTypes.includes(type)) {
        toast.error(
          `File "${
            file.name
          }" has an unsupported format. Allowed: ${allowedTypes.join(", ")}`
        );
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    const toastId = toast.loading(`Uploading ${validFiles.length} file(s)...`);

    try {
      const newMediaItems: MediaItem[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileProgressStart = (i / validFiles.length) * 100;

        try {
          const fileUrl = await uploadFile(file, (progress: number) => {
            setUploadProgress(fileProgressStart + progress / validFiles.length);
          });
          newMediaItems.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: fileUrl,
            type: (() => {
              const t = getMediaType(file);
              if (t === "unknown")
                throw new Error(`Invalid media type for file: ${file.name}`);
              return t;
            })(),
            remarks: file.name, // Or a default remark
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (newMediaItems.length > 0) {
        if (multiple) {
          onChange([...currentMediaItems, ...newMediaItems]);
        } else {
          onChange(newMediaItems[0]); // Only take the first one for single upload
        }
        toast.success(
          `${newMediaItems.length} file(s) uploaded successfully!`,
          { id: toastId }
        );
      } else {
        toast.error("No files were uploaded successfully.", { id: toastId });
      }
    } catch (error) {
      console.error("Batch upload error:", error);
      toast.error("An error occurred during upload.", { id: toastId });
    } finally {
      setIsUploading(false);
      setUploadProgress(0); // Reset progress after a short delay or immediately
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the input so same file can be re-selected
      }
    }
  };

  const handleCapture = async (type: "image" | "video") => {
    try {
      setIsUploading(true);
      const file = await captureMediaFromCamera(type);
      if (file) {
        const fileUrl = await uploadFile(file, setUploadProgress);
        const newMediaItem: MediaItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: fileUrl,
          type: (() => {
            const t = getMediaType(file);
            if (t === "unknown")
              throw new Error(`Invalid media type for file: ${file.name}`);
            return t;
          })(),
          remarks: `Captured ${type}`,
        };
        if (multiple) {
          onChange([...currentMediaItems, newMediaItem]);
        } else {
          onChange(newMediaItem);
        }
        toast.success(`${type} captured and uploaded successfully!`);
      }
    } catch (error) {
      console.error("Camera capture or upload error:", error);
      toast.error(`Failed to capture ${type}.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRecordAudio = async () => {
    try {
      setIsUploading(true);
      toast(
        "Recording audio... Click 'Stop Recording' button below to finish."
      );
      const audioFile = await recordAudio(); // This now resolves when stopped manually
      if (audioFile) {
        const fileUrl = await uploadFile(audioFile, setUploadProgress);
        const newMediaItem: MediaItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: fileUrl,
          type: "audio",
          remarks: "Recorded Audio",
        };
        if (multiple) {
          onChange([...currentMediaItems, newMediaItem]);
        } else {
          onChange(newMediaItem);
        }
        toast.success("Audio recorded and uploaded successfully!");
      }
    } catch (error) {
      console.error("Audio recording or upload error:", error);
      toast.error("Failed to record audio.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Ensure the global stop function is cleaned up or properly managed
      delete (window as any).stopAudioRecording;
    }
  };

  const handleRemoveMedia = (idToRemove: string) => {
    if (multiple) {
      const updatedItems = currentMediaItems.filter(
        (item) => item.id !== idToRemove
      );
      onChange(updatedItems);
    } else {
      onChange(undefined); // Clear the single media item
    }
    setModalOpen(false); // Close modal after removal
    setSelectedMedia(null);
    toast.success("Media file removed.");
  };

  const handleClearAll = () => {
    if (multiple) {
      onChange([]);
      toast.success("All media files cleared.");
    }
  };

  const openMediaModal = (media: MediaItem) => {
    setSelectedMedia(media);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <FormLabel className="text-gray-700 text-sm font-medium">
        {label}
      </FormLabel>
      <div className="flex flex-wrap items-center gap-2">
        {allowedTypes.includes("image") && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={
              isUploading || (!multiple && currentMediaItems.length > 0)
            }
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Image
          </Button>
        )}
        {allowedTypes.includes("video") && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              fileInputRef.current?.setAttribute("accept", "video/*");
              fileInputRef.current?.click();
            }}
            disabled={
              isUploading || (!multiple && currentMediaItems.length > 0)
            }
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Video
          </Button>
        )}
        {allowedTypes.includes("audio") && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              fileInputRef.current?.setAttribute("accept", "audio/*");
              fileInputRef.current?.click();
            }}
            disabled={
              isUploading || (!multiple && currentMediaItems.length > 0)
            }
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Audio
          </Button>
        )}
        {allowedTypes.includes("image") && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCapture("image")}
            disabled={
              isUploading || (!multiple && currentMediaItems.length > 0)
            }
          >
            <Camera className="mr-2 h-4 w-4" /> Capture Image
          </Button>
        )}
        {allowedTypes.includes("video") && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCapture("video")}
            disabled={
              isUploading || (!multiple && currentMediaItems.length > 0)
            }
          >
            <Camera className="mr-2 h-4 w-4" /> Capture Video
          </Button>
        )}
        {allowedTypes.includes("audio") && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRecordAudio}
            disabled={
              isUploading || (!multiple && currentMediaItems.length > 0)
            }
          >
            <Mic className="mr-2 h-4 w-4" /> Record Audio
          </Button>
        )}

        {multiple && currentMediaItems.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearAll}
            className="text-red-500"
          >
            <X className="mr-2 h-4 w-4" /> Clear All
          </Button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          className="hidden"
          // We set accept dynamically based on the button clicked, but can set a default
          accept={allowedTypes.map((type) => `${type}/*`).join(",")}
        />
      </div>

      {isUploading && (
        <Progress value={uploadProgress} className="w-full mt-2" />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
        {currentMediaItems.map((media) => (
          <div
            key={media.id}
            className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden shadow-sm cursor-pointer"
            onClick={() => openMediaModal(media)}
          >
            {media.type === "image" && (
              <img
                src={`${imageurl}${media.url}`}
                alt={media.remarks || "Uploaded image"}
                className="w-full h-full object-cover"
              />
            )}
            {media.type === "video" && (
              <video
                src={`${imageurl}/${media.url}`}
                controls={false} // Don't show controls on thumbnail
                className="w-full h-full object-cover"
                preload="metadata"
              />
            )}
            {media.type === "audio" && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Mic className="h-8 w-8" />
                <span className="ml-2 text-sm truncate">
                  {media.remarks || "Audio File"}
                </span>
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
              onClick={(e: { stopPropagation: () => void }) => {
                e.stopPropagation(); // Prevent opening modal
                handleRemoveMedia(media.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {!multiple && currentMediaItems.length === 0 && (
          <div className="flex items-center justify-center w-full aspect-video bg-gray-50 border border-dashed border-gray-300 rounded-md text-gray-400">
            <Plus className="h-6 w-6" />
          </div>
        )}
      </div>

      {selectedMedia && (
        <MediaPreviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          media={selectedMedia}
          onRemove={() => handleRemoveMedia(selectedMedia.id)}
        />
      )}
    </div>
  );
};

export default MediaUpload;
