import React from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Wrench, Calendar, User, MapPin, Building, FileText } from 'lucide-react';
import type { JobCardOther } from '../../context/JobCardOtherContext';

interface Props {
  card: JobCardOther;
  onClose: () => void;
}

const JobCardOtherDetails: React.FC<Props> = ({ card, onClose }) => {
  const fmt = (d?: string) =>
    d ? format(new Date(d), 'MMM dd, yyyy') : 'N/A';

  return (
    <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl leading-tight flex items-center space-x-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <span>Job Card – Other Services</span>
            <p className="text-sm font-normal text-gray-600">
              {card.party_name || card.name}
            </p>
          </div>
        </DialogTitle>
      </DialogHeader>

      {/* Top‐level fields */}
      <div className="space-y-4 mt-6">
        {/* Basic Information Section */}
        <Section title="Basic Information" icon={<User className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date" value={fmt(card.date)} icon={<Calendar className="h-4 w-4 text-gray-400" />} />
            <Field label="Customer Name" value={card.party_name} icon={<User className="h-4 w-4 text-gray-400" />} />
          </div>
        </Section>

        {/* Property Information Section */}
        <Section title="Property Information" icon={<Building className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Building Name" value={card.building_name} />
            <Field label="Property No." value={card.property_no} />
            <Field label="Area" value={card.area} icon={<MapPin className="h-4 w-4 text-gray-400" />} />
            <Field label="Project ID No" value={card.project_id_no} />
          </div>
        </Section>

        {/* Timeline Section */}
        <Section title="Timeline" icon={<Calendar className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date" value={fmt(card.start_date)} />
            <Field label="Finish Date" value={fmt(card.finish_date)} />
          </div>
        </Section>

        {/* Authorization Section */}
        <Section title="Authorization" icon={<User className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prepared By" value={card.prepared_by} />
            <Field label="Approved By" value={card.approved_by} />
          </div>
        </Section>

        {/* Additional Information */}
        <Section title="Additional Information" icon={<FileText className="h-4 w-4" />}>
          <Field
            label="A/C V No & Date"
            value={card.ac_v_no_and_date || 'N/A'}
          />
        </Section>
      </div>

      {/* Services Section */}
      <Section title={`Services (${card.services?.length || 0})`} icon={<Wrench className="h-4 w-4" />}>
        {!card.services || card.services.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No services recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {card.services.map((service, index) => (
              <div key={service.name || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Wrench className="h-4 w-4 mr-2 text-blue-600" />
                      {service.work_type || 'Untitled Service'}
                    </h4>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        <span className="font-medium">Description:</span> {service.work_description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">Start:</span>
                        <span className="ml-1">{fmt(service.start_date)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">Finish:</span>
                        <span className="ml-1">{fmt(service.finish_date)}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">Invoice:</span>
                        <span className="ml-1">{fmt(service.invoice_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <DialogFooter className="mt-8 pt-4 border-t">
        <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
          Close
        </Button>
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
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-2 mb-1">
        {icon}
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className="font-medium text-gray-900">{value || 'N/A'}</p>
    </div>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
          {icon && <span className="text-blue-600">{icon}</span>}
          <span>{title}</span>
        </h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
