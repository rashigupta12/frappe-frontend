/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { 
  Calendar, 
  CreditCard, 
  User, 
  Building, 
  FileText, 
  DollarSign,
  Hash,
  Download,
  Eye
} from 'lucide-react';
import type { Payment } from './PaymentSummary';

interface Props {
  payment: Payment;
  onClose: () => void;
}

const PaymentDetails: React.FC<Props> = ({ payment, onClose }) => {
  const fmt = (d?: string) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    if (!mode) return <FileText className="h-4 w-4" />;
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes('cash')) return <DollarSign className="h-4 w-4" />;
    if (lowerMode.includes('card')) return <CreditCard className="h-4 w-4" />;
    return <Building className="h-4 w-4" />; // bank
  };

  const getStatusBadge = (docstatus: number) => {
    return docstatus === 1 ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Submitted
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Draft
      </span>
    );
  };

  const handleAttachmentView = (attachment: any) => {
    console.log('View attachment:', attachment);
    // Implement your attachment viewing logic here
  };

  const handleAttachmentDownload = (attachment: any) => {
    console.log('Download attachment:', attachment);
    // Implement your attachment download logic here
  };

  return (
    <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white mx-auto overflow-x-hidden">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl leading-tight flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          Payment Details – {payment.name|| payment.name}
        </DialogTitle>
      </DialogHeader>

      {/* Payment Status and Amount */}
      <div className="flex justify-between items-start mt-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Status</p>
          {getStatusBadge(payment.docstatus)}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Amount</p>
          <p className="text-xl font-bold text-emerald-700">{payment.amountaed || 0} AED</p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-3 mt-4">
        {/* Date and Bill Number */}
        <div className="grid grid-cols-2 gap-3">
          <Field 
            label="Date" 
            value={fmt(payment.date)} 
            icon={<Calendar className="h-4 w-4" />}
          />
          <Field 
            label="Bill Number" 
            value={payment.bill_number} 
            icon={<Hash className="h-4 w-4" />}
          />
        </div>

        {/* Payment From and To */}
        <div className="grid grid-cols-2 gap-3">
          
          <Field 
            label="Paid To" 
            value={payment.paid_to}
            icon={<User className="h-4 w-4" />}
          />
        </div>

        {/* Purpose */}
        <Field 
          label="Purpose of Payment" 
          value={payment.custom_purpose_of_payment}
          icon={<FileText className="h-4 w-4" />}
        />

        {/* Payment Mode */}
        <Field 
          label="Payment Mode" 
          value={payment.custom_mode_of_payment}
          icon={getPaymentModeIcon(payment.custom_mode_of_payment)}
        />

        {/* Conditional fields based on payment mode */}
        {payment.custom_name_of_bank && (
          <Field 
            label="Bank Name" 
            value={payment.custom_name_of_bank}
            icon={<Building className="h-4 w-4" />}
          />
        )}

        {payment.custom_card_number && (
          <Field 
            label="Card Number" 
            value={`****-****-****-${payment.custom_card_number.toString().slice(-4)}`}
            icon={<CreditCard className="h-4 w-4" />}
          />
        )}
      </div>

      {/* Attachments Section */}
      {payment.custom_attachments && payment.custom_attachments.length > 0 && (
        <Section title={`Attachments (${payment.custom_attachments.length})`}>
          <div className="space-y-2">
            {payment.custom_attachments.map((attachment, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {attachment?.file_name || `Attachment ${index + 1}`}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAttachmentView(attachment)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAttachmentDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Payment Summary */}
      <Section title="Payment Summary">
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Total Amount</p>
              <p className="text-lg font-bold text-emerald-800">{payment.amountaed || 0} AED</p>
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Payment Method</p>
              <div className="flex items-center gap-2">
                {getPaymentModeIcon(payment.custom_mode_of_payment)}
                <span className="font-medium text-emerald-800">
                  {payment.custom_mode_of_payment || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <DialogFooter className="mt-6">
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default PaymentDetails;

/* --------------------------------------------------------------------------
   Helper Components
-------------------------------------------------------------------------- */
interface FieldProps {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, value, icon }) => {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="font-medium">{value || 'N/A'}</p>
    </div>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className="mt-6">
      <h3 className="font-semibold text-emerald-700 mb-2">{title}</h3>
      {children}
    </div>
  );
};
