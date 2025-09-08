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
import { Label } from "../../ui/label";

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
          className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-white p-4 md:p-6"
          ref={ref}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">
              {mode === "create" ? "Add New Lead" : "Edit Lead"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {mode === "create"
                ? "Fill in the details to add a new lead"
                : "Update the lead details below"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="name"
                value={customerForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter customer name"
                required
                disabled={isCreatingCustomer}
                className="w-full"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                name="phone"
                value={customerForm.phone}
                onChange={onPhoneChange}
                placeholder="+971 XX XXX XXXX"
                maxLength={17}
                required
                disabled={isCreatingCustomer}
                className="w-full"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </Label>
              <Input
                type="email"
                name="email"
                value={customerForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email"
                disabled={isCreatingCustomer}
                className="w-full"
              />
              {/* Error message */}
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

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isCreatingCustomer}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
              disabled={isCreatingCustomer}
            >
              {isCreatingCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
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