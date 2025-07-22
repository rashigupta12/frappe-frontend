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

  return (
    <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
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
        
        {/* Building and Property No side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Building Name" value={card.building_name} />
          <Field label="Property No." value={card.property_no} />
        </div>
        
        {/* Area and Project ID side by side */}
        <div className="grid gap-3">
          <Field label="Area" value={card.area} />
          {/* <Field label="Project ID No" value={card.project_id_no} /> */}
        </div>
        
        {/* Start Date and Finish Date side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date" value={fmt(card.start_date)} />
          <Field label="Finish Date" value={fmt(card.finish_date)} />
        </div>
        
        {/* Prepared By and Approved By side by side */}
        {/* <div className="grid grid-cols-2 gap-3">
          <Field label="Prepared By" value={card.prepared_by} />
          <Field label="Approved By" value={card.approved_by} />
        </div> */}
        
        {/* A/C V No full width */}
        {/* <Field
          label="A/C V No & Date"
          value={card.ac_v_no_and_date || 'N/A'}
        /> */}
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
                    {dateFields.includes(c) && fmt && r[c] 
                      ? fmt(r[c])
                      : r[c] ?? '—'
                    }
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