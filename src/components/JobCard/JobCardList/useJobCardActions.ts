// hooks/useJobCardActions.ts
import { useState } from "react";
import type { JobCard } from "../../../context/JobCardContext";


export const useJobCardActions = (
  onEdit: (jobCard: JobCard) => void,
  deleteJobCard: (id: string) => Promise<void>
) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const handleEdit = (card: JobCard, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;

    try {
      await deleteJobCard(cardToDelete);
      setDeleteModalOpen(false);
      setCardToDelete(null);
    } catch (err) {
      console.error(err);
      setDeleteModalOpen(false);
      setCardToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCardToDelete(null);
  };

  return {
    deleteModalOpen,
    setDeleteModalOpen,
    cardToDelete,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete
  };
};
  