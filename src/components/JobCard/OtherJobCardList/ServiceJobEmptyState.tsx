// components/JobCardOther/components/ServiceJobEmptyState.tsx
import { Wrench, Plus } from "lucide-react";
import React from "react";
import { Button } from "../../ui/button";

interface Props {
  isDefaultFilter: boolean;
  onClearFilters: () => void;
  onOpenForm: () => void;
}

const ServiceJobEmptyState: React.FC<Props> = ({ isDefaultFilter, onClearFilters, onOpenForm }) => {
  return (
    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
      <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <h3 className="text-base font-medium text-gray-900 mb-1">
        No service job cards found
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        {isDefaultFilter
          ? "No service job cards scheduled for today. Try adjusting the date range or create a new job card."
          : "No service job cards match your current filters. Try adjusting your search criteria."}
      </p>
      <div className="flex gap-2 justify-center">
        {!isDefaultFilter && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Show Today's Jobs
          </Button>
        )}
        <Button
          onClick={onOpenForm}
          size="sm"
          className="bg-cyan-800 hover:bg-cyan-700 text-white rounded-md px-3 py-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Service Job Card
        </Button>
      </div>
    </div>
  );
};

export default ServiceJobEmptyState;
