/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Mail, Phone, User, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { frappeAPI } from "../../api/frappeClient";

import PaymentImageUpload from "./imageupload/ImageUpload";
import { useReciptStore } from "../../store/recipt";

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  remarks?: string;
  type: 'image' | 'pdf' | 'doc'; // Changed from optional to required
}

const ReceiptForm = () => {
  const user = useAuth();

  const {
    bill_number,
    amountaed,
    paid_by,
    paid_from, // This is now the customer
    custom_purpose_of_payment,
    custom_mode_of_payment,
    custom_name_of_bank,
    custom_account_number,
    custom_card_number,
    custom_attachments,
    custom_ifscibanswift_code,
    custom_account_holder_name,
    isLoading,
    isUploading,
    error,
    setField,
    uploadAndAddAttachment,
    submitPayment,
  } = useReciptStore();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    customer_name: "",
    mobile_no: "",
    email_id: "",
  });

  useEffect(() => {
    // Set default payment mode to Cash if not already set
    if (!custom_mode_of_payment) {
      setField("custom_mode_of_payment", "Cash");
    }

    // Set paid_by to current user's username (who is receiving the payment)
    if (user.user?.username && paid_by !== user.user.username) {
      setField("paid_by", user.user.username);
    }
  }, [custom_mode_of_payment, setField, user.user?.username, paid_by]);

  // Sync searchQuery with paid_from from store
  useEffect(() => {
    if (paid_from && paid_from !== searchQuery) {
      setSearchQuery(paid_from);
    }
  }, [paid_from, searchQuery]);

  // Convert custom_attachments to images format
useEffect(() => {
  const convertedImages: ImageItem[] = custom_attachments.map(
    (attachment, index) => {
      let url = attachment.image;
      if (!url.startsWith("http") && !url.startsWith("/")) {
        url = `/${url}`;
      }
      
      // Determine file type from URL
      let type: 'image' | 'pdf' | 'doc' = 'image';
      if (url.toLowerCase().endsWith('.pdf')) {
        type = 'pdf';
      } else if (url.toLowerCase().endsWith('.doc') || url.toLowerCase().endsWith('.docx')) {
        type = 'doc';
      }
      
      return {
        id: `existing-${index}-${url}`,
        url: url,
        remarks: attachment.remarks || `Attachment ${index + 1}`,
        type: type
      };
    }
  );
  setImages(convertedImages);
}, [custom_attachments]);

  const handleCustomerSearch = useCallback(async (query: string) => {
     if (!query.trim()) {
       setSearchResults([]);
       setShowDropdown(false);
       return;
     }
 
     setIsSearching(true);
     try {
       const endpoint = "/api/method/eits_app.customer_search.search_customers";
       const params = new URLSearchParams();
 
       if (/^\d+$/.test(query)) {
         // Search by phone number (only digits)
         params.append("mobile_no", query);
       } else if (/^[a-zA-Z0-9._-]+$/.test(query)) {
         // Search by email (partial match) OR name
         // First try email search
         params.append("email_id", query);
         const emailResponse = await frappeAPI.makeAuthenticatedRequest(
           "GET",
           `${endpoint}?${params.toString()}`
         );
 
         // If no email results, try name search
         if (!emailResponse.message.data?.length) {
           params.delete("email_id");
           params.append("customer_name", query);
         }
       } else {
         // Search by name
         params.append("customer_name", query);
       }
 
       const response = await frappeAPI.makeAuthenticatedRequest(
         "GET",
         `${endpoint}?${params.toString()}`
       );
       if (!response.message || !Array.isArray(response.message.data)) {
         throw new Error("Invalid response format");
       }
 
       const customers = response.message.data;
       setShowDropdown(true);
 
       if (customers.length === 0) {
         setSearchResults([]);
         return;
       }
 
       const detailedCustomers = await Promise.all(
         customers.map(async (customer: { name: any }) => {
           try {
             const customerDetails = await frappeAPI.getCustomerById(
               customer.name
             );
             return customerDetails.data;
           } catch (error) {
             console.error(
               `Failed to fetch details for customer ${customer.name}:`,
               error
             );
             return null;
           }
         })
       );
 
       const validCustomers = detailedCustomers.filter(
         (customer) => customer !== null
       );
 
       setSearchResults(validCustomers);
     } catch (error) {
       // Error handling...
       console.error("Search error:", error);
       setSearchResults([]);
       setShowDropdown(true);
       toast.error("Failed to search customers. Please try again.");
     } finally {
       setIsSearching(false);
     }
   }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear paid_from when search query is empty
    if (!query.trim()) {
      setField("paid_from", "");
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length > 0) {
      setSearchTimeout(
        setTimeout(() => {
          handleCustomerSearch(query);
        }, 300)
      );
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleCloseCustomerDialog = () => {
    setShowAddCustomerDialog(false);
    if (!paid_from) {
      toast.error(
        "Please select a customer to proceed with receipt submission"
      );
      setSearchQuery("");
    }
  };

  const handleCustomerSelect = (customer: any) => {
    const customerName = customer.customer_name || customer.name || "";
    setField("paid_from", customerName);
    setSearchQuery(customerName);
    setShowDropdown(false);
    toast.success("Customer selected");
  };

  const handleNewCustomerInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewCustomer = () => {
    setNewCustomerData({
      customer_name:
        /^\d+$/.test(searchQuery) || searchQuery.includes("@")
          ? ""
          : searchQuery,
      mobile_no: /^\d+$/.test(searchQuery) ? searchQuery : "",
      email_id: searchQuery.includes("@") ? searchQuery : "",
    });
    setShowAddCustomerDialog(true);
    setShowDropdown(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.customer_name) {
      toast.error("Customer name is required");
      return;
    }

    setCreatingCustomer(true);
    try {
      const response = await frappeAPI.createCustomer({
        customer_name: newCustomerData.customer_name,
        mobile_no: newCustomerData.mobile_no,
        email_id: newCustomerData.email_id || "",
      });

      if (response.data) {
        toast.success("Customer created successfully");
        handleCustomerSelect(response.data);
        setShowAddCustomerDialog(false);
      } else {
        throw new Error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create customer. Please try again."
      );
    } finally {
      setCreatingCustomer(false);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  type ReceiptField =
    | "bill_number"
    | "amountaed"
    | "paid_by"
    | "paid_from"
    | "custom_purpose_of_payment"
    | "custom_mode_of_payment"
    | "custom_name_of_bank"
    | "custom_account_number"
    | "custom_card_number"
    | "custom_ifscibanswift_code"
    | "custom_account_holder_name";

  const handleInputChange = (field: ReceiptField, value: string) => {
    setField(field, value);
  };

  const handleImagesChange = (newImages: ImageItem[]) => {
    setImages(newImages);
    const convertedAttachments = newImages.map((image) => ({
      image: image.url,
      remarks: image.remarks || "",
    }));
    setField("custom_attachments", convertedAttachments);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      await uploadAndAddAttachment(file);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const latestAttachment =
        custom_attachments[custom_attachments.length - 1];
      let imageUrl = latestAttachment.image;
      if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
        imageUrl = `/${imageUrl}`;
      }
      return imageUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that paid_from (customer) is selected
    if (!paid_from || paid_from.trim() === "") {
      toast.error("Please select a customer");
      return;
    }

    // Validate amount
    if (!amountaed || parseFloat(amountaed) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate at least one image is uploaded
    if (images.length === 0) {
      toast.error("Please upload at least one receipt evidence image");
      return;
    }

    const result = await submitPayment();
    if (result.success) {
      toast.success("Receipt submitted successfully!");
      // Reset form fields
      setField("bill_number", "");
      setField("amountaed", "0.00");
      setField("paid_from", "");
      setField("custom_purpose_of_payment", "");
      setField("custom_mode_of_payment", "");
      setField("custom_name_of_bank", "");
      setField("custom_account_number", "");
      setField("custom_card_number", "");
      setField("custom_attachments", []);
      setImages([]);
      setSearchQuery("");
    } else {
      toast.error(`Error: ${result.error}`);
    }
  };

  const getModeOfPaymentValue = () => {
    switch (custom_mode_of_payment) {
      case "Bank":
        return "bank-transfer";
      case "Credit Card":
        return "card";
      case "Cash":
        return "cash";
      case "Credit":
        return "credit";
      default:
        return "cash"; // Default to cash if not set
    }
  };

  const setModeOfPayment = (value: string) => {
    switch (value) {
      case "bank-transfer":
        setField("custom_mode_of_payment", "Bank");
        break;
      case "card":
        setField("custom_mode_of_payment", "Credit Card");
        break;
      case "cash":
        setField("custom_mode_of_payment", "Cash");
        break;
      case "credit":
        setField("custom_mode_of_payment", "Credit");
        break;
      default:
        setField("custom_mode_of_payment", "");
        break;
    }
  };

  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden lg:p-3">
      {/* Header */}
      <div className="bg-emerald-500  px-6 py-4 text-white">
        <h1 className="text-xl md:text-2xl font-semibold">Receipt Entry</h1>
        <p className="text-blue-100 text-sm md:text-base">
          Enter receipt details
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Payment Evidence Section */}
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Upload Image <span className="text-red-500">*</span>
            </label>
            <PaymentImageUpload
              images={images}
              onImagesChange={handleImagesChange}
              onUpload={handleImageUpload}
              maxImages={5}
              maxSizeMB={10}
            />
            {images.length === 0 && (
              <p className=" text-xs text-red-500">
                At least one receipt evidence image is required
              </p>
            )}
          </div>

          {/* Grid layout for desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Amount Received */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Amount Received <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.01"
                  value={amountaed}
                  onChange={(e) =>
                    handleInputChange("amountaed", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Mode of Payment <span className="text-red-500">*</span>
              </label>
              <select
                value={getModeOfPaymentValue()}
                onChange={(e) => setModeOfPayment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {/* Date */}

            {/* Conditional Fields Based on Payment Mode */}
            {custom_mode_of_payment === "Bank" && (
              <>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={custom_name_of_bank}
                    onChange={(e) =>
                      handleInputChange("custom_name_of_bank", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter Bank Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={custom_account_number}
                    onChange={(e) =>
                      handleInputChange("custom_account_number", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter Account Number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    IFSC/IBAN/SWIFT Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={custom_ifscibanswift_code}
                    onChange={(e) =>
                      handleInputChange(
                        "custom_ifscibanswift_code",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter IFSC/IBAN/SWIFT Code"
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={custom_account_holder_name}
                    onChange={(e) =>
                      handleInputChange(
                        "custom_account_holder_name",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter Account Holder Name"
                  />
                </div>
              </>
            )}

            {custom_mode_of_payment === "Credit Card" && (
              <>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={custom_name_of_bank}
                    onChange={(e) =>
                      handleInputChange("custom_name_of_bank", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter Bank Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Card Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={custom_card_number}
                    onChange={(e) =>
                      handleInputChange("custom_card_number", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter Card Number"
                    required
                  />
                </div>
              </>
            )}

            {/* Bill No */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Bill No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bill_number}
                onChange={(e) =>
                  handleInputChange("bill_number", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter Bill No"
                required
              />
            </div>

            {/* Received By (paid_by) */}
            {/* <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Received By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paid_by}
                onChange={(e) => handleInputChange("paid_by", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Received by"
                required
              />
            </div> */}

            {/* Customer Search (paid_from) */}
            <div className="relative col-span-1 md:col-span-2">
              <label className="flex items-center space-x-2 text-sm md:text-base font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>
                  Customer{" "}
                  <span className="text-gray-500">(name/email/phone)</span>
                  <span className="text-red-500 ml-1">*</span>
                </span>
                {isSearching && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, phone, or email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                  required
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                )}
              </div>
              {showDropdown && (
                <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto mt-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((customer) => (
                      <div
                        key={customer.name}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div>
                          <p className="font-medium">
                            {customer.customer_name || customer.name}
                          </p>
                          <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                            {customer.mobile_no && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {customer.mobile_no}
                              </span>
                            )}
                            {customer.email_id && (
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {customer.email_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Select
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={handleAddNewCustomer}
                    >
                      <div>
                        <p className="font-medium">
                          No customers found for "{searchQuery}"
                        </p>
                        <p className="text-xs text-gray-500">
                          Click to add a new customer
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Add New
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Purpose of Payment (full width) */}
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Purpose of Receipt
            </label>
            <textarea
              rows={3}
              value={custom_purpose_of_payment}
              onChange={(e) =>
                handleInputChange("custom_purpose_of_payment", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter Purpose of Receipt"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="w-full bg-emerald-500  text-white py-3 px-4 rounded-md font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none disabled:opacity-50"
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
                "Submit Receipt"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Add Customer Dialog */}
      {showAddCustomerDialog && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Customer</h3>
                <button
                  onClick={handleCloseCustomerDialog}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={newCustomerData.customer_name}
                    onChange={handleNewCustomerInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    name="mobile_no"
                    value={newCustomerData.mobile_no}
                    onChange={handleNewCustomerInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email_id"
                    value={newCustomerData.email_id}
                    onChange={handleNewCustomerInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseCustomerDialog}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {creatingCustomer ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </span>
                  ) : (
                    "Create Customer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptForm;
