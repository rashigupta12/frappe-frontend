// hooks/useJobCardOtherActions.ts
import { useState } from "react";
import type { JobCardOther } from "../../../context/JobCardOtherContext";

export const useJobCardOtherActions = (
  onEdit: (jobCard: JobCardOther) => void,
  deleteJobCardOther: (id: string) => Promise<void>
) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const handleEdit = (card: JobCardOther, e: React.MouseEvent) => {
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
      await deleteJobCardOther(cardToDelete);
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