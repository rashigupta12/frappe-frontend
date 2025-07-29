import { Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePaymentStore } from '../../store/payment';
import { toast } from 'react-hot-toast';
import MediaUpload from '../inspection/components/MediaUpload/MediaUpload';
import type { MediaItem } from '../inspection/components/utils/fileUpload';
import SearchableSelect from '../../common/SearchSelect';
const PaymentForm = () => {
  // const baseUrl = "https://eits.thebigocommunity.org";
  const user = useAuth();
  
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

  // Set paid_by to current user's username
  useEffect(() => {
    if (user.user?.username && paid_by !== user.user.username) {
      setField('paid_by', user.user.username);
    }
  }, [user.user?.username, paid_by, setField]);

  // Fetch suppliers on mount
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

const handleMediaUpload = async (newMedia: MediaItem[] | MediaItem | undefined) => {
  console.log('handleMediaUpload called with:', newMedia);
  
  // Handle clearing all media
  if (!newMedia) {
    // Clear all existing attachments
    for (let i = custom_attachments.length - 1; i >= 0; i--) {
      removeAttachment(i);
    }
    return;
  }

  // Convert single MediaItem to array for consistent processing
  const mediaArray = Array.isArray(newMedia) ? newMedia : [newMedia];
  console.log('Processing media array:', mediaArray);
  
  // Process each media item
  for (const mediaItem of mediaArray) {
    try {
      console.log('Processing media item:', mediaItem);
      
      // Check if this is a new upload that needs to be processed
      if (mediaItem.file) {
        console.log('Processing new file upload:', mediaItem.file.name);
        
        // Use the uploadAndAddAttachment function with the File object
        await uploadAndAddAttachment(mediaItem.file);
        console.log('Successfully uploaded and added attachment:', mediaItem.file.name);
      } 
      // Handle existing attachments (already on server)
      else if (mediaItem.url) {
        console.log('Processing existing media item:', mediaItem.url);
        
        // Check if this attachment already exists in custom_attachments
        const existsInAttachments = custom_attachments.some(
          attachment => {
            const normalizedAttachmentUrl = attachment.image.startsWith('/') ? attachment.image : `/${attachment.image}`;
            const normalizedMediaUrl = mediaItem.url.startsWith('/') ? mediaItem.url : `/${mediaItem.url}`;
            return normalizedAttachmentUrl === normalizedMediaUrl;
          }
        );
        
        if (!existsInAttachments) {
          console.log('Adding existing media item to attachments');
          // Directly add the existing item to attachments
          setField('custom_attachments', [
            ...custom_attachments,
            { image: mediaItem.url, remarks: mediaItem.remarks || '' }
          ]);
        }
      }
      
    } catch (error) {
      console.error('Error processing media item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to process ${mediaItem.remarks || 'media item'}: ${errorMessage}`);
    }
  }

  console.log('Current attachments after processing:', custom_attachments);
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitPayment();
    if (result.success) {
      toast.success('Payment submitted successfully!');
      // Reset form fields after successful submission
      setField('bill_number', '');
      setField('amountaed', '0.00');
      setField('paid_by', '');
      setField('paid_to', '');
      setField('custom_purpose_of_payment', '');
      setField('custom_mode_of_payment', '');
      setField('custom_name_of_bank', '');
      setField('custom_account_number', '');
      setField('custom_card_number', '');
      setField('custom_attachments', []);
    } else {
      toast.error(`Error: ${result.error}`);
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

  // const getImageUrl = (imagePath: string) => {
  //   // Handle different URL formats
  //   if (imagePath.startsWith('http')) {
  //     return imagePath;
  //   }
  //   // Remove leading slashes and add baseUrl
  //   const cleanPath = imagePath.replace(/^\/+/, '');
  //   return `${baseUrl}/${cleanPath}`;
  // };

  // const openImagePreview = (imagePath: string) => {
  //   setPreviewImage(getImageUrl(imagePath));
  // };


  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  // Get the label for the selected supplier
  const getSelectedSupplierLabel = () => {
    const selectedSupplier = suppliers.find(supplier => supplier.value === paid_to);
    return selectedSupplier ? selectedSupplier.label : '';
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
        <h1 className="text-xl font-semibold">Payment Entry</h1>
        <p className="text-blue-100 text-sm">Enter payment details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Media Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Evidence <span className="text-red-500">*</span>
            </label>
            <MediaUpload
              label="Upload payment evidence"
              multiple={true}
              allowedTypes={["image"]}
              value={mediaItems}
              onChange={handleMediaUpload}
              maxFiles={5}
              maxSizeMB={10}
            />
            {isUploading && (
              <div className="mt-2 text-sm text-blue-600 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading files...
              </div>
            )}
          </div>


          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700   mb-0">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <div className="flex focus:ring-1">
              <input
                type="number"
                step="0.01"
                value={amountaed}
                onChange={(e) => handleInputChange('amountaed', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-1  focus:border-transparent outline-none"
                placeholder="0.00"
                required
              />
              <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-700 font-medium">
                AED
              </div>
            </div>
          </div>

          {/* Mode of Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700   mb-0">
              Mode Of Payment
            </label>
            <select
              value={getModeOfPaymentValue()}
              onChange={(e) => setModeOfPayment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent outline-none bg-white"
            >
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
                <label className="block text-sm font-medium text-gray-700   mb-0">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_name_of_bank}
                  onChange={(e) => handleInputChange('custom_name_of_bank', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2  -500 focus:border-transparent outline-none"
                  placeholder="Enter Bank Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700   mb-0">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_account_number}
                  onChange={(e) => handleInputChange('custom_account_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2  -500 focus:border-transparent outline-none"
                  placeholder="Enter Account Number"
                  required
                />
              </div>
            </>
          )}

          {custom_mode_of_payment === 'Credit Card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700   mb-0">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_name_of_bank}
                  onChange={(e) => handleInputChange('custom_name_of_bank', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2  -500 focus:border-transparent outline-none"
                  placeholder="Enter Bank Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700   mb-0">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custom_card_number}
                  onChange={(e) => handleInputChange('custom_card_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2  -500 focus:border-transparent outline-none"
                  placeholder="Enter Card Number"
                  required
                />
              </div>
            </>
          )}

          {/* Bill No */}
          <div>
            <label className="block text-sm font-medium text-gray-700   mb-0">
              Bill No
            </label>
            <input
              type="text"
              value={bill_number}
              onChange={(e) => handleInputChange('bill_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2  -500 focus:border-transparent outline-none"
              placeholder="Enter Bill No"
            />
          </div>
 <div>
            <label className="block text-sm font-medium text-gray-700   mb-0">
              Paid to
            </label>
            <SearchableSelect
              options={suppliers}
              value={getSelectedSupplierLabel()}
              onChange={(value) => handleInputChange('paid_to', value)}
              placeholder="Select or search supplier..."
              disabled={isLoading || suppliers.length === 0}
            />
          </div>
          {/* Purpose of Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700   mb-0">
              Purpose of Payment
            </label>
            <textarea
              rows={3}
              value={custom_purpose_of_payment}
              onChange={(e) => handleInputChange('custom_purpose_of_payment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2  -500 focus:border-transparent outline-none resize-none"
              placeholder="Enter Purpose of Payment"
            />
          </div>

          {/* Paid to - Now using SearchableSelect */}
         

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-md font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 focus:ring-2  -500 focus:ring-offset-2 outline-none disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Submitting...
              </span>
            ) : isUploading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Uploading...
              </span>
            ) : (
              'Submit Payment'
            )}
          </button>
        </div>
      </form>

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
};

export default PaymentForm;