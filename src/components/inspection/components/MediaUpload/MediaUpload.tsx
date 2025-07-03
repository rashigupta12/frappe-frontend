/* eslint-disable @typescript-eslint/no-explicit-any */
import { Camera, Edit3, MessageSquare, Mic, Upload, X, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../../../ui/button";
import { FormLabel } from "../../../ui/form";
import { Progress } from "../../../ui/progress";
import { Textarea } from "../../../ui/textarea";
import {
  captureMediaFromCamera,
  getMediaType,
  uploadFile,
  type MediaItem
} from "../utils/fileUpload";

interface MediaUploadProps {
  label: string;
  multiple?: boolean;
  allowedTypes: ("image" | "video" | "audio")[];
  value: MediaItem[] | MediaItem | undefined;
  onChange: (newValue: MediaItem[] | MediaItem | undefined) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

// Updated Mobile-Friendly Media Preview Modal
const MediaPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem;
  onRemove: () => void;
  onEditRemark?: () => void;
}> = ({ isOpen, onClose, media, onRemove, onEditRemark }) => {
  const imageurl = "https://eits.thebigocommunity.org";
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-white text-lg font-semibold">Media Preview</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Media Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {media.type === "image" && (
          <img
            src={`${imageurl}${media.url}`}
            alt={media.remarks || "Media preview"}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
        {media.type === "video" && (
          <video
            src={`${imageurl}${media.url}`}
            controls
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
        {media.type === "audio" && (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-900/50 rounded-2xl backdrop-blur-sm">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <Mic className="h-12 w-12 text-white" />
            </div>
            <p className="text-white text-xl mb-6 text-center">
              {media.remarks || "Audio Playback"}
            </p>
            <audio
              src={`${imageurl}${media.url}`}
              controls
              className="w-full max-w-sm"
            />
          </div>
        )}
      </div>

      {/* Bottom Section - Remarks & Actions */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-4 space-y-4">
        {/* Remarks */}
        {media.remarks && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-200 mb-2">Remark</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {media.remarks}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onEditRemark && (
            <Button
              variant="outline"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              onClick={onEditRemark}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Remark
            </Button>
          )}
          <Button
            variant="destructive"
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// Remarks Dialog Component
const RemarksDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (remark: string) => void;
  initialRemark?: string;
  mediaType: string;
}> = ({ isOpen, onClose, onSave, initialRemark = "", mediaType }) => {
  const [remark, setRemark] = useState(initialRemark);

  useEffect(() => {
    setRemark(initialRemark);
  }, [initialRemark]);

  const handleSave = () => {
    onSave(remark.trim());
    onClose();
  };

  const handleSkip = () => {
    onSave("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Add Remark
          </h3>
          <p className="text-gray-600 text-sm">
            Add a description or note for your {mediaType}
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={`Add a remark for your ${mediaType}...`}
            className="w-full min-h-20 resize-none"
            maxLength={200}
          />
          
          <div className="text-xs text-gray-500 text-right">
            {remark.length}/200 characters
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save Remark
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Audio Recording Dialog Component
const AudioRecordingDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete: (audioFile: File) => void;
}> = ({ isOpen, onClose, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && !isRecording) {
      startRecording();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error("No supported audio format found");
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          toast.error("No audio data recorded");
          onClose();
          return;
        }
        
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: mimeType });
        
        const extension = mimeType.includes('wav') ? 'wav' : 
                         mimeType.includes('mp4') ? 'm4a' : 'webm';
        const fileName = `recording-${Date.now()}.${extension}`;
        
        const audioFile = new File([audioBlob], fileName, { 
          type: mimeType,
          lastModified: Date.now()
        });
        
        if (audioFile.size > 0) {
          onComplete(audioFile);
        } else {
          toast.error("Recording failed - no audio data captured");
          onClose();
        }
        
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}>
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isRecording ? 'Recording Audio...' : 'Starting Recording...'}
          </h3>
          
          <div className="text-3xl font-mono text-gray-600 mb-6">
            {formatTime(recordingTime)}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={stopRecording}
              disabled={!isRecording}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-all duration-200"
            >
              <div className="w-4 h-4 bg-white rounded-sm" />
              Stop Recording
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 py-3 rounded-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Camera Options Modal
const CameraOptionsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: () => void;
  onSelectVideo: () => void;
  allowedTypes: ("image" | "video" | "audio")[];
}> = ({ isOpen, onClose, onSelectImage, onSelectVideo, allowedTypes }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Camera Options
          </h3>
          <p className="text-gray-600 text-sm">
            Choose what you want to capture
          </p>
        </div>

        <div className="space-y-3">
          {allowedTypes.includes("image") && (
            <Button
              onClick={onSelectImage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
            >
              Take Photo
            </Button>
          )}
          {allowedTypes.includes("video") && (
            <Button
              onClick={onSelectVideo}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
            >
              Record Video
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full py-3 rounded-lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

const MediaUpload: React.FC<MediaUploadProps> = ({
  label,
  multiple = false,
  allowedTypes,
  value,
  onChange,
  maxFiles,
  maxSizeMB = 10,
}) => {
  const imageurl = "https://eits.thebigocommunity.org";
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showRecordingDialog, setShowRecordingDialog] = useState(false);
  const [showRemarksDialog, setShowRemarksDialog] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [pendingMediaItem, setPendingMediaItem] = useState<MediaItem | null>(null);
  const [editingRemark, setEditingRemark] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMediaItems = multiple
    ? (value as MediaItem[]) || []
    : value
    ? [value as MediaItem]
    : [];

  const handleRemarksComplete = (remark: string) => {
    if (pendingMediaItem) {
      const updatedMediaItem = {
        ...pendingMediaItem,
        remarks: remark || pendingMediaItem.remarks
      };

      if (multiple) {
        onChange([...currentMediaItems, updatedMediaItem]);
      } else {
        onChange(updatedMediaItem);
      }

      setPendingMediaItem(null);
      toast.success("Media uploaded successfully!");
    } else if (editingRemark) {
      const updatedItems = currentMediaItems.map(item =>
        item.id === editingRemark ? { ...item, remarks: remark } : item
      );
      
      if (multiple) {
        onChange(updatedItems);
      } else {
        onChange(updatedItems[0]);
      }
      
      setEditingRemark(null);
      toast.success("Remark updated successfully!");
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files);

    if (!multiple && filesToUpload.length > 1) {
      toast.error(`Only one ${label.toLowerCase()} file is allowed.`);
      return;
    }

    if (multiple && maxFiles && currentMediaItems.length + filesToUpload.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of filesToUpload) {
      const type = getMediaType(file);
      if (type === "unknown" || !allowedTypes.includes(type)) {
        toast.error(`File "${file.name}" has an unsupported format. Allowed: ${allowedTypes.join(", ")}`);
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

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileProgressStart = (i / validFiles.length) * 100;

        try {
          const fileUrl = await uploadFile(file, (progress: number) => {
            setUploadProgress(fileProgressStart + progress / validFiles.length);
          });
          
          const mediaItem: MediaItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: fileUrl,
            type: (() => {
              const t = getMediaType(file);
              if (t === "unknown") throw new Error(`Invalid media type for file: ${file.name}`);
              return t;
            })(),
            remarks: file.name,
          };

          setPendingMediaItem(mediaItem);
          setShowRemarksDialog(true);
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      console.error("Batch upload error:", error);
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCapture = async (type: "image" | "video") => {
    setShowCameraOptions(false);
    try {
      setIsUploading(true);
      const file = await captureMediaFromCamera(type);
      if (file) {
        const fileUrl = await uploadFile(file, setUploadProgress);
        const mediaItem: MediaItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: fileUrl,
          type: (() => {
            const t = getMediaType(file);
            if (t === "unknown") throw new Error(`Invalid media type for file: ${file.name}`);
            return t;
          })(),
          remarks: `Captured ${type}`,
        };

        setPendingMediaItem(mediaItem);
        setShowRemarksDialog(true);
      }
    } catch (error) {
      console.error("Camera capture or upload error:", error);
      toast.error(`Failed to capture ${type}.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAudioRecordingComplete = async (audioFile: File) => {
    setShowRecordingDialog(false);
    setIsUploading(true);
    
    try {
      if (!audioFile || audioFile.size === 0) {
        throw new Error("Invalid audio file generated");
      }
      
      if (audioFile.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`Audio file exceeds ${maxSizeMB}MB limit`);
      }
      
      const fileUrl = await uploadFile(audioFile, setUploadProgress);
      const mediaItem: MediaItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: fileUrl,
        type: "audio",
        remarks: "Recorded Audio",
      };
      
      setPendingMediaItem(mediaItem);
      setShowRemarksDialog(true);
      
    } catch (error) {
      console.error("Audio upload error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to upload audio recording: ${errorMsg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditRemark = (mediaId: string) => {
    setEditingRemark(mediaId);
    setShowRemarksDialog(true);
  };

  const handleRemoveMedia = (idToRemove: string) => {
    if (multiple) {
      const updatedItems = currentMediaItems.filter((item) => item.id !== idToRemove);
      onChange(updatedItems);
    } else {
      onChange(undefined);
    }
    setModalOpen(false);
    setSelectedMedia(null);
    toast.success("Media file removed.");
  };

  const handleClearAll = () => {
    if (currentMediaItems.length === 0) {
      toast.error("No media files to clear.");
      return;
    }
    if (!window.confirm("Are you sure you want to clear all media files? This action cannot be undone.")) {
      return;
    }
    if (multiple) {
      onChange([]);
      toast.success("All media files cleared.");
    }
  };

  const openMediaModal = (media: MediaItem) => {
    setSelectedMedia(media);
    setModalOpen(true);
  };

  const getCurrentEditingRemark = () => {
    if (editingRemark) {
      const item = currentMediaItems.find(item => item.id === editingRemark);
      return item?.remarks || "";
    }
    return "";
  };

  const getCurrentEditingMediaType = () => {
    if (editingRemark) {
      const item = currentMediaItems.find(item => item.id === editingRemark);
      return item?.type || "media";
    }
    return pendingMediaItem?.type || "media";
  };

  // Create comprehensive accept string for file input
  const getFileAcceptString = () => {
    const accepts: string[] = [];
    if (allowedTypes.includes("image")) {
      accepts.push("image/*");
    }
    if (allowedTypes.includes("video")) {
      accepts.push("video/*");
    }
    if (allowedTypes.includes("audio")) {
      accepts.push("audio/*");
    }
    return accepts.join(",");
  };

  return (
    <div className="space-y-4">
      <FormLabel className="text-gray-700 text-sm font-medium block">
        {label}
      </FormLabel>
      
      {/* Mobile-First Upload Controls - Only 4 Icons */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-4 gap-4">
          {/* 1. Universal Upload Button */}
          <div className="flex flex-col items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || (!multiple && currentMediaItems.length > 0)}
              className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center"
            >
              <Upload className="h-6 w-6 text-gray-600" />
            </Button>
            <span className="text-xs text-gray-500 mt-2 text-center">Upload</span>
          </div>
          
          {/* 2. Camera Options (Image/Video) */}
          {(allowedTypes.includes("image") || allowedTypes.includes("video")) && (
            <div className="flex flex-col items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCameraOptions(true)}
                disabled={isUploading || (!multiple && currentMediaItems.length > 0)}
                className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-gray-600" />
              </Button>
              <span className="text-xs text-gray-500 mt-2 text-center">Camera</span>
            </div>
          )}
          
          {/* 3. Audio Recording */}
          {allowedTypes.includes("audio") && (
            <div className="flex flex-col items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecordingDialog(true)}
                disabled={isUploading || (!multiple && currentMediaItems.length > 0)}
                className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all duration-200 flex items-center justify-center"
              >
                <Mic className="h-6 w-6 text-gray-600" />
              </Button>
              <span className="text-xs text-gray-500 mt-2 text-center">Record</span>
            </div>
          )}
          
          {/* 4. Clear All */}
          {multiple && (
            <div className="flex flex-col items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearAll}
                disabled={currentMediaItems.length === 0}
                className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all duration-200 flex items-center justify-center"
              >
                <X className="h-6 w-6 text-gray-600" />
              </Button>
              <span className="text-xs text-gray-500 mt-2 text-center">Clear</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full h-2" />
        </div>
      )}

      {/* Media Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {currentMediaItems.map((media) => (
          <div
            key={media.id}
            className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
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
              <div className="relative w-full h-full">
                <video
                  src={`${imageurl}${media.url}`}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                  </div>
                </div>
              </div>
            )}
            {media.type === "audio" && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                <Mic className="h-8 w-8 mb-2 text-blue-500" />
                <span className="text-xs text-center font-medium text-gray-700">Audio</span>
              </div>
            )}
            
            {/* Media overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white text-gray-800 h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRemark(media.id);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMedia(media.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Media info badge */}
            {media.remarks && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
                  <p className="text-white text-xs truncate">
                    {media.remarks}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* File Count Display */}
      {multiple && currentMediaItems.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {currentMediaItems.length} file{currentMediaItems.length !== 1 ? 's' : ''} uploaded
          {maxFiles && ` (${maxFiles - currentMediaItems.length} remaining)`}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getFileAcceptString()}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Modals */}
      {selectedMedia && (
        <MediaPreviewModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedMedia(null);
          }}
          media={selectedMedia}
          onRemove={() => handleRemoveMedia(selectedMedia.id)}
          onEditRemark={() => handleEditRemark(selectedMedia.id)}
        />
      )}

      <RemarksDialog
        isOpen={showRemarksDialog}
        onClose={() => {
          setShowRemarksDialog(false);
          setPendingMediaItem(null);
          setEditingRemark(null);
        }}
        onSave={handleRemarksComplete}
        initialRemark={getCurrentEditingRemark()}
        mediaType={getCurrentEditingMediaType()}
      />

      <AudioRecordingDialog
        isOpen={showRecordingDialog}
        onClose={() => setShowRecordingDialog(false)}
        onComplete={handleAudioRecordingComplete}
      />

      <CameraOptionsModal
        isOpen={showCameraOptions}
        onClose={() => setShowCameraOptions(false)}
        onSelectImage={() => handleCapture("image")}
        onSelectVideo={() => handleCapture("video")}
        allowedTypes={allowedTypes}
      />
    </div>
  );
};

export default MediaUpload;