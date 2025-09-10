/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Mail, Phone, User, X } from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";
// import { showToast } from "react-hot-showToast";
import { useAuth } from "../../context/AuthContext";
import { frappeAPI } from "../../api/frappeClient";
import { usePaymentStore } from "../../store/payment";
import PaymentImageUpload from "./imageupload/ImageUpload";
import { useNavigate } from "react-router-dom";
import { capitalizeFirstLetter } from "../../helpers/helper";
import { showToast } from "../../helpers/comman";

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  remarks?: string;
  type: "image" | "pdf" | "doc"; // Changed from optional to required
}

const PaymentForm = () => {
  const user = useAuth();

  const {
    bill_number,
    amountaed,
    paid_by,
    paid_to, // This is now being used in handleSearchChange and form submission
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
  } = usePaymentStore();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showAddSupplierDialog, setShowAddSupplierDialog] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    supplier_name: "",
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

    // Set paid_by to current user's username
    if (user.user?.username && paid_by !== user.user.username) {
      setField("paid_by", user.user.username);
    }
  }, [custom_mode_of_payment, setField, user.user?.username, paid_by]);

  // Sync searchQuery with paid_to from store
  useEffect(() => {
    if (paid_to && paid_to !== searchQuery) {
      setSearchQuery(paid_to);
    }
  }, [paid_to, searchQuery]);

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

  const handleSupplierSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);

    try {
      const endpoint = "/api/method/eits_app.supplier_search.search_suppliers";
      const params = new URLSearchParams();

      if (/^\d+$/.test(query)) {
        // Search by phone number (only digits)
        params.append("mobile_no", query);
      } else if (query.includes("@")) {
        // Search by email (partial match)
        params.append("email_id", query);

        const emailResponse = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `${endpoint}?${params.toString()}`
        );

        // If no email results, try name search
        if (!emailResponse.message.data?.length) {
          params.delete("email_id");
          params.append("supplier_name", query);
        }
      } else {
        // Search by name
        params.append("supplier_name", query);
      }

      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `${endpoint}?${params.toString()}`
      );

      if (!response.message || !Array.isArray(response.message.data)) {
        throw new Error("Invalid response format");
      }

      const suppliers = response.message.data;
      setShowDropdown(true);

      if (suppliers.length === 0) {
        setSearchResults([]);
        return;
      }

      // Filter results to match the query more precisely
      const filteredSuppliers = suppliers.filter(
        (supplier: { email_id: string }) => {
          // For email searches, check if the email contains the query
          if (query.includes("@") && supplier.email_id) {
            return supplier.email_id
              .toLowerCase()
              .includes(query.toLowerCase());
          }
          return true;
        }
      );

      // If we have filtered results, use them instead
      const suppliersToUse =
        filteredSuppliers.length > 0 ? filteredSuppliers : suppliers;

      const detailedSuppliers = await Promise.all(
        suppliersToUse.map(async (supplier: { name: string }) => {
          try {
            const supplierDetails = await frappeAPI.getSupplierById(
              supplier.name
            );
            return supplierDetails.data;
          } catch (error) {
            console.error(
              `Failed to fetch details for supplier ${supplier.name}:`,
              error
            );
            return null;
          }
        })
      );

      const validSuppliers = detailedSuppliers.filter(
        (supplier) => supplier !== null
      );
      setSearchResults(validSuppliers);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Update the handleSearchChange function to reset paid_to when clearing search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear paid_to when search query changes from the selected value
    if (paid_to && query !== paid_to) {
      setField("paid_to", "");
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length > 0) {
      setSearchTimeout(
        setTimeout(() => {
          handleSupplierSearch(query);
        }, 300)
      );
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // Update the dialog close handler to validate supplier
  const handleCloseSupplierDialog = () => {
    setShowAddSupplierDialog(false);
    if (!paid_to) {
      showToast.error("Please select a supplier to proceed with payment");
      setSearchQuery("");
    }
  };

  const handleSupplierSelect = (supplier: any) => {
    const supplierName = supplier.supplier_name || supplier.name || "";
    setField("paid_to", supplierName);
    setSearchQuery(supplierName);
    setShowDropdown(false);
    showToast.success("Supplier selected");
  };

  const handleNewSupplierInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewSupplierData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewSupplier = () => {
    setNewSupplierData({
      supplier_name:
        /^\d+$/.test(searchQuery) || searchQuery.includes("@")
          ? ""
          : searchQuery,
      mobile_no: /^\d+$/.test(searchQuery) ? searchQuery : "",
      email_id: searchQuery.includes("@") ? searchQuery : "",
    });
    setShowAddSupplierDialog(true);
    setShowDropdown(false);
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierData.supplier_name) {
      showToast.error("Supplier name is required");
      return;
    }

    setCreatingSupplier(true);
    try {
      const response = await frappeAPI.createSupplier({
        supplier_name: newSupplierData.supplier_name,
        mobile_no: newSupplierData.mobile_no,
        email_id: newSupplierData.email_id || "",
      });

      if (response.data) {
        showToast.success("Supplier created successfully");
        handleSupplierSelect(response.data);
        setShowAddSupplierDialog(false);
      } else {
        throw new Error("Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      // showToast.error(
      //   error instanceof Error
      //     ? error.message
      //     : "Failed to create supplier. Please try again."
      // );
    } finally {
      setCreatingSupplier(false);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  type PaymentField =
    | "bill_number"
    | "amountaed"
    | "paid_by"
    | "paid_to"
    | "custom_purpose_of_payment"
    | "custom_mode_of_payment"
    | "custom_name_of_bank"
    | "custom_account_number"
    | "custom_card_number"
    | "custom_ifscibanswift_code"
    | "custom_account_holder_name";

  const handleInputChange = (field: PaymentField, value: string) => {
    // Only capitalize if it's a text field (not numbers, emails, etc.)
    const shouldCapitalize = [
      "paid_to",
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
      const response = await uploadAndAddAttachment(file);

      console.log("Upload response:", response);

      // Check if response exists and has the expected structure
      if (!response) {
        throw new Error("No response received from upload function");
      }

      // Handle different response structures
      let fileUrl = "";
      if (response.file_url) {
        fileUrl = response.file_url;
      } else if (response.message?.file_url) {
        fileUrl = response.message.file_url;
      } else if (response.data?.file_url) {
        fileUrl = response.data.file_url;
      } else {
        throw new Error("Unable to determine file URL from response");
      }

      // Ensure proper URL formatting
      if (!fileUrl.startsWith("http") && !fileUrl.startsWith("/")) {
        fileUrl = `/${fileUrl}`;
      }

      // Add cache busting parameter
      const cacheBuster = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const separator = fileUrl.includes("?") ? "&" : "?";
      const finalUrl = `${fileUrl}${separator}t=${cacheBuster}`;

      console.log("Final file URL:", finalUrl);
      return finalUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that paid_to (supplier) is selected
    if (!paid_to || paid_to.trim() === "") {
      showToast.error("Please select a supplier");
      return;
    }

    // Validate amount
    if (amountaed === "" || parseFloat(amountaed) <= 0) {
      showToast.error("Please enter a valid amount");
      return;
    }
    if (custom_purpose_of_payment === "") {
      showToast.error("Please enter a purpose of payment");
      return;
    }

    // Validate at least one image is uploaded
    if (images.length === 0) {
      showToast.error("Please upload at least one payment evidence image");
      return;
    }

    const result = await submitPayment();
    if (result.success) {
      showToast.success("Payment submitted successfully!");
      // Reset form fields
      setField("bill_number", "");
      setField("amountaed", "0.00");
      setField("paid_to", "");
      setField("custom_purpose_of_payment", "");
      setField("custom_mode_of_payment", "");
      setField("custom_name_of_bank", "");
      setField("custom_account_number", "");
      setField("custom_card_number", "");
      setField("custom_attachments", []);
      setImages([]);
      setSearchQuery("");
      isManualImageUpdate.current = false; // Reset flag
    } else {
      console.error("Payment submission failed:", result.error);
    }
    navigate("/accountUser?tab=payment-summary");
  };

  // Then modify your getModeOfPaymentValue function to handle the default case:
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
  // Add this function to handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (e.key === "Backspace" && paid_to && searchQuery === paid_to) {
      // If backspace is pressed and the current value matches the selected supplier, clear it
      setField("paid_to", "");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input.startsWith("+971 ")) {
      setNewSupplierData((prev) => ({ ...prev, mobile_no: "+971 " }));
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

    setNewSupplierData((prev) => ({ ...prev, mobile_no: formattedNumber }));
  };

  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden lg:p-3">
      {/* Header */}
      <div className="bg-emerald-400  px-6 py-4 text-white">
        <h1 className="text-xl md:text-2xl font-semibold">Payment Entry</h1>
        <p className="text-blue-100 text-sm md:text-base">
          Enter payment details
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-4 md:p-6" noValidate>
        <div className="space-y-4 md:space-y-6">
          {/* Payment Evidence Section */}
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Upload Payment Evidence <span className="text-red-500">*</span>
              {/* <span className="block text-xs text-gray-500 mt-1">
                (Supports images, PDF, and Word documents)
              </span> */}
            </label>
            <PaymentImageUpload
              images={images}
              onImagesChange={handleImagesChange}
              onUpload={handleImageUpload}
              maxImages={5}
              maxSizeMB={10}
            />
            {images.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                At least one payment evidence file is required
              </p>
            )}
          </div>

          {/* Grid layout for desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Amount Paid */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Amount Paid <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={amountaed}
                  onChange={(e) =>
                    handleInputChange("amountaed", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md  outline-none"
                  placeholder="0.00"
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
                  />
                </div>
              </>
            )}

            {/* Bill No */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Bill No
              </label>
              <input
                type="text"
                value={bill_number}
                onChange={(e) =>
                  handleInputChange("bill_number", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter Bill No"
              />
            </div>

            {/* Supplier Search */}
            {/* Supplier Search */}
            <div className="relative col-span-1 md:col-span-2">
              <label className="flex items-center space-x-2 text-sm md:text-base font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>
                  Supplier{" "}
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
                  onKeyDown={handleKeyDown}
                  placeholder="Search by Supplier name, phone, or email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setField("paid_to", "");
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
                    searchResults.map((supplier) => (
                      <div
                        key={supplier.name}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        onClick={() => handleSupplierSelect(supplier)}
                      >
                        <div>
                          <p className="font-medium">
                            {supplier.supplier_name || supplier.name}
                          </p>
                          <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                            {supplier.mobile_no && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {supplier.mobile_no}
                              </span>
                            )}
                            {supplier.email_id && (
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {supplier.email_id}
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
                      onClick={handleAddNewSupplier}
                    >
                      <div>
                        <p className="font-medium">
                          No suppliers found for "{searchQuery}"
                        </p>
                        <p className="text-xs text-gray-500">
                          Click to add a new supplier
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
            {/* <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Purpose of Payment<span className="text-red-500">*</span>
            </label> */}
            <textarea
              rows={3}
              value={custom_purpose_of_payment}
              onChange={(e) =>
                handleInputChange("custom_purpose_of_payment", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter Purpose of Payment *"
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
                "Submit Payment"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Add Supplier Dialog */}
      {showAddSupplierDialog && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Supplier</h3>
                <button
                  type="button"
                  onClick={handleCloseSupplierDialog}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name <span className="text-red-500">*</span>
                  </label> */}
                  <input
                    type="text"
                    name="supplier_name"
                    value={newSupplierData.supplier_name}
                    onChange={handleNewSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter supplier name"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    name="mobile_no"
                    value={newSupplierData.mobile_no}
                    onChange={handleNewSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter mobile number"
                  />
                </div> */}
                <div className="space-y-2">
                  {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label> */}
                  <input
                    type="tel"
                    name="mobile_no"
                    value={newSupplierData.mobile_no}
                    onChange={handlePhoneChange}
                    onKeyDown={handleKeyDown}
                    placeholder="+971 XX XXX XXXX"
                    maxLength={17}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email_id"
                    value={newSupplierData.email_id}
                    onChange={handleNewSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter email address"
                  />
                </div> */}

                <div>
                  {/* <label
                    htmlFor="email_id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label> */}
                  <input
                    type="email"
                    name="email_id"
                    value={newSupplierData.email_id || ""}
                    onChange={handleNewSupplierInputChange}
                    placeholder="Enter Supplier Email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {/* Error message */}
                  {newSupplierData.email_id && (
                    <>
                      {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                        newSupplierData.email_id
                      ) && (
                        <p className="text-sm text-red-500 mt-1">
                          Must be a valid email format (example:
                          user@example.com)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseSupplierDialog}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSupplier}
                  disabled={creatingSupplier}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {creatingSupplier ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </span>
                  ) : (
                    "Create Supplier"
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

export default PaymentForm;
