// import React, { useEffect, useState } from 'react';
// import { useJobCardsOther, type JobCardOther } from '../../context/JobCardOtherContext';
// import { Button } from '../ui/button';
// import { Edit, Trash2, Plus, Calendar} from 'lucide-react';
// import JobCardOtherDetails from './JobCardOtherDetails';
// import { Dialog } from '../ui/dialog';

// interface Props {
//   onEdit: (jobCard: JobCardOther) => void;
//   onOpenForm: () => void;
// }

// const JobCardOtherList: React.FC<Props> = ({ onEdit, onOpenForm }) => {
//   const { jobCardsOther, loading, fetchJobCardsOther, deleteJobCardOther } = useJobCardsOther();
//   const [selectedCard, setSelectedCard] = useState<JobCardOther | null>(null);

//   useEffect(() => {
//     fetchJobCardsOther();
//   }, [fetchJobCardsOther]);

//   const handleDelete = async (id: string) => {
//     if (!window.confirm('Are you sure you want to delete this job card?')) return;
//     try {
//       await deleteJobCardOther(id);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
//       </div>
//     );
//   }

//   return (
//     <>
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-4 sm:px-0">
//         <div className="flex items-center space-x-3 mb-2 sm:mb-0">
          
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">
//               Other Services Job Cards ({jobCardsOther.length})
//             </h2>
            
//           </div>
//         </div>
        
//       </div>

//       {/* Empty state */}
//       {jobCardsOther.length === 0 ? (
//         <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
//           {/* <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
//             <Wrench className="h-8 w-8 text-gray-400" />
//           </div> */}
//           <p className="text-gray-500 text-lg mb-2">No job cards found</p>
//           <p className="text-gray-400 text-sm mb-4">Get started by creating your first job card</p>
//           <Button 
//             onClick={onOpenForm} 
//             className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
//           >
//             <Plus className="h-4 w-4 mr-2" />
//             Create Your First Job Card
//           </Button>
//         </div>
//       ) : (
//         /* Grid of cards */
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-0">
//           {jobCardsOther.map((card) => (
//             <div
//               key={card.name}
//               onClick={() => setSelectedCard(card)}
//               className="cursor-pointer bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 group"
//             >
//               {/* Header */}
//               <div className="flex items-start justify-between mb-4">
//                 {/* <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
//                   <Wrench className="h-5 w-5 text-blue-600" />
//                 </div> */}
//                 {/* <div className="text-xs text-gray-500">
//                   {new Date(card.creation).toLocaleDateString()}
//                 </div> */}
//               </div>

//               {/* Customer Info */}
//               <div className="mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
//                   {card.party_name || 'No Customer Name'}
//                 </h3>
//                 {/* <div className="flex items-center text-sm text-gray-600 mb-2">
//                   <MapPin className="h-4 w-4 mr-1 text-gray-400" />
//                   <span>{card.building_name || 'No Building'}</span>
//                 </div> */}
//                 <div className="text-sm text-gray-600">
//                   <span className="font-medium">Area:</span> {card.area || 'N/A'}
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   <span className="font-medium">Property:</span> {card.property_no || 'N/A'}
//                 </div>
//               </div>

//               {/* Dates */}
//               <div className="mb-2 p-2 rounded-lg">
//                 <div className="flex gap-4 text-sm">
//                   <div className="flex items-center text-gray-700">
//                     <Calendar className="h-4 w-4 mr-2 text-gray-400" />
//                     <span className="font-medium">Start:</span>
//                     <span className="ml-1">{card.start_date || 'N/A'}</span>
//                   </div>
//                   <div className="flex items-center text-gray-700">
//                     <Calendar className="h-4 w-4 mr-2 text-gray-400" />
//                     <span className="font-medium">Finish:</span>
//                     <span className="ml-1">{card.finish_date || 'N/A'}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Services Count */}
//               {/* <div className="mb-4 flex items-center text-sm text-blue-600">
//                 <Wrench className="h-4 w-4 mr-1" />
//                 <span>
//                   {card.services?.length || 0} service{(card.services?.length || 0) !== 1 ? 's' : ''}
//                 </span>
//               </div> */}

//               {/* Project Info */}
//               {card.project_id_no && (
//                 <div className="mb-4 text-sm text-gray-600">
//                   <span className="font-medium">Project ID:</span> {card.project_id_no}
//                 </div>
//               )}

//               {/* Edit/Delete buttons */}
//               <div
//                 className="flex justify-end space-x-2 pt-4 border-t border-gray-100"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => onEdit(card)}
//                   className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
//                 >
//                   <Edit className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
//                   onClick={() => handleDelete(card.name)}
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Details Modal */}
//       <Dialog
//         open={!!selectedCard}
//         onOpenChange={() => setSelectedCard(null)}
//       >
//         {selectedCard && (
//           <JobCardOtherDetails
//             card={selectedCard}
//             onClose={() => setSelectedCard(null)}
//           />
//         )}
//       </Dialog>
//     </>
//   );
// };

// export default JobCardOtherList;




import React, { useEffect, useState } from 'react';
import { useJobCardsOther, type JobCardOther } from '../../context/JobCardOtherContext';
import { Button } from '../ui/button';
import { Edit, Trash2, Plus, Calendar, MapPin, User } from 'lucide-react';
import JobCardOtherDetails from './JobCardOtherDetails';
import { Dialog } from '../ui/dialog';

interface Props {
  onEdit: (jobCard: JobCardOther) => void;
  onOpenForm: () => void;
}

const JobCardOtherList: React.FC<Props> = ({ onEdit, onOpenForm }) => {
  const { jobCardsOther, loading, fetchJobCardsOther, deleteJobCardOther } = useJobCardsOther();
  const [selectedCard, setSelectedCard] = useState<JobCardOther | null>(null);

  useEffect(() => {
    fetchJobCardsOther();
  }, [fetchJobCardsOther]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job card?')) return;
    try {
      await deleteJobCardOther(id);
    } catch (err) {
      console.error(err);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-4 sm:px-0">
        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Other Services Job Cards ({jobCardsOther.length})
            </h2>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {jobCardsOther.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg mb-2">No job cards found</p>
          <p className="text-gray-400 text-sm mb-4">Get started by creating your first job card</p>
          <Button 
            onClick={onOpenForm} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Job Card
          </Button>
        </div>
      ) : (
        /* Grid of cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 sm:px-0">
          {jobCardsOther.map((card) => (
            <div
              key={card.name}
              onClick={() => setSelectedCard(card)}
              className="cursor-pointer bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 group h-fit"
            >
              {/* Header with Status Badge */}
             

              {/* Customer Info */}
              <div className="mb-4">
                <div className="flex items-start space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                    {truncateText(card.party_name || 'No Customer Name', 25)}
                  </h3>
                </div>
                
                <div className="space-y-1.5 ml-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="font-medium mr-1">Area:</span>
                    <span className="truncate">{truncateText(card.area || 'N/A', 15)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="h-3 w-3 mr-2 flex-shrink-0"></div>
                    <span className="font-medium mr-1">Property:</span>
                    <span className="truncate">{truncateText(card.property_no || 'N/A', 15)}</span>
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="mb-4 bg-gray-50 rounded-lg p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="font-medium">Start:</span>
                    </div>
                    <span className="text-gray-700">{card.start_date || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="font-medium">Finish:</span>
                    </div>
                    <span className="text-gray-700">{card.finish_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              {card.project_id_no && (
                <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700">
                    <span className="font-medium">Project ID:</span>
                    <span className="ml-1 break-all">{truncateText(card.project_id_no, 20)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                className="flex justify-end space-x-2 pt-3 border-t border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(card)}
                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 h-8 px-3"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 h-8 px-3"
                  onClick={() => handleDelete(card.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
          <JobCardOtherDetails
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Dialog>
    </>
  );
};

export default JobCardOtherList;