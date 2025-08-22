/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Mail, Phone, User, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { frappeAPI } from "../../api/frappeClient";

import PaymentImageUpload from "./imageupload/ImageUpload";

import { useNavigate } from "react-router-dom";
import { useReceiptStore } from "../../store/recipt";
import { capitalizeFirstLetter, handleKeyDown } from "../../helpers/helper";

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  remarks?: string;
  type: "image" | "pdf" | "doc";
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
    setField,
    uploadAndAddAttachment,
    submitPayment,
  } = useReceiptStore(); // Fixed store name

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
  const navigate = useNavigate();
  // Add a ref to track if images were manually set to prevent overriding
  const isManualImageUpdate = useRef(false);

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
    // Only sync if paid_from was set programmatically (not from user typing)
    if (paid_from && paid_from !== searchQuery && !showDropdown) {
      setSearchQuery(paid_from);
    }
  }, [paid_from, searchQuery, showDropdown]);

  // Convert custom_attachments to images format
  useEffect(() => {
    // Only update images from store if they weren't manually set
    if (!isManualImageUpdate.current && custom_attachments) {
      const convertedImages: ImageItem[] = custom_attachments
        .map((attachment, index) => {
          if (!attachment.image) return null;

          let url = attachment.image;
          if (
            !url.startsWith("http") &&
            !url.startsWith("/") &&
            !url.startsWith("blob:")
          ) {
            url = `/${url}`;
          }

          // Determine file type from URL
          let type: "image" | "pdf" | "doc" = "image";
          if (url.toLowerCase().endsWith(".pdf")) {
            type = "pdf";
          } else if (
            url.toLowerCase().endsWith(".doc") ||
            url.toLowerCase().endsWith(".docx")
          ) {
            type = "doc";
          }

          return {
            id: `store-${index}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            url: url,
            remarks: attachment.remarks || `Attachment ${index + 1}`,
            type: type,
          };
        })
        .filter(Boolean) as ImageItem[];

      setImages(convertedImages);
    }

    // Reset the manual update flag after processing
    if (isManualImageUpdate.current) {
      const timer = setTimeout(() => {
        isManualImageUpdate.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }
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

      // Search by phone number (only digits)
      if (/^\d+$/.test(query)) {
        params.append("mobile_no", query);
      }
      // Search by email (contains @ symbol)
      else if (query.includes("@")) {
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
      }
      // Search by name
      else {
        params.append("customer_name", query);
      }

      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `${endpoint}?${params.toString()}`
      );

      if (!response.message || !Array.isArray(response.message.data)) {
        throw new Error("Invalid response format");
      }

      let customers = response.message.data;

      // Additional client-side filtering for better email matching
      if (query.includes("@")) {
        customers = customers.filter(
          (customer: { email_id: string }) =>
            customer.email_id &&
            customer.email_id.toLowerCase().includes(query.toLowerCase())
        );
      }

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
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(true);
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
    } else {
      // Update paid_from to match current search query while typing
      setField("paid_from", query);
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

    // Capitalize first letter for customer_name field
    const processedValue =
      name === "customer_name" ? capitalizeFirstLetter(value) : value;

    setNewCustomerData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleAddNewCustomer = () => {
    setNewCustomerData({
      customer_name: capitalizeFirstLetter(
        /^\d+$/.test(searchQuery) || searchQuery.includes("@")
          ? ""
          : searchQuery
      ),
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
    // Only capitalize if it's a text field (not numbers, emails, etc.)
    const shouldCapitalize = [
      "paid_by",
      "custom_name_of_bank",
      "custom_account_holder_name",
      "custom_purpose_of_payment",
      "custom_ifscibanswift_code",
    ].includes(field);

    const processedValue = shouldCapitalize
      ? capitalizeFirstLetter(value)
      : value;
    setField(field, processedValue);
  };

  const handleImagesChange = (newImages: ImageItem[]) => {
    // Set flag to indicate manual image update
    isManualImageUpdate.current = true;

    setImages(newImages);

    // Convert images to attachments format with proper error handling
    const convertedAttachments = newImages
      .map((image, index) => {
        try {
          return {
            image: image.url,
            remarks: image.remarks || `Attachment ${index + 1}`,
          };
        } catch (error) {
          console.error(`Error converting image ${index}:`, error);
          return {
            image: image.url,
            remarks: `Attachment ${index + 1}`,
          };
        }
      })
      .filter(Boolean); // Remove any null/undefined entries

    setField("custom_attachments", convertedAttachments);
  };

  // Fixed handleImageUpload function
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      console.log(
        "Starting upload for file:",
        file.name,
        "Type:",
        file.type,
        "Size:",
        file.size
      );

      // Validate file type before upload
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const validDocTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (
        !validImageTypes.includes(file.type) &&
        !validDocTypes.includes(file.type)
      ) {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Upload the file and get the response
      const uploadResponse = await uploadAndAddAttachment(file);

      console.log("Upload response received:", uploadResponse);

      // Check if upload was successful
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || "Upload failed");
      }

      // The uploadResponse should contain file_url directly
      if (uploadResponse && uploadResponse.file_url) {
        let imageUrl = uploadResponse.file_url;

        // Ensure proper URL formatting
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          imageUrl = `/${imageUrl}`;
        }

        // Add cache busting parameter with current timestamp and random component
        const cacheBuster = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const separator = imageUrl.includes("?") ? "&" : "?";
        const finalUrl = `${imageUrl}${separator}t=${cacheBuster}`;

        console.log("Final image URL:", finalUrl);
        return finalUrl;
      }

      throw new Error("Upload response missing file_url");
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
      navigate("/accountUser?tab=receipt-summary");
    } else {
      console.error("Receipt submission failed:", result.error);
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

const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const input = e.target.value;

  if (!input.startsWith("+971 ")) {
    setNewCustomerData((prev) => ({ ...prev, mobile_no: "+971 " }));
    return;
  }

  const digits = input.replace(/\D/g, "").substring(3);
  const limitedDigits = digits.substring(0, 9);

  let formattedNumber = "+971 ";

  if (limitedDigits.length > 0) {
    const isMobile = limitedDigits.startsWith("5");

    if (isMobile) {
      formattedNumber += limitedDigits.substring(0, 3);
      if (limitedDigits.length > 3) {
        formattedNumber += " " + limitedDigits.substring(3, 6);
        if (limitedDigits.length > 6) {
          formattedNumber += " " + limitedDigits.substring(6, 9);
        }
      }
    } else {
      formattedNumber += limitedDigits.substring(0, 2);
      if (limitedDigits.length > 2) {
        formattedNumber += " " + limitedDigits.substring(2, 5);
        if (limitedDigits.length > 5) {
          formattedNumber += " " + limitedDigits.substring(5, 9);
        }
      }
    }
  }

  setNewCustomerData((prev) => ({ ...prev, mobile_no: formattedNumber }));
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

            {/* Customer Search (paid_from) */}
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
                {/* Add clear button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setField("paid_from", "");
                      setShowDropdown(false);
                    }}
                    className="absolute right-8 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isSearching && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-500" />
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
                    onChange={handlePhoneChange}
                     onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                   
                    placeholder="+971 XX XXX XXXX"
                          maxLength={17}
                          required
                  />
                </div>
                {/* <div>
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
                </div> */}
                <div>
                            <label htmlFor="email_id" className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email_id"
                              value={newCustomerData.email_id || ""}
                              onChange={handleNewCustomerInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter email address"
                            />
                            {/* Error message */}
                            {newCustomerData.email_id && (
                              <>
                                {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerData.email_id) && (
                                  <p className="text-sm text-red-500 mt-1">
                                    Must be a valid email format (example: user@example.com)
                                  </p>
                                )}
                              </>
                            )}
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
