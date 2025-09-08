// src/components/SkeletonCard.tsx

import React from "react";

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 border border-gray-300 shadow-2xs animate-pulse lg:p-4">

      <div className="flex justify-between items-start gap-2">
 
        <div className="flex items-start gap-2 min-w-0 flex-1">
       
          <div className="bg-gray-200 rounded-md p-1.5 mt-0.5 flex-shrink-0">
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
    
          </div>
   
          <div className="min-w-0 flex-1">
       
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
               <div className="h-4 bg-gray-200 rounded w-32"></div>
               <div className="h-6 bg-gray-200 rounded w-20"></div>
    
            </div>
          
          </div>

        </div>
   
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
         <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
   
      </div>
     
      <div className="mt-2 space-y-2">

        <div className="flex items-center justify-between gap-2">
        
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
             <div className="h-3 bg-gray-200 rounded w-16"></div>
            
          </div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
        </div>

        <div className="flex items-start gap-2">
     
          <div className="h-3.5 w-3.5 bg-gray-200 rounded mt-0.5"></div>
           <div className="h-3 bg-gray-200 rounded flex-1"></div>
        </div>

        <div className="flex items-center justify-between gap-2">
     
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-7 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
