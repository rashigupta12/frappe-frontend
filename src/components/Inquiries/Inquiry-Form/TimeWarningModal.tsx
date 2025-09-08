import { X } from "lucide-react";
import { Button } from "../../ui/button";

interface TimeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimeWarningModal: React.FC<TimeWarningModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg p-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">End Time Warning</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-gray-700">
          The calculated end time is after 6:00 PM. Time shouldn't extend
          beyond 6:00 PM.
        </p>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            OK, I Understand
          </Button>
        </div>
      </div>
    </div>
  );
};