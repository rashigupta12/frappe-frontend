import React from "react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "../../../ui/dialog";
import { Button } from "../../../ui/button";
import { Mic, Trash2, X, Edit3, MessageSquare } from "lucide-react";
import { type MediaItem } from "../utils/fileUpload";

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem;
  onRemove: () => void;
  onEditRemark?: () => void;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  onClose,
  media,
  onRemove,
  onEditRemark,
}) => {
  const imageurl = "https://eits.thebigocommunity.org";
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/70" />
      <DialogTitle className="sr-only">
        Media Preview
      </DialogTitle>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden rounded-lg">
        <div className="relative w-full h-[70vh] flex items-center justify-center">
          {media.type === "image" && (
            <img
              src={`${imageurl}${media.url}`}
              alt={media.remarks || "Media preview"}
              className="max-w-full max-h-full object-contain"
              style={{ touchAction: 'manipulation' }}
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

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Action buttons */}
          <div className="absolute bottom-2 left-2 flex gap-2">
            {onEditRemark && (
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 hover:bg-white text-gray-900"
                onClick={onEditRemark}
                title="Edit Remark"
              >
                <Edit3 className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="icon"
              onClick={onRemove}
              title="Delete Media"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Remarks section */}
        {media.remarks && (
          <div className="bg-white p-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Remark</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {media.remarks}
                </p>
              </div>
              {onEditRemark && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEditRemark}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Edit Remark"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreviewModal;