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
import type { JobCardOther } from '../../context/JobCardOtherContext';

interface Props {
  card: JobCardOther;
  onClose: () => void;
}

const JobCardOtherDetails: React.FC<Props> = ({ card, onClose }) => {
  const fmt = (d?: string) =>
    d ? format(new Date(d), 'dd/MM/yyyy') : 'N/A';
  // const formatAddress = (building?: string, property?: string, area?: string) => {
  //   return [building, property, area].filter(Boolean).join(", ");
  // };

  return (
    <DialogContent className="max-w-[99vw] sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl leading-tight">
          Job Card – Other Services 
        </DialogTitle>
      </DialogHeader>

      {/* Top‐level fields */}
      <div className="space-y-3 mt-4 capitalize">
        {/* Date and Customer Name side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" value={fmt(card.date)} />
          <Field label="Customer Name" value={card.party_name} />
        </div>

        {/* Address */}
        <Field label="Address" value={ card.area} />

        {/* Start Date and Finish Date side by side */}
        <div className="grid grid-cols-2 gap-3 ">
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
      <table className="w-full text-xs border-collapse border border-gray-300 table-auto"> {/* table-auto allows columns to grow */}
        <colgroup>
          <col className="w-[15%]" /> {/* work_type */}
          <col className="w-[35%]" /> {/* work_description - wider for mobile */}
          <col className="w-[15%]" /> {/* start_date */}
          <col className="w-[15%]" /> {/* finish_date */}
          <col className="w-[10%]" /> {/* price */}
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className="px-1 py-1 text-left font-medium text-gray-700 border border-gray-300 text-xs"
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
                  className={
                    c === 'work_description'
                      ? 'px-2 py-2 border border-gray-300 text-xs align-top break-words whitespace-pre-line max-w-[100px]'
                      : c === 'price'
                        ? 'px-2 py-2 border border-gray-300 text-xs align-top text-right'
                        : 'px-2 py-2 border border-gray-300 text-xs align-top'
                  }
                >
                  {c === 'price' && r[c] 
                    ? `${r[c]} AED`
                    : dateFields.includes(c) && fmt && r[c] 
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
  );
}
