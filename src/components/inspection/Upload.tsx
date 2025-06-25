import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Upload, Check } from "lucide-react";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "../ui/form";

interface FileUploadProps {
  name: string;
  label: string;
  accept?: string;
  maxSize?: number;
  uploadFn: (file: File) => Promise<string>;
}

export const FileUpload = ({
  name,
  label,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  uploadFn,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { setValue, getValues, trigger } = useFormContext();

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      const toastId = toast.loading("Uploading file...", { id: "upload" });

      if (file.size > maxSize) {
        throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      }

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) =>
          prev >= 90 ? (clearInterval(interval), prev) : prev + 10
        );
      }, 300);

      const fileUrl = await uploadFn(file);
      setUploadProgress(100);
      clearInterval(interval);

      if (!fileUrl) throw new Error("File uploaded but no URL returned");

      setValue(name, fileUrl);
      toast.dismiss(toastId);
      toast.success("File uploaded successfully!");
      trigger(name);
    } catch (error) {
      toast.dismiss("upload");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast.error(errorMessage);
      console.error("File upload error:", error);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const getFileDisplayName = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    return parts[parts.length - 1];
  };

  const currentValue = getValues(name);

  return (
    <FormItem>
      <FormLabel className="text-gray-700 text-sm font-medium">
        {label}
      </FormLabel>
      <FormControl>
        <div className="space-y-2">
          <label
            htmlFor={name}
            className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              {uploading ? "Uploading..." : `Upload ${label}`}
            </span>
          </label>
          <Input
            type="file"
            accept={accept}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                handleFileUpload(files[0]);
              }
            }}
            className="hidden"
            id={name}
            disabled={uploading}
          />
          {uploadProgress > 0 && (
            <Progress
              value={uploadProgress}
              className="h-2 bg-gray-100"
            />
          )}
          {currentValue && (
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
              <div className="flex items-center gap-2 text-sm text-emerald-800">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">
                  {getFileDisplayName(currentValue)}
                </span>
              </div>
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};