import React, { useEffect, useState } from 'react';
import { useJobCards } from '../../context/JobCardContext';
import { Button } from '../ui/button';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface JobCardListProps {
  onEdit: (jobCard: any) => void;
  onOpenForm: () => void;
}

const JobCardList: React.FC<JobCardListProps> = ({ onEdit, onOpenForm }) => {
  const { jobCards, loading, fetchJobCards, deleteJobCard } = useJobCards();

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  const handleDelete = async (jobCardId: string) => {
    if (window.confirm('Are you sure you want to delete this job card?')) {
      try {
        await deleteJobCard(jobCardId);
      } catch (error) {
        console.error('Error deleting job card:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emerald-800">Job Cards</h2>
        <Button onClick={onOpenForm} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          New Job Card
        </Button>
      </div>

      {jobCards.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No job cards found.</p>
          <Button onClick={onOpenForm} className="mt-4">
            Create Your First Job Card
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobCards.map((jobCard) => (
            <div key={jobCard.name} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {jobCard.custom_customer_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {jobCard.building_name} - {jobCard.area}
                  </p>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Property No:</span>
                      <p className="font-medium">{jobCard.property_no}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <p className="font-medium">
                        {jobCard.start_date ? format(new Date(jobCard.start_date), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Finish Date:</span>
                      <p className="font-medium">
                        {jobCard.finish_date ? format(new Date(jobCard.finish_date), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Project ID:</span>
                      <p className="font-medium">{jobCard.custom_project_id_no_ || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(jobCard)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(jobCard.name!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobCardList;
