import {
  Camera,
  Trash2,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { showToast } from "../../../helpers/comman";
// import { showToast } from "react-hot-showToast";

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  remarks?: string;
  type: "image" | "pdf" | "doc";
}

interface PaymentImageUploadProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  onUpload?: (file: File) => Promise<string>; // Returns uploaded URL
  maxImages?: number;
  maxSizeMB?: number;
}

const ImagePreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  images: ImageItem[];
  currentIndex: number;
  onDelete: (index: number) => void;
  onIndexChange: (index: number) => void;
}> = ({ isOpen, onClose, images, currentIndex, onDelete, onIndexChange }) => {
  const imageurl = import.meta.env.VITE_API_BASE_URL ;

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      onDelete(currentIndex);
      if (currentIndex >= images.length - 1 && images.length > 1) {
        onIndexChange(currentIndex - 1);
      } else if (images.length === 1) {
        onClose();
      }
    }
  };

const getImageUrl = (image: ImageItem) => {
  try {
    // If it's already a complete URL (http/https) or blob URL, return as is
    if (image.url.startsWith("http") || image.url.startsWith("blob:")) {
      // Add timestamp to prevent caching issues for blob URLs
      if (image.url.startsWith("blob:")) {
        return `${image.url}`;
      }
      return image.url;
    }
    // If it starts with /, prepend base URL
    if (image.url.startsWith("/")) {
      return `${imageurl}${image.url}`;
    }
    // Otherwise, assume it's a relative path and add both base URL and /
    return `${imageurl}/${image.url}`;
  } catch (error) {
    console.error("Error processing image URL:", error);
    return image.url; // Return original URL as fallback
  }
};

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-20 w-20 text-red-500" />;
      case "doc":
        return <FileText className="h-20 w-20 text-blue-500" />;
      default:
        return <ImageIcon className="h-20 w-20 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div className="text-white">
          <h2 className="text-lg font-semibold">File Preview</h2>
          <p className="text-sm text-gray-300">
            {currentIndex + 1} of {images.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* File Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {currentImage.type === "image" ? (
          <img
            src={getImageUrl(currentImage)}
            alt={currentImage.remarks || "Payment evidence"}
            className="max-w-full max-h-full object-contain rounded-lg"
            key={`modal-${currentImage.id}`} // Add unique key to force re-render
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            {getFileIcon(currentImage.type)}
            <p className="mt-4 text-white text-lg">
              {currentImage.remarks || currentImage.url.split("/").pop()}
            </p>
            <a
              href={getImageUrl(currentImage)}
              download
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              target="_blank"
            >
              <Download className="h-4 w-4" />
              Download File
            </a>
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="bg-black/50 backdrop-blur-sm p-4">
          <div className="flex gap-2 justify-center overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={`thumb-${image.id}`} // Add unique key for thumbnails
                type="button"
                onClick={() => onIndexChange(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentIndex
                    ? "border-blue-500"
                    : "border-transparent"
                } ${
                  image.type !== "image"
                    ? "bg-gray-800 flex items-center justify-center"
                    : ""
                }`}
              >
                {image.type === "image" ? (
                  <img
                    src={getImageUrl(image)}
                    alt=""
                    className="w-full h-full object-cover"
                    key={`thumb-img-${image.id}`}
                    onError={(e) => {
                      console.error("Image load error:", e);
                      // You could set a fallback image here if needed
                    }}
                  />
                ) : (
                  <FileText className="h-8 w-8 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-black/50 backdrop-blur-sm p-4">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete File
          </button>
        </div>
      </div>
    </div>
  );
};

const CameraModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
}> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const startCamera = React.useCallback(async () => {
    try {
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
      onClose();
    }
  }, [onClose]);

 useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage, isOpen, startCamera]);



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

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 relative">
        {!capturedImage ? (
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
                type="button"
                onClick={captureImage}
                className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg hover:scale-105 transition-transform"
              >
                <div className="w-full h-full bg-white rounded-full"></div>
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col">
            <img
              src={capturedImage}
              alt="Captured"
              className="flex-1 object-contain"
            />
            <div className="flex justify-between p-4 bg-black/50">
              <button
                type="button"
                onClick={handleRetake}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleUsePhoto}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Use Photo
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const PaymentImageUpload: React.FC<PaymentImageUploadProps> = ({
  images,
  onImagesChange,
  onUpload,
  maxImages = 5,
  maxSizeMB = 10,
}) => {
  const imageurl = import.meta.env.VITE_API_BASE_URL ;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  console.log(images)

  // Counter for generating truly unique IDs
  const [idCounter, setIdCounter] = useState(0);

  const getFileType = (file: File): "image" | "pdf" | "doc" => {
  console.log(`Determining file type for: ${file.name}, MIME type: ${file.type}`);
  
  if (file.type.includes("pdf")) return "pdf";
  if (file.type.includes("msword") || file.type.includes("wordprocessingml"))
    return "doc";
  
  // More comprehensive image type checking
  if (file.type.startsWith("image/")) return "image";
  
  // Fallback: check file extension
  const extension = file.name.toLowerCase().split('.').pop();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(extension || '')) {
    return "image";
  }
  
  return "image"; // Default to image if unsure
};

  // Improved unique ID generation with more entropy
  const generateUniqueId = (prefix: string, fileName?: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = idCounter;
    setIdCounter((prev) => prev + 1);
    const fileHash = fileName
      ? fileName.replace(/[^a-zA-Z0-9]/g, "").substr(0, 8)
      : "";
    // Add performance.now() for even more uniqueness
    const performanceTimestamp = Math.floor(performance.now() * 1000);
    return `${prefix}-${timestamp}-${performanceTimestamp}-${counter}-${random}-${fileHash}`;
  };

  // Enhanced getImageUrl function with better cache busting
  const getImageUrl = (image: ImageItem) => {
    // If it's already a complete URL (http/https) or blob URL, return as is
    if (image.url.startsWith("http") || image.url.startsWith("blob:")) {
      // Add timestamp to prevent caching issues for blob URLs
      if (image.url.startsWith("blob:")) {
        return `${image.url}`;
      }
      return image.url;
    }
    // If it starts with /, prepend base URL
    if (image.url.startsWith("/")) {
      return `${imageurl}${image.url}`;
    }
    // Otherwise, assume it's a relative path and add both base URL and /
    return `${imageurl}/${image.url}`;
  };

const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const filesToUpload = Array.from(files);

  if (images.length + filesToUpload.length > maxImages) {
    showToast.error(`You can only upload a maximum of ${maxImages} files.`);
    return;
  }

  setIsUploading(true);

  try {
    const newImages: ImageItem[] = [];

    for (const file of filesToUpload) {
      // Updated valid types - ensure PNG is properly included
      const validTypes = [
        "image/jpeg",
        "image/jpg", // Add explicit JPG support
        "image/png", // Ensure PNG is included
        "image/gif",
        "image/webp",
        "image/bmp", // Add BMP support
        "image/tiff", // Add TIFF support
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size}`);

      if (!validTypes.includes(file.type)) {
        showToast.error(`File type "${file.type}" not supported for file: ${file.name}`);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        showToast.error(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
        continue;
      }

      try {
        let url: string;

        if (onUpload) {
          // If onUpload is provided, use it to upload the file
          url = await onUpload(file);
        } else {
          // Otherwise create object URL for preview
          url = URL.createObjectURL(file);
        }

        // Generate unique ID with file name and more entropy for better uniqueness
        const uniqueId = generateUniqueId("upload", file.name);

        const newImage: ImageItem = {
          id: uniqueId,
          url,
          file: onUpload ? undefined : file,
          remarks: file.name,
          type: getFileType(file),
        };

        newImages.push(newImage);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        showToast.error(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    if (newImages.length > 0) {
      // Add new images to existing ones
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);
      showToast.success(`${newImages.length} file(s) uploaded successfully!`);
    }
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};

  const handleCameraCapture = async (imageData: string) => {
    if (images.length >= maxImages) {
      showToast.error(`You can only upload a maximum of ${maxImages} files.`);
      return;
    }

    setIsUploading(true);

    try {
      let url = imageData;

      if (onUpload) {
        // Convert data URL to blob
        const blob = await fetch(imageData).then((res) => res.blob());
        const file = new File([blob], `captured-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        url = await onUpload(file);
      }

      // Generate unique ID for captured image with more entropy
      const uniqueId = generateUniqueId("captured", `img-${Date.now()}`);

      const newImage: ImageItem = {
        id: uniqueId,
        url,
        remarks: `Captured Image ${new Date().toLocaleTimeString()}`,
        type: "image",
      };

      // Add new captured image to existing ones
      const updatedImages = [...images, newImage];
      onImagesChange(updatedImages);
      showToast.success("Image captured successfully!");
    } catch (error) {
      console.error("Error processing captured image:", error);
      showToast.error("Failed to process captured image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = (indexToDelete: number) => {
    const imageToDelete = images[indexToDelete];

    // Revoke object URL if it's a blob URL to prevent memory leaks
    if (imageToDelete.url.startsWith("blob:")) {
      URL.revokeObjectURL(imageToDelete.url);
    }

    const updatedImages = images.filter((_, index) => index !== indexToDelete);
    onImagesChange(updatedImages);
    showToast.success("File deleted successfully!");
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowPreview(true);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />;
      case "doc":
        return <FileText className="h-6 w-6 text-blue-500" />;
      default:
        return <ImageIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {/* Upload Button */}
        {images.length < maxImages && (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              <Upload className="h-6 w-6 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 mt-2 text-center">
              Upload
            </span>
          </div>
        )}

        {/* Camera Button - Only shown when no non-image files exist */}
        {images.length < maxImages && (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={isUploading}
              className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              <Camera className="h-6 w-6 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 mt-2 text-center">
              Capture
            </span>
          </div>
        )}

        {/* Files Preview */}
        {images.length > 0 && (
          <div className="flex flex-col items-center">
            <div
              className="relative h-14 w-14 cursor-pointer"
              onClick={() => handleImageClick(0)}
            >
              {images.slice(0, 3).map((image, index) => (
                <div
                  key={`preview-${image.id}`} // Use unique key based on image ID
                  className={`absolute w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md transition-transform hover:scale-105 ${
                    image.type !== "image"
                      ? "bg-gray-100 flex items-center justify-center"
                      : ""
                  }`}
                  style={{
                    right: `${index * 6}px`,
                    top: `${index * 2}px`,
                    zIndex: 3 - index,
                  }}
                >
                  {image.type === "image" ? (
  <img
    src={getImageUrl(image)}
    alt=""
    className="w-full h-full object-cover"
    key={`preview-img-${image.id}`}
    onError={(e) => {
      console.error("Image load error for:", image.url, e);
      const target = e.target as HTMLImageElement;
      // Try to reload once with cache-busting
      if (!target.src.includes('?reload=')) {
        target.src = `${target.src}${target.src.includes('?') ? '&' : '?'}reload=${Date.now()}`;
      }
    }}
    onLoad={() => {
      console.log("Image loaded successfully:", image.url);
    }}
  />
) : (
  <div className="text-center p-1">
    {getFileIcon(image.type)}
    <span className="text-xs truncate block">
      {image.url
        .split("/")
        .pop()
        ?.split(".")
        .shift()
        ?.substring(0, 3)}
    </span>
  </div>
)}
                </div>
              ))}
              {images.length > 3 && (
                <div
                  className="absolute w-12 h-12 rounded-lg bg-gray-800/80 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    right: "18px",
                    top: "6px",
                    zIndex: 4,
                  }}
                >
                  +{images.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-2 text-center">
              {images.length} file{images.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
  ref={fileInputRef}
  type="file"
  accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx" // More explicit accept
  onChange={handleFileUpload}
  className="hidden"
  multiple
/>

      {/* Upload Status */}
      {isUploading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Processing files...
          </div>
        </div>
      )}

      {/* File Count Info */}
      {images.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {images.length} of {maxImages} files selected
        </div>
      )}

      {/* Modals */}
      <ImagePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        images={images}
        currentIndex={currentImageIndex}
        onDelete={handleDeleteImage}
        onIndexChange={setCurrentImageIndex}
      />

      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default PaymentImageUpload;
