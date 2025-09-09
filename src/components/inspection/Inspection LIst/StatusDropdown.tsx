// StatusDropdown.tsx
import { useEffect, useState, useRef } from "react";
import { statusOptions, type StatusDropdownProps } from "./types";



export const StatusDropdown = ({
  currentStatus,
  inspectionName,
  onStatusChange,
  isUpdating,
  inspectionDate,
}: StatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownDirection, setDropdownDirection] = useState<"up" | "down">("down");

  const isCompleted = currentStatus === "Completed";
  const isDatePassed = inspectionDate && new Date(inspectionDate) < new Date();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowConfirmation(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const handleOptionClick = (newStatus: string) => {
    if (newStatus !== currentStatus && !isUpdating) {
      if (newStatus === "In Progress" && isDatePassed && currentStatus === "Scheduled") {
        setIsOpen(false);
        return;
      }

      if (newStatus === "Completed") {
        setPendingStatus(newStatus);
        setShowConfirmation(true);
        setIsOpen(false);
        return;
      }

      onStatusChange(inspectionName, newStatus, currentStatus);
    }
    setIsOpen(false);
  };

  const handleConfirmStatusChange = () => {
    onStatusChange(inspectionName, pendingStatus, currentStatus);
    setShowConfirmation(false);
    setPendingStatus("");
  };

  const handleCancelStatusChange = () => {
    setShowConfirmation(false);
    setPendingStatus("");
  };

  const toggleDropdown = () => {
    if (isUpdating || isCompleted) return;

    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 200;

      setDropdownDirection(
        spaceBelow > dropdownHeight || spaceBelow > spaceAbove ? "down" : "up"
      );
    }

    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        disabled={isUpdating || isCompleted}
        className={`px-3 py-1 text-xs rounded-full flex items-center ${getStatusColor(currentStatus)} ${
          isUpdating || isCompleted
            ? "opacity-50 cursor-not-allowed"
            : "hover:opacity-90 cursor-pointer"
        }`}
        title={
          isCompleted
            ? "Status cannot be changed - inspection is completed"
            : isDatePassed && currentStatus === "Scheduled"
            ? "Cannot change status - inspection date has passed"
            : ""
        }
      >
        <span>{currentStatus}</span>
        {isUpdating ? (
          <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent ml-1"></div>
        ) : isCompleted ? (
          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zM8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10z" />
            <path d="M8 9a1 1 0 0 1-1-1V6a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1z" />
            <path d="M8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          </svg>
        ) : (
          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 11L3 6h10l-5 5z" />
          </svg>
        )}
      </button>

      {isOpen && !isUpdating && !isCompleted && (
        <div
          className={`absolute ${
            dropdownDirection === "down" ? "top-full mt-1" : "bottom-full mb-1"
          } right-0 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[120px]`}
        >
          {statusOptions.map((option) => {
            const isDisabled =
              option.value === "In Progress" && isDatePassed && currentStatus === "Scheduled";

            return (
              <button
                key={option.value}
                onClick={() => !isDisabled && handleOptionClick(option.value)}
                className={`w-full text-left px-3 py-2 text-xs rounded-md m-1 transition-colors ${option.color} ${
                  option.value === currentStatus
                    ? "opacity-60"
                    : isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-90"
                }`}
                disabled={!!isDisabled}
                title={
                  isDisabled
                    ? "Cannot change to In Progress - inspection date has passed"
                    : ""
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Confirm Status Change</h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to mark this inspection as <strong>Completed</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Warning:</strong> Once marked as completed, you will not be able to change
                  the status or make further updates to this inspection.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelStatusChange}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};