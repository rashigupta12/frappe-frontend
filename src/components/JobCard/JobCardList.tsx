// import React, { useEffect } from 'react';
// import { useJobCards } from '../../context/JobCardContext';
// import { Button } from '../ui/button';
// import { Edit, Trash2, Plus } from 'lucide-react';
// import { format } from 'date-fns';

// interface JobCardListProps {
//   onEdit: (jobCard: any) => void;
//   onOpenForm: () => void;
// }

// const JobCardList: React.FC<JobCardListProps> = ({ onEdit, onOpenForm }) => {
//   const { jobCards, loading, fetchJobCards, deleteJobCard, fetchEmployees, getEmployeeNameById } = useJobCards();

//   useEffect(() => {
//     fetchJobCards();
//     fetchEmployees(); // Make sure employees are loaded
//   }, [fetchJobCards, fetchEmployees]);

//   const handleDelete = async (jobCardId: string) => {
//     if (window.confirm('Are you sure you want to delete this job card?')) {
//       try {
//         await deleteJobCard(jobCardId);
//       } catch (error) {
//         console.error('Error deleting job card:', error);
//       }
//     }
//   };

//   // Helper function to format date safely
//   const formatDateSafely = (dateString: string): string => {
//     if (!dateString) return 'N/A';
//     try {
//       return format(new Date(dateString), 'MMM dd, yyyy');
//     } catch (error) {
//       return dateString; // Return original string if parsing fails
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
//         <span className="ml-2">Loading job cards...</span>
//       </div>
//     );
//   }

//   console.log("🔍 Current job cards in list:", jobCards);

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-emerald-800">Job Cards ({jobCards.length})</h2>
//         <Button onClick={onOpenForm} className="bg-emerald-600 hover:bg-emerald-700">
//           <Plus className="h-4 w-4 mr-2" />
//           New Job Card
//         </Button>
//       </div>

//       {jobCards.length === 0 ? (
//         <div className="text-center py-8">
//           <p className="text-gray-500">No job cards found.</p>
//           <Button onClick={onOpenForm} className="mt-4">
//             Create Your First Job Card
//           </Button>
//         </div>
//       ) : (
//         <div className="grid gap-4">
//           {jobCards.map((jobCard) => (
//             <div key={jobCard.name} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
//               <div className="flex justify-between items-start">
//                 <div className="flex-1">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     {jobCard.party_name || 'No Customer Name'}
//                   </h3>
//                   <p className="text-sm text-gray-600 mt-1">
//                     {jobCard.building_name || 'No Building'} - {jobCard.area || 'No Area'}
//                   </p>
//                   <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                     <div>
//                       <span className="text-gray-500">Property No:</span>
//                       <p className="font-medium">{jobCard.property_no || 'N/A'}</p>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Start Date:</span>
//                       <p className="font-medium">{formatDateSafely(jobCard.start_date)}</p>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Finish Date:</span>
//                       <p className="font-medium">{formatDateSafely(jobCard.finish_date)}</p>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Project ID:</span>
//                       <p className="font-medium">{jobCard.project_id_no || 'N/A'}</p>
//                     </div>
//                   </div>
                  
//                   {/* <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
//                     <div>
//                       <span className="text-gray-500">Prepared By:</span>
//                       <p className="font-medium">{getEmployeeNameById(jobCard.prepared_by)}</p>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Approved By:</span>
//                       <p className="font-medium">{getEmployeeNameById(jobCard.approved_by)}</p>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">AC V No/Date:</span>
//                       <p className="font-medium">{jobCard.ac_v_no_and_date || 'N/A'}</p>
//                     </div>
//                   </div> */}

//                   <div className="mt-2 flex gap-2">
//                     {jobCard.pressing_charges && jobCard.pressing_charges.length > 0 && (
//                       <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded">
//                         {jobCard.pressing_charges.length} Pressing Charge{jobCard.pressing_charges.length > 1 ? 's' : ''}
//                       </span>
//                     )}
//                     {jobCard.material_sold && jobCard.material_sold.length > 0 && (
//                       <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
//                         {jobCard.material_sold.length} Material{jobCard.material_sold.length > 1 ? 's' : ''} Sold
//                       </span>
//                     )}
//                   </div>
//                 </div>
                
//                 <div className="flex gap-2 ml-4">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => onEdit(jobCard)}
//                   >
//                     <Edit className="h-4 w-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleDelete(jobCard.name!)}
//                     className="text-red-600 hover:text-red-700"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default JobCardList;


import React, { useEffect, useState } from 'react';
import { useJobCards, type JobCard } from '../../context/JobCardContext';
import { Button } from '../ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
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
          Job Cards ({jobCards.length})
        </h2>
        <Button
          onClick={onOpenForm}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Job Card
        </Button>
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
