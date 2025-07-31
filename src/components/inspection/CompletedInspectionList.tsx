import { useEffect, useState, useRef } from "react";
import { useInspectionStore } from "../../store/inspectionStore";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "Scheduled", label: "Pending" },
  { id: "In Progress", label: "In Progress" },
  { id: "Completed", label: "Completed" },
];

const statusOptions = [
  { value: "Scheduled", label: "Scheduled", color: "bg-orange-500 text-white" },
  {
    value: "In Progress",
    label: "In Progress",
    color: "bg-blue-500 text-white",
  },
  { value: "Completed", label: "Completed", color: "bg-green-500 text-white" },
  { value: "On Hold", label: "On Hold", color: "bg-yellow-500 text-white" },
  { value: "Cancelled", label: "Cancelled", color: "bg-red-500 text-white" },
];

interface StatusDropdownProps {
  currentStatus: string;
  inspectionName: string;
  onStatusChange: (
    inspectionName: string,
    newStatus: string,
    currentStatus: string
  ) => void;
  isUpdating: boolean;
}

const StatusDropdown = ({
  currentStatus,
  inspectionName,
  onStatusChange,
  isUpdating,
}: StatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if status is completed - prevent any changes
  const isCompleted = currentStatus === "Completed";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowConfirmation(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.color || "bg-gray-400 text-white";
  };

  const handleOptionClick = (newStatus: string) => {
    if (newStatus !== currentStatus && !isUpdating) {
      // If trying to change TO completed status, show confirmation
      if (newStatus === "Completed") {
        setPendingStatus(newStatus);
        setShowConfirmation(true);
        setIsOpen(false);
        return;
      }

      // For other status changes, proceed normally
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !isUpdating && !isCompleted && setIsOpen(!isOpen)}
        disabled={isUpdating || isCompleted}
        className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(
          currentStatus
        )} ${
          isUpdating || isCompleted
            ? "opacity-50 cursor-not-allowed"
            : "hover:opacity-90 cursor-pointer"
        }`}
        title={
          isCompleted
            ? "Status cannot be changed - inspection is completed"
            : ""
        }
      >
        <span>{currentStatus}</span>
        {isUpdating ? (
          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent ml-1"></div>
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

      {/* Status Dropdown */}
      {isOpen && !isUpdating && !isCompleted && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[120px]">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md m-1 transition-opacity ${
                option.color
              } ${
                option.value === currentStatus
                  ? "opacity-60"
                  : "hover:opacity-90"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Confirm Status Change
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to mark this inspection as{" "}
                <strong>Completed</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Warning:</strong> Once marked as completed, you will
                  not be able to change the status or make further updates to
                  this inspection.
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

interface InspectionListProps {
  userEmail: string;
}

const MobileSiteInspectionList = ({ userEmail }: InspectionListProps) => {
  const {
    fetchAllInspectionsByField,
    siteInspections,
    loading,
    error,
    updateInspectionbyId,
  } = useInspectionStore();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userEmail) {
      fetchAllInspectionsByField("owner", userEmail);
    }
  }, [userEmail, fetchAllInspectionsByField]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "In Progress":
        return "🔄";
      case "Completed":
        return "✅";
      case "On Hold":
        return "⏸️";
      case "Cancelled":
        return "❌";
      default:
        return "📋";
    }
  };

  const handleStatusChange = async (
    inspectionName: string,
    newStatus: string,
    currentStatus: string
  ) => {
    if (newStatus === currentStatus) return;

    try {
      setUpdatingStatus(inspectionName);
      await updateInspectionbyId(inspectionName, {
        inspection_status: newStatus,
      });
      

      // Refresh the list to show updated status
      await fetchAllInspectionsByField("owner", userEmail);
    } catch (error) {
      console.error("Failed to update inspection status:", error);
      // You might want to show a toast notification here
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredInspections = siteInspections.filter((inspection) => {
    const matchesStatus =
      selectedStatus === "all" ||
      inspection.inspection_status === selectedStatus;
    const matchesSearch =
      searchTerm === "" ||
      inspection.customer_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      inspection.lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.property_type
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      inspection.inspection_id
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const inProgressCount = siteInspections.filter(
    (i) => i.inspection_status === "In Progress"
  ).length;
  const pendingCount = siteInspections.filter(
    (i) => i.inspection_status === "Pending"
  ).length;

  if (!userEmail) {
    return (
      <div className="p-4 text-center text-gray-600">
        Please log in to view site inspections.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 text-red-800 rounded-md mb-3 mx-3">
        <p className="font-medium text-sm">Error loading site inspections</p>
        <button
          onClick={() => fetchAllInspectionsByField("owner", userEmail)}
          className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
  {/* Sticky Header */}
  <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
    <div className="px-3 py-3  w-full ">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg lg:text-xl font-bold text-gray-900">
          Site Inspections
        </h1>
        <div className="flex items-center space-x-2 text-xs lg:text-sm">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
            {inProgressCount} In Progress
          </span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
            {pendingCount} Pending
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            {siteInspections.length} Total
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4">
        {/* Search Bar */}
        <div className="lg:flex-1  lg:mb-0">
          <input
            type="text"
            placeholder="Search inspections..."
            className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Status Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide lg:flex-wrap lg:overflow-x-visible lg:space-x-2 lg:space-y-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedStatus(filter.id)}
              className={`px-3 py-1 text-xs lg:text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedStatus === filter.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>

  {/* Content */}
  <div className="px-3 py-2 w-full lg:mx-auto">
    {filteredInspections.length === 0 ? (
      <div className="text-center py-12 lg:py-16">
        <div className="text-4xl lg:text-5xl mb-2">🏗️</div>
        <h3 className="text-sm lg:text-base font-medium text-gray-900 mb-1">
          No site inspections found
        </h3>
        <p className="text-xs lg:text-sm text-gray-500">
          Try adjusting your search or status filter
        </p>
      </div>
    ) : (
      <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
        {filteredInspections.map((inspection) => (
          <div
            key={inspection.name}
            className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm  hover:shadow-md transition-shadow"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg lg:text-lg">
                    {getStatusIcon(inspection.inspection_status)}
                  </span>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 truncate">
                    {inspection.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-2 text-xs lg:text-xs text-gray-500">
                  <span>
                    {inspection.inspection_date &&
                      new Date(inspection.inspection_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                  </span>
                  <span>•</span>
                  <span className="truncate">
                    {inspection.inspection_time || "Time not set"}
                  </span>
                </div>
              </div>

              {/* Update Button - Disabled for completed inspections */}
              {inspection.docstatus === 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs lg:text-sm px-2 py-1 h-7 lg:h-8 bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => {
                    navigate(`/inspector?tab=details`, {
                      state: { inspection },
                    });
                  }}
                >
                  View
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs lg:text-sm px-2 py-1 h-7 lg:h-8 bg-purple-500 text-white hover:bg-purple-600"
                  onClick={() => {
                    navigate(`/inspector?tab=details`, {
                      state: { inspection },
                    });
                  }}
                >
                  Update
                </Button>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs lg:text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">👤</span>
                <span className="text-gray-600 truncate">
                  {inspection.customer_name || "N/A"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">🏠</span>
                <span className="text-gray-600 truncate">
                  {inspection.property_type || "N/A"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">📋</span>
                <span className="text-gray-600 truncate">
                  {inspection.lead || "N/A"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">📐</span>
                <span className="text-gray-600 truncate">
                  {inspection.site_dimensions?.length || 0} Areas
                </span>
              </div>
            </div>

            {/* Inspection Notes */}
            {inspection.inspection_notes && (
              <div className=" pt-2 border-t border-gray-100">
                <p className="text-xs lg:text-sm text-gray-600 line-clamp-2 lg:line-clamp-3">
                  {inspection.inspection_notes.replace(/<[^>]*>/g, "")}
                </p>
              </div>
            )}

            {/* Status and Follow-up */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs lg:text-sm text-gray-500">
                  Modified:{" "}
                  {new Date(inspection.modified).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {inspection.follow_up_required === 1 && (
                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs lg:text-sm rounded-full">
                    Follow-up
                  </span>
                )}
              </div>

              {/* Status Dropdown */}
              <StatusDropdown
                currentStatus={inspection.inspection_status}
                inspectionName={inspection.name}
                onStatusChange={handleStatusChange}
                isUpdating={updatingStatus === inspection.name}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
  );
};

export default MobileSiteInspectionList;
