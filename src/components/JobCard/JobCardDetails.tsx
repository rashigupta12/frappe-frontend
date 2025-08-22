/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import type { JobCard } from '../../context/JobCardContext';

interface Props {
  card: JobCard;
  onClose: () => void;
}

const JobCardDetails: React.FC<Props> = ({ card, onClose }) => {
  const fmt = (d?: string) =>
    d ? format(new Date(d), 'dd/MM/yyyy') : 'N/A';

  //    const formatAddress = (building: string, property: string, area: string) => {
  //   return [building, property, area].filter(Boolean).join(", ");
  // };
  return (
    <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl leading-tight">
          Job Card 
        </DialogTitle>
      </DialogHeader>

      {/* Top‐level fields */}
      <div className="space-y-3 mt-4">
        {/* Customer and Property No side by side */}
        <div className="grid grid-cols-2 gap-3 capitalize">
          <Field label="Date" value={fmt(card.date)} />
          <Field label="Customer" value={card.party_name} />
          
        </div>
        <Field label="Address" value={card.area} />



        {/* Start Date and Finish Date side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date" value={fmt(card.start_date)} />
          <Field label="Finish Date" value={fmt(card.finish_date)} />
        </div>
        
        {/* Prepared By and Approved By side by side */}
       
        
        {/* Project ID and A/C V No full width */}
        
      </div>

      {/* Child tables */}
      <Section title={`Pressing Charges (${card.pressing_charges.length})`}>
        {card.pressing_charges.length === 0 ? (
          <p className="text-sm text-gray-500">None</p>
        ) : (
          <ChildTable
            rows={card.pressing_charges}
            cols={[
              'work_type',
              'size',
              'thickness',
              'no_of_sides',
              'price',
              'amount',
              
            ]}
          />
        )}
      </Section>

      <Section title={`Material Sold (${card.material_sold.length})`}>
        {card.material_sold.length === 0 ? (
          <p className="text-sm text-gray-500">None</p>
        ) : (
          <ChildTable
            rows={card.material_sold}
            cols={[
              'work_type',
              'size',
              'thickness',
              'no_of_sides',
              'price',
              'amount',
              
            ]}
          />
        )}
      </Section>

      <DialogFooter className="mt-6">
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default JobCardDetails;

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
}: {
  rows: any[];
  cols: string[];
}) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-2 py-1 text-left font-medium text-gray-700 border border-gray-300 text-xs"
                >
                  {c
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1 border border-gray-300 text-xs">
                    {r[c] ?? '—'}
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