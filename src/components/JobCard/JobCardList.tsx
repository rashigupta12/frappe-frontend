// components/JobCard/JobCardList.tsx
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import DeleteConfirmation from "../common/DeleteComfirmation";
import { Loader } from "../common/Loader";
import { useJobCards, type JobCard } from "../../context/JobCardContext";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import JobCardDetails from "./JobCardDetails";
import JobCardTable from "./JobCardList/JobCardTable";
import JobCardGrid from "./JobCardList/JobCardGrid";
import EmptyState from "./JobCardList/EmptyState";
import { useJobCardFilters } from "./JobCardList/useJobCardFilters";
import { useJobCardActions } from "./JobCardList/useJobCardActions";
import JobCardFilters from "./JobCardList/JobCardFilters";

interface Props {
  onEdit: (jobCard: JobCard) => void;
  onOpenForm: () => void;
}

const JobCardList: React.FC<Props> = ({ onEdit, onOpenForm }) => {
  const { jobCards, loading, fetchJobCards, deleteJobCard } = useJobCards();
  const [selectedCard, setSelectedCard] = useState<JobCard | null>(null);
  
  const {
    filteredJobCards,
    filters,
    setFilters,
    clearFilters,
    isDefaultFilter
  } = useJobCardFilters(jobCards);

  const {
    deleteModalOpen,
    setDeleteModalOpen,
    // cardToDelete,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete
  } = useJobCardActions(onEdit, deleteJobCard);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="pb-10 max-w-7xl  ">

      <div className="bg-white p-2  ">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 ">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          Job Cards
          <span className="bg-slate-100 text-slate-700 text-sm font-medium px-2 py-0.5 rounded-full border border-slate-300">
            {filteredJobCards.length}
          </span>
          {isDefaultFilter && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              Today's Jobs
            </span>
          )}
        </h2>
        <Button
          onClick={onOpenForm}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Filters */}
      <JobCardFilters
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        isDefaultFilter={isDefaultFilter}
      />

      </div>

      {/* Content */}
      {filteredJobCards.length === 0 ? (
        <EmptyState
          isDefaultFilter={isDefaultFilter}
          onClearFilters={clearFilters}
          onOpenForm={onOpenForm}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <JobCardTable
              jobCards={filteredJobCards}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetails={setSelectedCard}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <JobCardGrid
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
          <JobCardDetails
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        text="Are you sure you want to delete this job card? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default JobCardList;