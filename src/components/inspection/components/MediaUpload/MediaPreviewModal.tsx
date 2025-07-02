import React from "react";
import { Dialog, DialogContent, DialogOverlay } from "../../../ui/dialog"; // Assuming you have these from Shadcn UI
import { Button } from "../../../ui/button";
import { Mic, Trash2, X } from "lucide-react";
import { type MediaItem } from "../utils/fileUpload"; // Adjust path as needed

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem;
  onRemove: () => void;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  onClose,
  media,
  onRemove,
}) => {
  const imageurl = "https://eits.thebigocommunity.org";
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/70" />
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden rounded-lg">
        <div className="relative w-full h-[70vh] bg-gray-900 flex items-center justify-center">
          {media.type === "image" && (
            <img
              alt={media.remarks || "Media preview"}
              className="max-w-full max-h-full object-contain"
            />
          )}
          {media.type === "video" && (
            <video
              src={`${imageurl}${media.url}`}
              controls
              className="max-w-full max-h-full object-contain"
            />
          )}
          {media.type === "audio" && (
            <div className="flex flex-col items-center justify-center p-4 text-white">
              <Mic className="h-16 w-16 mb-4" />
              <p className="text-lg mb-4">
                {media.remarks || "Audio Playback"}
              </p>
              <audio
                src={`${imageurl}${media.url}`}
                controls
                className="w-full max-w-md"
              />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="absolute bottom-2 left-2"
            onClick={onRemove}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreviewModal;
