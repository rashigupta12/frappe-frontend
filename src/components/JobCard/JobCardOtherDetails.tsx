// // import React from 'react';
// // import {
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogFooter,
// // } from '../ui/dialog';
// // import { Button } from '../ui/button';
// // import { format } from 'date-fns';
// // import { Wrench, Calendar, User, MapPin, Building, FileText } from 'lucide-react';
// // import type { JobCardOther } from '../../context/JobCardOtherContext';

// // interface Props {
// //   card: JobCardOther;
// //   onClose: () => void;
// // }

// // const JobCardOtherDetails: React.FC<Props> = ({ card, onClose }) => {
// //   const fmt = (d?: string) =>
// //     d ? format(new Date(d), 'MMM dd, yyyy') : 'N/A';

// //   return (
// //     <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
// //       <DialogHeader>
// //         <DialogTitle className="text-lg sm:text-xl leading-tight flex items-center space-x-2">
// //           <div className="bg-blue-100 p-2 rounded-lg">
// //             <Wrench className="h-5 w-5 text-blue-600" />
// //           </div>
// //           <div>
// //             <span>Job Card – Other Services</span>
// //             <p className="text-sm font-normal text-gray-600">
// //               {card.party_name || card.name}
// //             </p>
// //           </div>
// //         </DialogTitle>
// //       </DialogHeader>

// //       {/* Top‐level fields */}
// //       <div className="space-y-4 mt-6">
// //         {/* Basic Information Section */}
// //         <Section title="Basic Information" icon={<User className="h-4 w-4" />}>
// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             <Field label="Date" value={fmt(card.date)} icon={<Calendar className="h-4 w-4 text-gray-400" />} />
// //             <Field label="Customer Name" value={card.party_name} icon={<User className="h-4 w-4 text-gray-400" />} />
// //           </div>
// //         </Section>

// //         {/* Property Information Section */}
// //         <Section title="Property Information" icon={<Building className="h-4 w-4" />}>
// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             <Field label="Building Name" value={card.building_name} />
// //             <Field label="Property No." value={card.property_no} />
// //             <Field label="Area" value={card.area} icon={<MapPin className="h-4 w-4 text-gray-400" />} />
// //             <Field label="Project ID No" value={card.project_id_no} />
// //           </div>
// //         </Section>

// //         {/* Timeline Section */}
// //         <Section title="Timeline" icon={<Calendar className="h-4 w-4" />}>
// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             <Field label="Start Date" value={fmt(card.start_date)} />
// //             <Field label="Finish Date" value={fmt(card.finish_date)} />
// //           </div>
// //         </Section>

// //         {/* Authorization Section */}
// //         <Section title="Authorization" icon={<User className="h-4 w-4" />}>
// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             <Field label="Prepared By" value={card.prepared_by} />
// //             <Field label="Approved By" value={card.approved_by} />
// //           </div>
// //         </Section>

// //         {/* Additional Information */}
// //         <Section title="Additional Information" icon={<FileText className="h-4 w-4" />}>
// //           <Field
// //             label="A/C V No & Date"
// //             value={card.ac_v_no_and_date || 'N/A'}
// //           />
// //         </Section>
// //       </div>

// //       {/* Services Section */}
// //       <Section title={`Services (${card.services?.length || 0})`} icon={<Wrench className="h-4 w-4" />}>
// //         {!card.services || card.services.length === 0 ? (
// //           <div className="text-center py-8 text-gray-500">
// //             <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
// //             <p>No services recorded</p>
// //           </div>
// //         ) : (
// //           <div className="space-y-4">
// //             {card.services.map((service, index) => (
// //               <div key={service.name || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
// //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //                   <div>
// //                     <h4 className="font-medium text-gray-900 mb-2 flex items-center">
// //                       <Wrench className="h-4 w-4 mr-2 text-blue-600" />
// //                       {service.work_type || 'Untitled Service'}
// //                     </h4>
// //                     <div className="text-sm text-gray-600">
// //                       <p className="mb-2">
// //                         <span className="font-medium">Description:</span> {service.work_description || 'No description'}
// //                       </p>
// //                     </div>
// //                   </div>
// //                   <div className="space-y-2">
// //                     <div className="grid grid-cols-1 gap-2 text-sm">
// //                       <div className="flex items-center">
// //                         <Calendar className="h-4 w-4 mr-2 text-gray-400" />
// //                         <span className="font-medium">Start:</span>
// //                         <span className="ml-1">{fmt(service.start_date)}</span>
// //                       </div>
// //                       <div className="flex items-center">
// //                         <Calendar className="h-4 w-4 mr-2 text-gray-400" />
// //                         <span className="font-medium">Finish:</span>
// //                         <span className="ml-1">{fmt(service.finish_date)}</span>
// //                       </div>
// //                       <div className="flex items-center">
// //                         <FileText className="h-4 w-4 mr-2 text-gray-400" />
// //                         <span className="font-medium">Invoice:</span>
// //                         <span className="ml-1">{fmt(service.invoice_date)}</span>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </Section>

// //       <DialogFooter className="mt-8 pt-4 border-t">
// //         <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
// //           Close
// //         </Button>
// //       </DialogFooter>
// //     </DialogContent>
// //   );
// // };

// // export default JobCardOtherDetails;

// // /* --------------------------------------------------------------------------
// //    Helpers
// // -------------------------------------------------------------------------- */
// // function Field({
// //   label,
// //   value,
// //   icon,
// // }: {
// //   label: string;
// //   value?: string;
// //   icon?: React.ReactNode;
// // }) {
// //   return (
// //     <div className="bg-white p-3 rounded-lg border border-gray-200">
// //       <div className="flex items-center space-x-2 mb-1">
// //         {icon}
// //         <p className="text-xs text-gray-500 font-medium">{label}</p>
// //       </div>
// //       <p className="font-medium text-gray-900">{value || 'N/A'}</p>
// //     </div>
// //   );
// // }

// // function Section({
// //   title,
// //   children,
// //   icon,
// // }: {
// //   title: string;
// //   children: React.ReactNode;
// //   icon?: React.ReactNode;
// // }) {
// //   return (
// //     <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
// //       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
// //         <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
// //           {icon && <span className="text-blue-600">{icon}</span>}
// //           <span>{title}</span>
// //         </h3>
// //       </div>
// //       <div className="p-6">
// //         {children}
// //       </div>
// //     </div>
// //   );
// // }



// import React from 'react';
// import {
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '../ui/dialog';
// import { Button } from '../ui/button';
// import { format } from 'date-fns';
// import type { JobCardOther } from '../../context/JobCardOtherContext';

// interface Props {
//   card: JobCardOther;
//   onClose: () => void;
// }

// const JobCardOtherDetails: React.FC<Props> = ({ card, onClose }) => {
//   const fmt = (d?: string) =>
//     d ? format(new Date(d), 'MMM dd, yyyy') : 'N/A';

//   return (
//     <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
//       <DialogHeader>
//         <DialogTitle className="text-lg sm:text-xl leading-tight">
//           Job Card – Other Services – {card.party_name || card.name}
//         </DialogTitle>
//       </DialogHeader>

//       {/* Top‐level fields */}
//       <div className="space-y-3 mt-4">
//         {/* Date and Customer Name side by side */}
//         <div className="grid grid-cols-2 gap-3">
//           <Field label="Date" value={fmt(card.date)} />
//           <Field label="Customer Name" value={card.party_name} />
//         </div>
        
//         {/* Building and Property No side by side */}
//         <div className="grid grid-cols-2 gap-3">
//           <Field label="Building Name" value={card.building_name} />
//           <Field label="Property No." value={card.property_no} />
//         </div>
        
//         {/* Area and Project ID side by side */}
//         <div className="grid gap-3">
//           <Field label="Area" value={card.area} />
//           {/* <Field label="Project ID No" value={card.project_id_no} /> */}
//         </div>
        
//         {/* Start Date and Finish Date side by side */}
//         <div className="grid grid-cols-2 gap-3">
//           <Field label="Start Date" value={fmt(card.start_date)} />
//           <Field label="Finish Date" value={fmt(card.finish_date)} />
//         </div>
        
//         {/* Prepared By and Approved By side by side */}
//         {/* <div className="grid grid-cols-2 gap-3">
//           <Field label="Prepared By" value={card.prepared_by} />
//           <Field label="Approved By" value={card.approved_by} />
//         </div> */}
        
//         {/* A/C V No full width */}
//         {/* <Field
//           label="A/C V No & Date"
//           value={card.ac_v_no_and_date || 'N/A'}
//         /> */}
//       </div>

//       {/* Services Section */}
//       <Section title={`Services (${card.services?.length || 0})`}>
//         {!card.services || card.services.length === 0 ? (
//           <p className="text-sm text-gray-500">None</p>
//         ) : (
//           <ChildTable
//             rows={card.services}
//             cols={[
//               'work_type',
//               'work_description',
//               'start_date',
//               'finish_date',
//               'invoice_date',
//             ]}
//             dateFields={['start_date', 'finish_date', 'invoice_date']}
//             fmt={fmt}
//           />
//         )}
//       </Section>

//       <DialogFooter className="mt-6">
//         <Button onClick={onClose}>Close</Button>
//       </DialogFooter>
//     </DialogContent>
//   );
// };

// export default JobCardOtherDetails;

// /* --------------------------------------------------------------------------
//    Helpers
// -------------------------------------------------------------------------- */
// function Field({
//   label,
//   value,
// }: {
//   label: string;
//   value?: string;
// }) {
//   return (
//     <div>
//       <p className="text-xs text-gray-500">{label}</p>
//       <p className="font-medium">{value || 'N/A'}</p>
//     </div>
//   );
// }

// function Section({
//   title,
//   children,
// }: {
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="mt-6">
//       <h3 className="font-semibold text-emerald-700 mb-2">{title}</h3>
//       {children}
//     </div>
//   );
// }

// function ChildTable({
//   rows,
//   cols,
//   dateFields = [],
//   fmt,
// }: {
//   rows: any[];
//   cols: string[];
//   dateFields?: string[];
//   fmt?: (d?: string) => string;
// }) {
//   return (
//     <div className="w-full">
//       <div className="overflow-x-auto">
//         <table className="w-full text-xs border-collapse border border-gray-300">
//           <thead className="bg-gray-50">
//             <tr>
//               {cols.map((c) => (
//                 <th
//                   key={c}
//                   className="px-2 py-1 text-left font-medium text-gray-700 border border-gray-300 text-xs"
//                 >
//                   {c
//                     .replace(/_/g, ' ')
//                     .replace(/\b\w/g, (l) => l.toUpperCase())}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={i}>
//                 {cols.map((c) => (
//                   <td key={c} className="px-2 py-1 border border-gray-300 text-xs">
//                     {dateFields.includes(c) && fmt && r[c] 
//                       ? fmt(r[c])
//                       : r[c] ?? '—'
//                     }
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


import React from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import type { JobCardOther } from '../../context/JobCardOtherContext';

interface Props {
  card: JobCardOther;
  onClose: () => void;
}

const JobCardOtherDetails: React.FC<Props> = ({ card, onClose }) => {
  const fmt = (d?: string) =>
    d ? format(new Date(d), 'MMM dd, yyyy') : 'N/A';
      const formatAddress = (building: string, property: string, area: string) => {
    return [building, property, area].filter(Boolean).join(", ");
  };

  return (
    <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl leading-tight">
          Job Card – Other Services – {card.party_name || card.name}
        </DialogTitle>
      </DialogHeader>

      {/* Top‐level fields */}
      <div className="space-y-3 mt-4">
        {/* Date and Customer Name side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" value={fmt(card.date)} />
          <Field label="Customer Name" value={card.party_name} />
        </div>

        {/* Address */}
        <Field label="Address" value={formatAddress(card.building_name, card.property_no, card.area)} />

        
        
        {/* Start Date and Finish Date side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date" value={fmt(card.start_date)} />
          <Field label="Finish Date" value={fmt(card.finish_date)} />
        </div>
      </div>

      {/* Services Section */}
      <Section title={`Services (${card.services?.length || 0})`}>
        {!card.services || card.services.length === 0 ? (
          <p className="text-sm text-gray-500">None</p>
        ) : (
          <ChildTable
            rows={card.services}
            cols={[
              'work_type',
              'work_description',
              'start_date',
              'finish_date',
              'price',
            ]}
            dateFields={['start_date', 'finish_date']}
            fmt={fmt}
          />
        )}
      </Section>

      <DialogFooter className="mt-6">
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default JobCardOtherDetails;

/* --------------------------------------------------------------------------
   Helpers
-------------------------------------------------------------------------- */
function Field({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value || 'N/A'}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="font-semibold text-emerald-700 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function ChildTable({
  rows,
  cols,
  dateFields = [],
  fmt,
}: {
  rows: any[];
  cols: string[];
  dateFields?: string[];
  fmt?: (d?: string) => string;
}) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
          <colgroup>
            <col className="w-16 sm:w-20" /> {/* work_type */}
            <col className="w-32 sm:w-48" /> {/* work_description - FIXED WIDTH */}
            <col className="w-20 sm:w-24" /> {/* start_date */}
            <col className="w-20 sm:w-24" /> {/* finish_date */}
            <col className="w-16 sm:w-20" /> {/* price */}
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-1 sm:px-2 py-1 text-left font-medium text-gray-700 border border-gray-300 text-xs"
                >
                  {c === 'price' 
                    ? 'Price (AED)'
                    : c
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                  }
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td 
                    key={c} 
                    className="px-1 sm:px-2 py-1 border border-gray-300 text-xs overflow-hidden"
                  >
                    <div 
                      className={
                        c === 'work_description' 
                          ? 'break-words overflow-wrap-anywhere line-clamp-3 leading-tight' 
                          : ''
                      }
                      title={c === 'work_description' && r[c] ? r[c] : undefined}
                    >
                      {c === 'price' && r[c] 
                        ? `${r[c]} AED`
                        : dateFields.includes(c) && fmt && r[c] 
                          ? fmt(r[c])
                          : r[c] ?? '—'
                      }
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
