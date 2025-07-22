import React, { useEffect, useState } from 'react';
import { useJobCards, type JobCard } from '../../context/JobCardContext';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';
import JobCardDetails from './JobCardDetails';
import { Dialog } from '../ui/dialog';

interface Props {
  onEdit: (jobCard: JobCard) => void;
  onOpenForm: () => void;
}

const JobCardList: React.FC<Props> = ({ onEdit, onOpenForm }) => {
  const { jobCards, loading, fetchJobCards, deleteJobCard } = useJobCards();
  const [selectedCard, setSelectedCard] = useState<JobCard | null>(null);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job card?')) return;
    try {
      await deleteJobCard(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-4 sm:px-0">
        <h2 className="text-2xl font-bold text-emerald-800 mb-2 sm:mb-0">
          Job Cards -Veneer Pressing ({jobCards.length})
        </h2>
        {/* <Button
          onClick={onOpenForm}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Job Card
        </Button> */}
      </div>

      {/* Empty state */}
      {jobCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No job cards found.</p>
          <Button onClick={onOpenForm} className="mt-4">
            Create Your First Job Card
          </Button>
        </div>
      ) : (
        /* Grid of cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0">
          {jobCards.map((card) => (
            <div
              key={card.name}
              onClick={() => setSelectedCard(card)}
              className="cursor-pointer bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {card.party_name || 'No Customer Name'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {card.building_name || 'No Building'} –{' '}
                {card.area || 'No Area'}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Start:</span>{' '}
                  {card.start_date || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Finish:</span>{' '}
                  {card.finish_date || 'N/A'}
                </div>
              </div>

              {/* Edit/Delete buttons */}
              <div
                className="mt-4 flex justify-end space-x-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(card)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(card.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog
        open={!!selectedCard}
        onOpenChange={() => setSelectedCard(null)}
      >
        {selectedCard && (
          <JobCardDetails
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Dialog>
    </>
  );
};

export default JobCardList;
