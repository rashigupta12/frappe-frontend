import React, { useState } from 'react';
import { Upload, Camera } from 'lucide-react';

export default function PaymentEntryForm() {
  const [formData, setFormData] = useState({
    amountPaid: '0.00',
    currency: 'AED',
    modeOfPayment: '',
    billNo: '',
    purposeOfPayment: '',
    paidTo: ''
  });

  const [uploadedImages, setUploadedImages] = useState([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: { target: { files: Iterable<unknown> | ArrayLike<unknown>; }; }) => {
    const files = Array.from(event.target.files);
    setUploadedImages(prev => [...prev, ...files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    console.log('Uploaded images:', uploadedImages);
    fra
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white">
        <h1 className="text-xl font-semibold">Payment Entry</h1>
        <p className="text-purple-100 text-sm">Enter payment details</p>
      </div>

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
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <div className="text-blue-600 font-medium">Upload Images</div>
                <div className="text-gray-500 text-sm">Tap to select images</div>
              </label>
            </div>
            
            {/* Uploaded Images */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">Uploaded Images:</p>
              {uploadedImages.length === 0 ? (
                <p className="text-sm text-gray-400">No images uploaded yet</p>
              ) : (
                <div className="text-sm text-green-600">
                  {uploadedImages.length} image(s) uploaded
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
                value={formData.amountPaid}
                onChange={(e) => handleInputChange('amountPaid', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="0.00"
              />
              <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-700 font-medium">
                {formData.currency}
              </div>
            </div>
          </div>

          {/* Mode of Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode Of Payment
            </label>
            <select
              value={formData.modeOfPayment}
              onChange={(e) => handleInputChange('modeOfPayment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Select Mode Of Payment</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Payment</option>
            </select>
          </div>

          {/* Bill No */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill No
            </label>
            <input
              type="text"
              value={formData.billNo}
              onChange={(e) => handleInputChange('billNo', e.target.value)}
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
              value={formData.purposeOfPayment}
              onChange={(e) => handleInputChange('purposeOfPayment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter Purpose of Payment"
            />
          </div>

          {/* Paid to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid to
            </label>
            <input
              type="text"
              value={formData.paidTo}
              onChange={(e) => handleInputChange('paidTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Enter Paid to"
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-md font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 outline-none"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}