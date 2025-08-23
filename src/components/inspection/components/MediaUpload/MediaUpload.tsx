import {
  Camera,
  Mic,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
// import { showToast } from "react-hot-showToast";
import { Button } from "../../../ui/button";
import { Progress } from "../../../ui/progress";
import { getMediaType, uploadFile, type MediaItem } from "../utils/fileUpload";
import { showToast } from "../../../../helpers/comman";


interface MediaUploadProps {
  label: string;
  multiple?: boolean;
  allowedTypes: ("image" | "video" | "audio")[];
  value: MediaItem[] | MediaItem | undefined;
  onChange: (newValue: MediaItem[] | MediaItem | undefined) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  inspectionStatus?: string;
  isReadOnly?: boolean;
}

const MediaPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem;
  onRemove: () => void;
  inspectionStatus?: string;
  isReadOnly?: boolean;
}> = ({ isOpen, onClose, media, onRemove, isReadOnly }) => {
  const imageurl = import.meta.env.VITE_API_BASE_URL ;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
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

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {media.type === "image" && (
          <img
            src={`${imageurl}${media.url}`}
            alt="Media preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ touchAction: "manipulation" }}
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
              Audio Playback
            </p>
            <audio
              src={`${imageurl}${media.url}`}
              controls
              className="w-full max-w-sm"
            />
          </div>
        )}
      </div>

      <div className="bg-gray-900/90 backdrop-blur-sm p-4 sticky bottom-0 z-10">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="destructive"
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={onRemove}
            disabled={isReadOnly}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  inspectionStatus?: string;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Remove Media File",
  message = "Are you sure you want to remove this media file? This action cannot be undone.",
  inspectionStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1" type="button">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={inspectionStatus === "Completed"}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

const AudioRecordingDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete: (audioFile: File) => void;
}> = ({ isOpen, onClose, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/wav",
      ];

      let selectedMimeType = "";
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
        mimeType: selectedMimeType,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          showToast.error("No audio data recorded");
          return;
        }

        const audioBlob = new Blob(chunks, { type: selectedMimeType });
        const extension = selectedMimeType.includes("wav")
          ? "wav"
          : selectedMimeType.includes("mp4")
          ? "m4a"
          : "webm";
        const fileName = `recording-${Date.now()}.${extension}`;

        const audioFile = new File([audioBlob], fileName, {
          type: selectedMimeType,
          lastModified: Date.now(),
        });

        if (audioFile.size > 0) {
          onComplete(audioFile);
        } else {
          showToast.error("Recording failed - no audio data captured");
        }

        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      showToast.error("Could not access microphone. Please check permissions.");
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  useEffect(() => {
    if (isOpen && !isRecording) {
      startRecording();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
              }`}
            >
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isRecording ? "Recording Audio..." : "Starting Recording..."}
          </h3>

          <div className="text-3xl font-mono text-gray-600 mb-6">
            {formatTime(recordingTime)}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              type="button"
              onClick={stopRecording}
              disabled={!isRecording}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-all duration-200"
            >
              <div className="w-4 h-4 bg-white rounded-sm" />
              Stop Recording
            </Button>

            <Button
              type="button"
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
              type="button"
              onClick={onSelectImage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
            >
              Take Photo
            </Button>
          )}
          {allowedTypes.includes("video") && (
            <Button
              type="button"
              onClick={onSelectVideo}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
            >
              Record Video
            </Button>
          )}
          <Button
            type="button"
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

// Video Recording Dialog Component
const VideoRecordingDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete: (videoFile: File) => void;
}> = ({ isOpen, onClose, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      const options = { mimeType: 'video/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (videoChunksRef.current.length === 0) {
          showToast.error("No video data recorded");
          return;
        }

        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setRecordedVideo(videoUrl);
        setIsRecording(false);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Video recording error:", error);
      showToast.error("Could not start video recording");
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const retakeVideo = async () => {
    // Clean up previous recording
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
      setRecordedVideo(null);
    }
    setRecordingTime(0);
    
    // Restart camera and recording
    await startRecording();
  };

  const useVideo = async () => {
    if (!recordedVideo) return;

    setIsUploading(true);
    try {
      const response = await fetch(recordedVideo);
      const blob = await response.blob();
      const file = new File([blob], `recording-${Date.now()}.webm`, {
        type: 'video/webm',
        lastModified: Date.now(),
      });

      onComplete(file);
    } catch (error) {
      console.error("Video processing error:", error);
    } finally {
      setIsUploading(false);
      cleanup();
      onClose();
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
      setRecordedVideo(null);
    }
    setIsRecording(false);
    setRecordingTime(0);
    videoChunksRef.current = [];
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  useEffect(() => {
    if (isOpen && !isRecording && !recordedVideo) {
      startRecording();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Preview */}
      <div className="flex-1 relative">
        {recordedVideo ? (
          <video
            src={recordedVideo}
            controls
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          {recordedVideo ? (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={retakeVideo}
                disabled={isUploading}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={useVideo}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  "Use Video"
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              disabled={!isRecording}
              className="w-16 h-16 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center disabled:opacity-50"
            >
              <div className="w-5 h-5 bg-white rounded-sm"></div>
            </button>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        disabled={isUploading}
        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white disabled:opacity-50"
      >
        <X className="h-6 w-6" />
      </button>
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
  inspectionStatus,
  isReadOnly,
}) => {
  const imageurl = import.meta.env.VITE_API_BASE_URL ;
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showRecordingDialog, setShowRecordingDialog] = useState(false);
  const [showVideoRecordingDialog, setShowVideoRecordingDialog] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [currentMediaItems, setCurrentMediaItems] = useState<MediaItem[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with external value changes
  useEffect(() => {
    if (value) {
      setCurrentMediaItems(Array.isArray(value) ? [...value] : [value]);
    } else {
      setCurrentMediaItems([]);
    }
  }, [value]);

  const handleDeleteClick = (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setMediaToDelete(mediaId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (mediaToDelete) {
      const updatedItems = currentMediaItems.filter(
        (item) => item.id !== mediaToDelete
      );

      setCurrentMediaItems(updatedItems);

      if (multiple) {
        onChange(updatedItems.length > 0 ? updatedItems : undefined);
      } else {
        onChange(undefined);
      }
    }

    setShowDeleteConfirm(false);
    setMediaToDelete(null);
    setModalOpen(false);
    setSelectedMedia(null);
  };

  const handleCancelDelete = () => {
    if (value) {
      setCurrentMediaItems(Array.isArray(value) ? [...value] : [value]);
    }
    setShowDeleteConfirm(false);
    setMediaToDelete(null);
  };

  const handleRemoveFromModal = () => {
    if (selectedMedia) {
      const tempItems = currentMediaItems.filter(
        (item) => item.id !== selectedMedia.id
      );
      setCurrentMediaItems(tempItems);

      setMediaToDelete(selectedMedia.id);
      setShowDeleteConfirm(true);
    }
  };

  const startCamera = async () => {
    try {
      setShowCameraOptions(false);
      setShowCameraPreview(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      showToast.error("Could not access camera. Please check permissions.");
      setShowCameraPreview(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageDataUrl);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const retakeImage = async () => {
    setCapturedImage(null);
    // Restart camera
    await startCamera();
  };

  const uploadCapturedImage = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const file = new File([blob], `captured-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const fileUrl = await uploadFile(file, setUploadProgress);

      const mediaItem: MediaItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: fileUrl,
        type: "image",
      };

      const updatedItems = [...currentMediaItems, mediaItem];
      setCurrentMediaItems(updatedItems);

      if (multiple) {
        onChange(updatedItems);
      } else {
        onChange(mediaItem);
      }

      showToast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      showToast.error("Failed to upload captured image");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCapturedImage(null);
      setShowCameraPreview(false);
    }
  };

  const cancelCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCapturedImage(null);
    setShowCameraPreview(false);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files);

    if (!multiple && filesToUpload.length > 1) {
      showToast.error(`Only one ${label.toLowerCase()} file is allowed.`);
      return;
    }

    if (
      multiple &&
      maxFiles &&
      currentMediaItems.length + filesToUpload.length > maxFiles
    ) {
      showToast.error(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of filesToUpload) {
      const type = getMediaType(file);
      if (type === "unknown" || !allowedTypes.includes(type)) {
        showToast.error(
          `File "${
            file.name
          }" has an unsupported format. Allowed: ${allowedTypes.join(", ")}`
        );
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        showToast.error(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedItems: MediaItem[] = [];
      
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
            type: getMediaType(file) as "image" | "video" | "audio",
          };

          uploadedItems.push(mediaItem);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          // const errorMsg =
          //   error instanceof Error ? error.message : "Upload failed";
          showToast.error(`Failed to upload ${file.name}`);
        }
      }

      if (uploadedItems.length > 0) {
        const updatedItems = [...currentMediaItems, ...uploadedItems];
        setCurrentMediaItems(updatedItems);
        
        if (multiple) {
          onChange(updatedItems);
        } else {
          onChange(updatedItems[0]);
        }

        showToast.success(`${uploadedItems.length} files uploaded successfully!`);
      }
    } catch (error) {
      console.error("Batch upload error:", error);
      showToast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      };

      const updatedItems = [...currentMediaItems, mediaItem];
      setCurrentMediaItems(updatedItems);

      if (multiple) {
        onChange(updatedItems);
      } else {
        onChange(mediaItem);
      }

      showToast.success("Audio recording uploaded successfully!");
    } catch (error) {
      console.error("Audio upload error:", error);
      // const errorMsg = error instanceof Error ? error.message : String(error);
      showToast.error(`Failed to upload audio recording`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoRecordingComplete = async (videoFile: File) => {
    setShowVideoRecordingDialog(false);
    setIsUploading(true);

    try {
      if (!videoFile || videoFile.size === 0) {
        throw new Error("Invalid video file generated");
      }

      if (videoFile.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`Video file exceeds ${maxSizeMB}MB limit`);
      }

      const fileUrl = await uploadFile(videoFile, setUploadProgress);
      const mediaItem: MediaItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: fileUrl,
        type: "video",
      };

      const updatedItems = [...currentMediaItems, mediaItem];
      setCurrentMediaItems(updatedItems);

      if (multiple) {
        onChange(updatedItems);
      } else {
        onChange(mediaItem);
      }

      showToast.success("Video recording uploaded successfully!");
    } catch (error) {
      console.error("Video upload error:", error);
      showToast.error(`Failed to upload video recording`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearAll = () => {
    if (inspectionStatus === "Completed") {
      showToast.error("Cannot clear media for a completed inspection.");
      return;
    }

    if (currentMediaItems.length === 0) {
      showToast.error("No media files to clear.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to clear all media files? This action cannot be undone."
      )
    ) {
      return;
    }

    setCurrentMediaItems([]);
    if (multiple) {
      onChange([]);
      showToast.success("All media files cleared.");
    }
  };

  const openMediaModal = (media: MediaItem) => {
    setSelectedMedia(media);
    setModalOpen(true);
  };

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
      <div className="grid grid-cols-4 gap-4">
        {!(isUploading || (!multiple && currentMediaItems.length > 0)) && (
          <div className="flex flex-col items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center"
            >
              <Upload className="h-6 w-6 text-gray-600" />
            </Button>
            <span className="text-xs text-gray-500 mt-2 text-center">
              Upload
            </span>
          </div>
        )}

        {(allowedTypes.includes("image") || allowedTypes.includes("video")) &&
          !(isUploading || (!multiple && currentMediaItems.length > 0)) && (
            <div className="flex flex-col items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCameraOptions(true)}
                className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-gray-600" />
              </Button>
              <span className="text-xs text-gray-500 mt-2 text-center">
                Camera
              </span>
            </div>
          )}

        {allowedTypes.includes("audio") &&
          !(isUploading || (!multiple && currentMediaItems.length > 0)) && (
            <div className="flex flex-col items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecordingDialog(true)}
                className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all duration-200 flex items-center justify-center"
              >
                <Mic className="h-6 w-6 text-gray-600" />
              </Button>
              <span className="text-xs text-gray-500 mt-2 text-center">
                Record
              </span>
            </div>
          )}

        {multiple && currentMediaItems.length > 0 && !isUploading && (
          <div className="flex flex-col items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAll}
              disabled={isReadOnly || inspectionStatus === "Completed"}
              className={`h-14 w-14 rounded-2xl border-2 border-dashed ${
                isReadOnly || inspectionStatus === "Completed"
                  ? "border-gray-300 cursor-not-allowed"
                  : "border-red-300 hover:border-red-500 hover:bg-red-50"
              } transition-all duration-200 flex items-center justify-center`}
            >
              <Trash2 className="h-6 w-6 text-red-600" />
            </Button>
            <span className="text-xs text-gray-500 mt-2 text-center">
              Clear All
            </span>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="text-blue-600">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={getFileAcceptString()}
        onChange={handleFileChange}
        className="hidden"
        multiple={multiple}
      />

      {/* Media Items Display */}
      {currentMediaItems.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentMediaItems.map((media) => (
              <div
                key={media.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-all duration-200"
              >
                <div
                  className="w-full h-full"
                  onClick={() => openMediaModal(media)}
                >
                  {media.type === "image" && (
                    <img
                      src={`${imageurl}${media.url}`}
                      alt="Media"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {media.type === "video" && (
                    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                      <video
                        src={`${imageurl}${media.url}`}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-y-[6px] border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {media.type === "audio" && (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Mic className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => handleDeleteClick(e, media.id)}
                  disabled={isReadOnly || inspectionStatus === "Completed"}
                  className={`absolute top-2 right-2 p-1 rounded-full text-white shadow-md transition-all duration-200 z-10 ${
                    isReadOnly || inspectionStatus === "Completed"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentMediaItems.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {currentMediaItems.length}{" "}
          {currentMediaItems.length === 1 ? "file" : "files"} selected
          {maxFiles && ` (${maxFiles} max)`}
        </div>
      )}

      {/* Camera Preview Modal */}
      {showCameraPreview && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            {capturedImage ? (
              <div className="absolute inset-0 flex flex-col">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="flex-1 object-contain"
                />
                <div className="flex justify-between p-4 bg-black/50">
                  <button
                    onClick={retakeImage}
                    disabled={isUploading}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Retake
                  </button>
                  <button
                    onClick={uploadCapturedImage}
                    disabled={isUploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      "Use Photo"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <button
                    onClick={captureImage}
                    className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg"
                  >
                    <div className="w-full h-full bg-white rounded-full"></div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={cancelCamera}
            disabled={isUploading}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        inspectionStatus={inspectionStatus}
      />

      {selectedMedia && (
        <MediaPreviewModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedMedia(null);
          }}
          media={selectedMedia}
          onRemove={handleRemoveFromModal}
          isReadOnly={isReadOnly}
          inspectionStatus={inspectionStatus}
        />
      )}

      <AudioRecordingDialog
        isOpen={showRecordingDialog}
        onClose={() => setShowRecordingDialog(false)}
        onComplete={handleAudioRecordingComplete}
      />

      <VideoRecordingDialog
        isOpen={showVideoRecordingDialog}
        onClose={() => setShowVideoRecordingDialog(false)}
        onComplete={handleVideoRecordingComplete}
      />

      <CameraOptionsModal
        isOpen={showCameraOptions}
        onClose={() => setShowCameraOptions(false)}
        onSelectImage={startCamera}
        onSelectVideo={() => {
          setShowCameraOptions(false);
          setShowVideoRecordingDialog(true);
        }}
        allowedTypes={allowedTypes}
      />
    </div>
  );
};

export default MediaUpload;