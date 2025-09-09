/* eslint-disable @typescript-eslint/no-explicit-any */
// Main InspectionList Component
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useInspectionStore } from "../../../store/inspectionStore";
import { Loader } from "../../common/Loader";
import { InspectionHeader } from "./InspectionHeader";
import { SearchAndFilters } from "./SearchAndFilters";
import { InspectionCard } from "./InspectionCard";
import { InspectionTable } from "./InspectionTable";


interface InspectionListProps {
  userEmail: string;
}

const InspectionList = ({ userEmail }: InspectionListProps) => {
  const { fetchAllInspectionsByField, siteInspections, loading, error, updateInspectionbyId } =
    useInspectionStore();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userEmail) {
      fetchAllInspectionsByField("owner", userEmail);
    }
  }, [userEmail, fetchAllInspectionsByField]);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

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
      await fetchAllInspectionsByField("owner", userEmail);
    } catch (error) {
      console.error("Failed to update inspection status:", error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleNavigate = (inspection: any) => {
    navigate(`/inspector?tab=details`, { state: { inspection } });
  };

  const filteredInspections = siteInspections.filter((inspection) => {
    const matchesStatus =
      selectedStatus === "all" || inspection.inspection_status === selectedStatus;
    const matchesSearch =
      searchTerm === "" ||
      inspection.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.property_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspection_id?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const inProgressCount = siteInspections.filter((i) => i.inspection_status === "In Progress").length;
  const pendingCount = siteInspections.filter((i) => i.inspection_status === "Scheduled").length;

  if (!userEmail) {
    return (
      <div className="p-4 text-center text-gray-600">
        Please log in to view site inspections.
      </div>
    );
  }

  if (loading) {
    return <Loader />;
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
        <div className="px-3 py-3 w-full">
          <InspectionHeader
            inProgressCount={inProgressCount}
            pendingCount={pendingCount}
            totalCount={siteInspections.length}
          />

          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2 w-full lg:mx-auto">
        {isMobile ? (
          // Mobile Card View
          filteredInspections.length === 0 ? (
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
            <div className="space-y-2">
              {filteredInspections.map((inspection) => (
                <InspectionCard
                  key={inspection.name}
                  inspection={inspection}
                  onStatusChange={handleStatusChange}
                  onNavigate={handleNavigate}
                  updatingStatus={updatingStatus}
                />
              ))}
            </div>
          )
        ) : (
          // Desktop Table View
          <InspectionTable
            inspections={filteredInspections}
            onStatusChange={handleStatusChange}
            onNavigate={handleNavigate}
            updatingStatus={updatingStatus}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default InspectionList;