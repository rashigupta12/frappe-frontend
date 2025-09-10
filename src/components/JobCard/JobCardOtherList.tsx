import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import DeleteConfirmation from "../common/DeleteComfirmation";
import { Loader } from "../common/Loader";
import { useJobCardsOther, type JobCardOther } from "../../context/JobCardOtherContext";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import JobCardOtherDetails from "./JobCardOtherDetails";
import JobCardOtherFilters from "./OtherJobCardList/JobCardOtherFilters";
import JobCardOtherTable from "./OtherJobCardList/JobCardOtherTable";
import JobCardOtherGrid from "./OtherJobCardList/JobCardOtherGrid";
import ServiceJobEmptyState from "./OtherJobCardList/ServiceJobEmptyState";
import { useJobCardOtherFilters } from "./OtherJobCardList/useJobCardOtherFilters";
import { useJobCardOtherActions } from "./OtherJobCardList/useJobCardOtherActions";

interface Props {
  onEdit: (jobCard: JobCardOther) => void;
  onOpenForm: () => void;
}

const JobCardOtherList: React.FC<Props> = ({ onEdit, onOpenForm }) => {
  const { jobCardsOther, loading, fetchJobCardsOther, deleteJobCardOther } = useJobCardsOther();
  const [selectedCard, setSelectedCard] = useState<JobCardOther | null>(null);
  
  const {
    filteredJobCards,
    filters,
    setFilters,
    clearFilters,
    isDefaultFilter,
    getUniqueServiceTypes
  } = useJobCardOtherFilters(jobCardsOther);

  const {
    deleteModalOpen,
    setDeleteModalOpen,
    // cardToDelete,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete
  } = useJobCardOtherActions(onEdit, deleteJobCardOther);

  useEffect(() => {
    fetchJobCardsOther();
  }, [fetchJobCardsOther]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-2">
      <div className="flex items-center justify-between ">
        <h2 className="text-xl font-bold text-cyan-800 flex items-center gap-2">
          Job Cards
          <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2 py-0.5 rounded-full border border-gray-200">
            {filteredJobCards.length}
          </span>
          {isDefaultFilter && (
            <span className="text-xs bg-purple-50 text-cyan-700 px-2 py-0.5 rounded-full border border-purple-200">
              Today's Jobs
            </span>
          )}
        </h2>
        <Button
          onClick={onOpenForm}
          size="sm"
          className="bg-cyan-800 hover:bg-cyan-700 text-white rounded-md px-3 py-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      </div>

      {/* Filters */}
      <JobCardOtherFilters
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        isDefaultFilter={isDefaultFilter}
        uniqueServiceTypes={getUniqueServiceTypes}
      />

      {/* Content */}
      {filteredJobCards.length === 0 ? (
        <ServiceJobEmptyState
          isDefaultFilter={isDefaultFilter}
          onClearFilters={clearFilters}
          onOpenForm={onOpenForm}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <JobCardOtherTable
              jobCards={filteredJobCards}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetails={setSelectedCard}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <JobCardOtherGrid
              jobCards={filteredJobCards}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetails={setSelectedCard}
            />
          </div>
        </>
      )}

      {/* Details Modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        {selectedCard && (
          <JobCardOtherDetails
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        text="Are you sure you want to delete this service job card? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default JobCardOtherList;