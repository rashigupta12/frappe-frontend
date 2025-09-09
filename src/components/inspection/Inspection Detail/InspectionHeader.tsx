/* eslint-disable @typescript-eslint/no-explicit-any */
import { Edit, Home, Info, Phone, User, X } from "lucide-react";
import { CardHeader, CardTitle } from "../../ui/card";

interface InspectionHeaderProps {
  isUpdateMode: boolean;
  displayData: any;
  storeError: string | null;
  isSubmitted?: boolean; // Optional prop to indicate if the inspection is submitted
}

const InspectionHeader = ({
  isUpdateMode,
  displayData,
  storeError,
  isSubmitted,
}: InspectionHeaderProps) => {
  // Handle null displayData case
  console.log("displayData", displayData);
  if (!displayData) {
    return (
      <CardHeader className="bg-emerald-500 text-white px-4 py-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between ">
          <div className="flex flex-col">
            <CardTitle className="flex items-center  text-lg m-0 p-0">
              {isUpdateMode ? (
                <>
                  <Edit className="h-4 w-4" />
                  <span>Update Inspection</span>
                </>
              ) : (
                <span>Create Inspection</span>
              )}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-x-4 mt-1 text-sm">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 opacity-80" />
                <span>Loading...</span>
              </div>
            </div>
          </div>
        </div>

        {storeError && (
          <div className="text-yellow-200 text-sm flex items-center mt-1">
            <Info className="h-4 w-4" />
            Error: {storeError}
          </div>
        )}
      </CardHeader>
    );
  }

  return (
    <CardHeader className="bg-emerald-500 text-white px-4 pt-2 relative">
      {/* Close button at absolute top-right */}
      <button
        className="absolute top-4 right-4 text-gray-200 hover:text-white z-10"
        onClick={() => window.history.back()}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col w-full">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-1 text-lg m-0 p-0">
            <div className="flex items-center gap-1">
              {isSubmitted ? (
                <span className=" font-medium">Submitted ✅</span>
              ) : isUpdateMode ? (
                <>
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span>Update Inspection</span>
                </>
              ) : (
                <span>Create Inspection</span>
              )}
            </div>

            <span className="text-sm text-gray-200 truncate max-w-[280px] sm:max-w-[400px] md:max-w-[500px]">
              {displayData.inspectionName ||
                displayData.leadDetails?.name ||
                "New Inspection"}
            </span>
            {/* {isSubmitted && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Submitted
          </span>
        )} */}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-x-4 mt-1 text-sm">
            <div className="flex items-center gap-1 capitalize">
              <User className="h-4 w-4 opacity-80 capitalize" />
              <span>
                {displayData.leadDetails?.lead_name || "Unknown Customer"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4 opacity-80" />
              <span>{displayData.leadDetails?.mobile_no || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Home className="h-4 w-4 opacity-80" />
              <span>
                {displayData.leadDetails?.custom_property_type || "N/A"}
              </span>
            </div>
          </div>
          {displayData.leadDetails?.custom_property_area && (
            <div className="mt-1 text-sm text-gray-200">
              <span className="font-semibold">Address:</span>{" "}
              {/* {displayData.leadDetails.custom_property_area
            .replace(/,/g, ", ")
            .replace(/(\d{5})/, "$1 ")
            .replace(/(\d{3})-(\d{4})/, "$1-$2") || "N/A"} */}
              {[
                displayData.leadDetails?.custom_property_area,
                displayData.leadDetails?.custom_property_category,
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </div>
          )}
        </div>
      </div>

      {storeError && (
        <div className="text-yellow-200 text-sm flex items-center mt-1">
          <Info className="h-4 w-4" />
          Error: {storeError}
        </div>
      )}
    </CardHeader>
  );
};

export default InspectionHeader;
