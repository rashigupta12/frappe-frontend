// src/components/CustomerModal.tsx

import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import type { NewCustomerFormData } from "../../../types/inquiryFormdata";
import { capitalizeFirstLetter } from "../../../helpers/helper";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
// import { Label } from "../../ui/label";

interface CustomerModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  customerForm: NewCustomerFormData;
  isCreatingCustomer: boolean;
  onClose: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFormChange: (formData: NewCustomerFormData) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CustomerModal = forwardRef<HTMLDivElement, CustomerModalProps>(
  ({
    isOpen,
    mode,
    customerForm,
    isCreatingCustomer,
    onClose,
    onSave,
    onCancel,
    onFormChange,
    onPhoneChange,
  }, ref) => {
    const handleInputChange = (field: keyof NewCustomerFormData, value: string) => {
      onFormChange({
        ...customerForm,
        [field]: field === 'name' ? capitalizeFirstLetter(value) : value,
      });
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-white p-6 rounded-lg shadow-xl"
          ref={ref}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}
        >
          <DialogHeader className=" border-b border-gray-200 ">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {mode === "create" ? "Add New Lead" : "Edit Lead"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {mode === "create"
                ? "Fill in the details to add a new lead."
                : "Update the lead details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div>
              {/* <Label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </Label> */}
              <Input
                type="text"
                name="name"
                value={customerForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter customer name"
                required
                disabled={isCreatingCustomer}
                className="w-full rounded-md border-gray-300 focus:border-emerald-500 focus-visible:ring-emerald-200"
              />
            </div>

            <div>
              {/* <Label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </Label> */}
              <Input
                type="tel"
                name="phone"
                value={customerForm.phone}
                onChange={onPhoneChange}
                placeholder="+971 XX XXX XXXX"
                maxLength={17}
                required
                disabled={isCreatingCustomer}
                className="w-full rounded-md border-gray-300 focus:border-emerald-500 focus-visible:ring-emerald-200"
              />
            </div>

            <div>
              {/* <Label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </Label> */}
              <Input
                type="email"
                name="email"
                value={customerForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email"
                disabled={isCreatingCustomer}
                className="w-full rounded-md border-gray-300 focus:border-emerald-500 focus-visible:ring-emerald-200"
              />
              {customerForm.email && (
                <>
                  {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email) && (
                    <p className="text-sm text-red-500 mt-1">
                      Must be a valid email format (example: user@example.com)
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isCreatingCustomer}
              className="w-full sm:w-auto px-6 py-2 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto px-6 py-2 rounded-lg transition-colors"
              disabled={isCreatingCustomer}
            >
              {isCreatingCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Saving..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Save"
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);