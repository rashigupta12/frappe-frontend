import { Camera, X, Loader2, Eye } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { usePaymentStore } from '../../store/payment';

export default function PaymentEntryForm() {
  const imageUrl= "https://eits.thebigocommunity.org"
  const {
    bill_number,
    amountaed,
    paid_by,
    paid_to,
    custom_purpose_of_payment,
    custom_mode_of_payment,
    custom_name_of_bank,
    custom_account_number,
    custom_card_number,
    custom_attachments,
    suppliers,
    isLoading,
    isUploading,
    error,
    setField,
    uploadAndAddAttachment,
    removeAttachment,
    fetchSuppliers,
    submitPayment,
  } = usePaymentStore();

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  type PaymentField =
    | 'bill_number'
    | 'amountaed'
    | 'paid_by'
    | 'paid_to'
    | 'custom_purpose_of_payment'
    | 'custom_mode_of_payment'
    | 'custom_name_of_bank'
    | 'custom_account_number'
    | 'custom_card_number';

  const handleInputChange = (field: PaymentField, value: string) => {
    setField(field, value);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      for (const file of files) {
        await uploadAndAddAttachment(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitPayment();
    if (result.success) {
      alert('Payment submitted successfully!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const getModeOfPaymentValue = () => {
    switch (custom_mode_of_payment) {
      case 'Bank': return 'bank-transfer';
      case 'Credit Card': return 'card';
      case 'Cash': return 'cash';
      case 'Credit': return 'credit';
      default: return '';
    }
  };

  const setModeOfPayment = (value: string) => {
    switch (value) {
      case 'bank-transfer': setField('custom_mode_of_payment', 'Bank'); break;
      case 'card': setField('custom_mode_of_payment', 'Credit Card'); break;
      case 'cash': setField('custom_mode_of_payment', 'Cash'); break;
      case 'credit': setField('custom_mode_of_payment', 'Credit'); break;
      default: setField('custom_mode_of_payment', ''); break;
    }
  };

  const openImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white">
        <h1 className="text-xl font-semibold">Payment Entry</h1>
        <p className="text-purple-100 text-sm">Enter payment details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Upload Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label htmlFor="image-upload" className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                {isUploading ? (
                  <Loader2 className="mx-auto h-12 w-12 text-purple-500 mb-2 animate-spin" />
                ) : (
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                )}
                <div className="text-blue-600 font-medium">
                  {isUploading ? 'Uploading...' : 'Upload Images'}
                </div>
                <div className="text-gray-500 text-sm">
                  {isUploading ? 'Please wait' : 'Tap to select images'}
                </div>
              </label>
            </div>
            
            {/* Uploaded Images Preview */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Uploaded Images:</p>
              {custom_attachments.length === 0 ? (
                <p className="text-sm text-gray-400">No images uploaded yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {custom_attachments.map((attachment, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                        
                        <img
                          src={`${imageUrl}/${attachment.image}`}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => openImagePreview(attachment.image)}
                          className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors mr-2"
                          title="Preview image"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {custom_attachments.length > 0 && (
                <div className="text-sm text-green-600 mt-2">
                  {custom_attachments.length} image(s) uploaded
                </div>
              )}
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                type="number"
                step="0.01"
                value={amountaed}
                onChange={(e) => handleInputChange('amountaed', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="0.00"
              />
              <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-700 font-medium">
                AED
              </div>
            </div>
          </div>

          {/* Mode of Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode Of Payment
            </label>
            <select
              value={getModeOfPaymentValue()}
              onChange={(e) => setModeOfPayment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Select Mode Of Payment</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          {/* Conditional Fields Based on Payment Mode */}
          {custom_mode_of_payment === 'Bank' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_name_of_bank}
                  onChange={(e) => handleInputChange('custom_name_of_bank', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Enter Bank Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_account_number}
                  onChange={(e) => handleInputChange('custom_account_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Enter Account Number"
                />
              </div>
            </>
          )}

          {custom_mode_of_payment === 'Credit Card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_name_of_bank}
                  onChange={(e) => handleInputChange('custom_name_of_bank', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Enter Bank Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_card_number}
                  onChange={(e) => handleInputChange('custom_card_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Enter Card Number"
                />
              </div>
            </>
          )}

          {/* Bill No */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill No
            </label>
            <input
              type="text"
              value={bill_number}
              onChange={(e) => handleInputChange('bill_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Enter Bill No"
            />
          </div>

          {/* Purpose of Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose of Payment
            </label>
            <textarea
              rows={3}
              value={custom_purpose_of_payment}
              onChange={(e) => handleInputChange('custom_purpose_of_payment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter Purpose of Payment"
            />
          </div>

          {/* Paid to (now a dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid to
            </label>
            <select
              value={paid_to}
              onChange={(e) => handleInputChange('paid_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.value} value={supplier.value}>
                  {supplier.label}
                </option>
              ))}
            </select>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid By
            </label>
            <input
              type="text"
              value={paid_by}
              onChange={(e) => handleInputChange('paid_by', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Enter Paid By"
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isUploading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-md font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 outline-none disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : isUploading ? 'Uploading Images...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}