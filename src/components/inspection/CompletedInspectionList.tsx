/* eslint-disable @typescript-eslint/no-unused-vars */
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
  { value: "In Progress", label: "In Progress", color: "bg-blue-500 text-white" },
  { value: "Completed", label: "Completed", color: "bg-green-500 text-white" },
  { value: "On Hold", label: "On Hold", color: "bg-yellow-500 text-white" },
  { value: "Cancelled", label: "Cancelled", color: "bg-red-500 text-white" },
];

interface StatusDropdownProps {
  currentStatus: string;
  inspectionName: string;
  onStatusChange: (inspectionName: string, newStatus: string, currentStatus: string) => void;
  isUpdating: boolean;
}

const StatusDropdown = ({ currentStatus, inspectionName, onStatusChange, isUpdating }: StatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || "bg-gray-400 text-white";
  };

  const handleOptionClick = (newStatus: string) => {
    if (newStatus !== currentStatus && !isUpdating) {
      onStatusChange(inspectionName, newStatus, currentStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !isUpdating && setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer flex items-center space-x-1 ${getStatusColor(currentStatus)} ${
          isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        <span>{currentStatus}</span>
        {isUpdating ? (
          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent ml-1"></div>
        ) : (
          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 11L3 6h10l-5 5z"/>
          </svg>
        )}
      </button>

      {isOpen && !isUpdating && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[120px]">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md m-1 transition-opacity ${
                option.color
              } ${option.value === currentStatus ? 'opacity-60' : 'hover:opacity-90'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface InspectionListProps {
  userEmail: string;
}

const MobileSiteInspectionList = ({ userEmail }: InspectionListProps) => {
  console.log("User Email:", userEmail);
  const {
    fetchAllInspectionsByField,
    siteInspections,
    loading,
    error,
    updateInspectionbyId
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

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "Pending":
  //       return "bg-orange-500 text-white";
  //     case "In Progress":
  //       return "bg-blue-500 text-white";
  //     case "Completed":
  //       return "bg-green-500 text-white";
  //     case "On Hold":
  //       return "bg-yellow-500 text-white";
  //     case "Cancelled":
  //       return "bg-red-500 text-white";
  //     default:
  //       return "bg-gray-400 text-white";
  //   }
  // };

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

  const handleStatusChange = async (inspectionName: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) return;

    try {
      setUpdatingStatus(inspectionName);
      await updateInspectionbyId(inspectionName, { inspection_status: newStatus });
      
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
    const matchesStatus = selectedStatus === "all" || inspection.inspection_status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      (inspection.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       inspection.lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       inspection.property_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       inspection.inspection_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const inProgressCount = siteInspections.filter((i) => i.inspection_status === "In Progress").length;
  const pendingCount = siteInspections.filter((i) => i.inspection_status === "Pending").length;

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
        <div className="px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Site Inspections</h1>
            <div className="flex items-center space-x-2 text-xs">
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
          
          {/* Compact Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search inspections..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter Pills */}
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedStatus(filter.id)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
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

      {/* Content */}
      <div className="px-3 py-2">
        {filteredInspections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🏗️</div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No site inspections found</h3>
            <p className="text-xs text-gray-500">Try adjusting your search or status filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredInspections.map((inspection) => (
              <div
                key={inspection.name}
                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {getStatusIcon(inspection.inspection_status)}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {inspection.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>
                        {inspection.inspection_date && new Date(inspection.inspection_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        {inspection.inspection_time || "Time not set"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-7 ml-2"
                    onClick={() => {
                      navigate(`/inspector?tab=details`, { state: { inspection } });
                    }}
                  >
                    View
                  </Button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
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
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {inspection.inspection_notes.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                )}

                {/* Status and Follow-up */}
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      Modified: {new Date(inspection.modified).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    {inspection.follow_up_required === 1 && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
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