/* eslint-disable @typescript-eslint/no-explicit-any */
import { Edit, Home, Info, Phone, User } from "lucide-react";
import { CardHeader, CardTitle } from "../../ui/card";


interface InspectionHeaderProps {
  isUpdateMode: boolean;
  displayData: any;
  storeError: string | null;
}

const InspectionHeader = ({ isUpdateMode, displayData, storeError }: InspectionHeaderProps) => {
  return (
    <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-1">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col">
          <CardTitle className="flex items-center gap-2 text-lg m-0 p-0">
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
              <span>{displayData.customerName}</span>
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