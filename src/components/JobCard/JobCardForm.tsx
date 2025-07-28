/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Calendar,
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { frappeAPI } from "../../api/frappeClient";
import {
  useJobCards,
  type JobCard,
  type JobCardFormData,
  type MaterialSold,
  type PressingCharges,
} from "../../context/JobCardContext";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface JobCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
}

interface NewCustomerData {
  customer_name: string;
  mobile_no: string;
  email_id?: string;
}

const JobCardForm: React.FC<JobCardFormProps> = ({
  isOpen,
  onClose,
  jobCard,
}) => {
  const { createJobCard, updateJobCard, loading, fetchEmployees } =
    useJobCards();
  console.log("job card edit form", jobCard);
  const isReadOnly = jobCard?.docstatus === 1;
  const projectidname = jobCard?.name || jobCard?.project_id_no || "";

  const [formData, setFormData] = useState<JobCardFormData>({
    date: new Date().toISOString().split("T")[0],
    building_name: "",
    property_no: "",
    area: "",
    party_name: "",
    start_date: new Date().toISOString().split("T")[0],
    finish_date: "",
    prepared_by: "",
    approved_by: "",
    project_id_no: "",
    ac_v_no_and_date: "",
    pressing_charges: [],
    material_sold: [],
    lead_id: "",
    customer_id: "",
  });

  const [pressingCharges, setPressingCharges] = useState<PressingCharges[]>([]);
  const [materialsSold, setMaterialsSold] = useState<MaterialSold[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
  const [fetchingLeadDetails, setFetchingLeadDetails] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    customer_name: "",
    mobile_no: "",
    email_id: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [isPressingChargesExpanded, setIsPressingChargesExpanded] =
    useState(false);
  const [isMaterialsSoldExpanded, setIsMaterialsSoldExpanded] = useState(false);

  const [materialSoldItems, setMaterialSoldItems] = useState<
    {
      item_name: string;
      name: string;
      valuation_rate?: number;
      size?: string;
      price?: number;
      remarks?: string;
      thickness?: string;
    }[]
  >([]);
  const [loadingMaterialSoldItems, setLoadingMaterialSoldItems] =
    useState(false);

  const [pressingItems, setPressingItems] = useState<
    {
      item_name: string;
      name: string;
      valuation_rate?: number;
      size?: string;
      price?: number;
      remarks?: string;
      thickness?: string;
    }[]
  >([]);
  const [loadingPressingItems, setLoadingPressingItems] = useState(false);

  // Helper functions
  const calculatePressingTotal = (charges: PressingCharges[]) => {
    return charges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  };
  const calculateCombinedTotal = () => {
    const pressingTotal = pressingCharges.reduce(
      (sum, charge) => sum + (charge.amount || 0),
      0
    );
    const materialsTotal = materialsSold.reduce(
      (sum, material) => sum + (material.amount || 0),
      0
    );
    return pressingTotal + materialsTotal;
  };
  useEffect(() => {
    const fetchItems = async () => {
      // Fetch pressing items
      setLoadingPressingItems(true);
      try {
        const response = await frappeAPI.getpressingItem();
        const itemsData = response.data.data || [];

        const formattedItems = itemsData.map((item: any) => ({
          name: item.name,
          item_name: item.item_name || item.name,
          valuation_rate:
            item.valuation_rate !== undefined ? Number(item.valuation_rate) : 0,
        }));

        setPressingItems(formattedItems);
      } catch (error) {
        console.error("Failed to fetch pressing items:", error);
        toast.error("Failed to load pressing items");
      } finally {
        setLoadingPressingItems(false);
      }

      // Fetch material sold items
      setLoadingMaterialSoldItems(true);
      try {
        const response = await frappeAPI.getMaterialSoldItems();
        const itemsData = response.data.data || [];

        const formattedItems = itemsData.map((item: any) => ({
          name: item.name,
          item_name: item.item_name || item.name,
          valuation_rate:
            item.valuation_rate !== undefined ? Number(item.valuation_rate) : 0,
        }));

        setMaterialSoldItems(formattedItems);
      } catch (error) {
        console.error("Failed to fetch material sold items:", error);
        toast.error("Failed to load material sold items");
      } finally {
        setLoadingMaterialSoldItems(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (jobCard?.customer_id) {
        try {
          const customer = await frappeAPI.getCustomerById(jobCard.customer_id);
          setFormData((prev) => ({
            ...prev,
            party_name: customer.data.customer_name || "",
          }));
          setSearchQuery(customer.data.customer_name || "");
        } catch (error) {
          console.error("Failed to fetch customer data:", error);
        }
      }
    };

    fetchCustomerData();
  }, [jobCard?.customer_id]);

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load existing job card data when editing
  useEffect(() => {
    if (jobCard) {
      console.log("Loading job card data:", jobCard); // Debug log
      setFormData({
        date: jobCard.date || new Date().toISOString().split("T")[0],
        building_name: jobCard.building_name || "",
        property_no: jobCard.property_no || "",
        area: jobCard.area || "",
        party_name: jobCard.party_name || "",
        start_date:
          jobCard.start_date || new Date().toISOString().split("T")[0],
        finish_date: jobCard.finish_date || "",
        prepared_by: jobCard.prepared_by || "",
        approved_by: jobCard.approved_by || "",
        project_id_no: jobCard.project_id_no || "",
        ac_v_no_and_date: jobCard.ac_v_no_and_date || "",
        pressing_charges: jobCard.pressing_charges || [],
        material_sold: jobCard.material_sold || [],
        lead_id: jobCard.lead_id || "",
        customer_id: jobCard.customer_id || "",
      });
      setSearchQuery(jobCard.party_name || "");
      setPressingCharges(jobCard.pressing_charges || []);
      setMaterialsSold(jobCard.material_sold || []);

      // If customer_id exists but no lead_id, preserve the property data
      if (jobCard.customer_id && !jobCard.lead_id) {
        setFormData((prev) => ({
          ...prev,
          building_name: jobCard.building_name || "",
          property_no: jobCard.property_no || "",
          area: jobCard.area || "",
        }));
      }
    } else {
      // Reset form for new job card
      setFormData({
        date: new Date().toISOString().split("T")[0],
        building_name: "",
        property_no: "",
        area: "",
        party_name: "",
        start_date: new Date().toISOString().split("T")[0],
        finish_date: "",
        prepared_by: "",
        approved_by: "",
        project_id_no: "",
        ac_v_no_and_date: "",
        pressing_charges: [],
        material_sold: [],
        lead_id: "",
        customer_id: "",
      });
      setSearchQuery("");
      setPressingCharges([]);
      setMaterialsSold([]);
    }
  }, [jobCard]); // Removed isOpen from dependencies

  const handleNewCustomerInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      let response;

      if (/^\d+$/.test(query)) {
        response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.customer_search.search_customers?mobile_no=${query}`
        );
      } else if (query.includes("@")) {
        response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.customer_search.search_customers?email_id=${query}`
        );
      } else {
        response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.customer_search.search_customers?customer_name=${query}`
        );
      }

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

  useEffect(() => {
    if (searchQuery === "") {
      setFormData((prev) => ({
        ...prev,
        customer_id: "",
        lead_id: "",
      }));
    }
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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

  const handleCustomerSelect = async (customer: any) => {
    setFetchingCustomerDetails(true);

    try {
      setFormData((prev) => ({
        ...prev,
        party_name: customer.customer_name || customer.name || "",
        customer_id: customer.name,
      }));

      setSearchQuery(customer.customer_name || customer.name || "");
      setShowDropdown(false);

      if (customer.lead_name) {
        setFetchingLeadDetails(true);
        try {
          const leadResponse = await frappeAPI.getLeadById(customer.lead_name);

          if (leadResponse.data) {
            const lead = leadResponse.data;
            setFormData((prev) => ({
              ...prev,
              building_name: lead.custom_building_name || "",
              property_no:
                lead.custom_bulding__apartment__villa__office_number || "",
              area: lead.custom_property_area || "",
              lead_id: lead.name,
            }));
            toast.success("Customer and property details loaded!");
          }
        } catch (error) {
          console.error("Failed to fetch lead data:", error);
          toast.error("Loaded customer but failed to fetch property details");
        } finally {
          setFetchingLeadDetails(false);
        }
      } else {
        toast.success("Customer loaded (no property details found)");
      }
    } finally {
      setFetchingCustomerDetails(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Pressing Charges functions
  const addPressingCharge = () => {
    const newCharge: PressingCharges = {
      work_type: "",
      size: "",
      thickness: "",
      no_of_sides: "",
      price: 0,
      amount: 0,
      remarks: "",
    };
    setPressingCharges((prev) => [...prev, newCharge]);
  };

  const updatePressingCharge = async (
    index: number,
    field: keyof PressingCharges,
    value: string | number
  ) => {
    if (
      field === "work_type" &&
      typeof value === "string" &&
      value !== "none"
    ) {
      try {
        // Fetch item details from API
        const response = await frappeAPI.getPressingItemDetails(value);
        const itemDetails = response.data.data;

        setPressingCharges((prev) =>
          prev.map((charge, i) => {
            if (i !== index) return charge;

            return {
              ...charge,
              work_type: value,
              size: itemDetails?.size || "",
              price: itemDetails?.price || 0,
              amount:
                (itemDetails?.price || 0) * (Number(charge.no_of_sides) || 0),
              thickness: itemDetails?.thickness || "",
              remarks: itemDetails?.remarks || "",
            };
          })
        );
      } catch (error) {
        console.error("Failed to fetch item details:", error);
        toast.error("Failed to load item details");
        // Fallback to basic item data if API fails
        const selectedItem = pressingItems.find((item) => item.name === value);
        setPressingCharges((prev) =>
          prev.map((charge, i) => {
            if (i !== index) return charge;

            return {
              ...charge,
              work_type: value,
              size: selectedItem?.size || "",
              price: selectedItem?.price || 0,
              amount:
                (selectedItem?.price || 0) * (Number(charge.no_of_sides) || 0),
              thickness: selectedItem?.thickness || "",
              remarks: selectedItem?.remarks || "",
            };
          })
        );
      }
    } else {
      setPressingCharges((prev) =>
        prev.map((charge, i) => {
          if (i !== index) return charge;

          const updatedCharge = { ...charge, [field]: value };

          if (field === "price" || field === "no_of_sides") {
            const price = Number(updatedCharge.price) || 0;
            const sides = Number(updatedCharge.no_of_sides) || 1;
            updatedCharge.amount = price * sides;
          }

          return updatedCharge;
        })
      );
    }
  };

  const removePressingCharge = (index: number) => {
    setPressingCharges((prev) => prev.filter((_, i) => i !== index));
  };

  // Materials Sold functions
  const addMaterialSold = () => {
    const newMaterial: MaterialSold = {
      work_type: "",
      size: "",
      thickness: "",
      no_of_sides: "",
      price: 0,
      amount: 0,
      remarks: "",
    };
    setMaterialsSold((prev) => [...prev, newMaterial]);
  };

  const updateMaterialSold = async (
    index: number,
    field: keyof MaterialSold,
    value: string | number
  ) => {
    if (
      field === "work_type" &&
      typeof value === "string" &&
      value !== "none"
    ) {
      try {
        // Fetch item details from API for material sold
        const response = await frappeAPI.getMaterialSoldItemDetails(value);
        const itemDetails = response.data.data;

        setMaterialsSold((prev) =>
          prev.map((material, i) => {
            if (i !== index) return material;

            return {
              ...material,
              work_type: value,
              size: itemDetails?.size || "",
              price: itemDetails?.price || 0,
              amount:
                (itemDetails?.price || 0) * (Number(material.no_of_sides) || 0),
              thickness: itemDetails?.thickness || "",
              remarks: itemDetails?.remarks || "",
            };
          })
        );
      } catch (error) {
        console.error("Failed to fetch material sold item details:", error);
        toast.error("Failed to load material sold item details");
        // Fallback to basic item data if API fails
        const selectedItem = materialSoldItems.find(
          (item) => item.name === value
        );
        setMaterialsSold((prev) =>
          prev.map((material, i) => {
            if (i !== index) return material;

            return {
              ...material,
              work_type: value,
              size: selectedItem?.size || "",
              price: selectedItem?.price || 0,
              amount:
                (selectedItem?.price || 0) *
                (Number(material.no_of_sides) || 0),
              thickness: selectedItem?.thickness || "",
              remarks: selectedItem?.remarks || "",
            };
          })
        );
      }
    } else {
      setMaterialsSold((prev) =>
        prev.map((material, i) => {
          if (i !== index) return material;

          const updatedMaterial = { ...material, [field]: value };

          if (field === "price" || field === "no_of_sides") {
            const price = Number(updatedMaterial.price) || 0;
            const sides = Number(updatedMaterial.no_of_sides) || 1;
            updatedMaterial.amount = price * sides;
          }

          return updatedMaterial;
        })
      );
    }
  };

  const removeMaterialSold = (index: number) => {
    setMaterialsSold((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    // Basic validation
    if (!formData.party_name) {
      toast.error("Customer name is required");
      return false;
    }
    if (!formData.start_date) {
      toast.error("Start date is required");
      return false;
    }
    if (!formData.finish_date) {
      toast.error("Finish date is required");
      return false;
    }

    // Check if at least one section has entries
    if (pressingCharges.length === 0 && materialsSold.length === 0) {
      toast.error(
        "At least one entry in Pressing Charges or Materials Sold is required"
      );
      return false;
    }

    // Validate pressing charges
    const hasValidPressingCharges =
      pressingCharges.length > 0
        ? pressingCharges.every(
            (charge) =>
              charge.work_type && charge.price !== undefined && charge.price > 0
          )
        : true;

    if (!hasValidPressingCharges && pressingCharges.length > 0) {
      toast.error("All pressing charges must have a work type and valid price");
      return false;
    }

    // Validate materials sold
    const hasValidMaterialsSold =
      materialsSold.length > 0
        ? materialsSold.every(
            (material) =>
              material.work_type &&
              material.price !== undefined &&
              material.price > 0
          )
        : true;

    if (!hasValidMaterialsSold && materialsSold.length > 0) {
      toast.error("All materials sold must have a work type and valid price");
      return false;
    }

    // If both sections have entries but none are valid
    if (
      pressingCharges.length > 0 &&
      materialsSold.length > 0 &&
      !hasValidPressingCharges &&
      !hasValidMaterialsSold
    ) {
      toast.error(
        "Please add valid entries to either Pressing Charges or Materials Sold"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submissionData = {
        doctype: "Job Card -Veneer Pressing",
        date: formData.date,
        party_name: formData.party_name,
        property_no: formData.property_no,
        building_name: formData.building_name,
        area: formData.area,
        start_date: formData.start_date,
        finish_date: formData.finish_date,
        prepared_by: formData.prepared_by || "",
        approved_by: formData.approved_by || "",
        project_id_no: formData.project_id_no || "",
        ac_v_no_and_date: formData.ac_v_no_and_date || "",
        pressing_charges: pressingCharges,
        material_sold: materialsSold,
        customer_id: formData.customer_id || "",
        lead_id: formData.lead_id || "",
        total_amount: calculateCombinedTotal(),
      };

      if (jobCard?.name) {
        await updateJobCard(jobCard.name, submissionData);
      } else {
        await createJobCard(submissionData);
      }

      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  if (!isOpen) return null;

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onClose();
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 sm:inset-4 sm:rounded-xl lg:inset-y-4 lg:right-0 w-full lg:max-w-6xl bg-white shadow-2xl sm:border border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600 p-4 sm:rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2 rounded-lg mt-1">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {jobCard
                    ? isReadOnly
                      ? "View Job Card"
                      : "Edit Job Card"
                    : "New Job Card"}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                  {projectidname && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-100">Project ID:</span>
                      <span className="text-sm font-medium">
                        {projectidname}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white font-medium">
                      Date:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-blue-100 text-sm mt-1">
                  Veneer Pressing Details
                </p>
              </div>
            </div>
            {isReadOnly && (
              <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-white/20 rounded-full">
                Paid
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10 transition-colors"
              onClick={handleCancelClick}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Basic Information
                      </h4>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                        isBasicInfoExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                <div
                  className={`transition-all px-5 duration-300 ease-in-out ${
                    isBasicInfoExpanded
                      ? "opacity-100 max-h-[1500px]"
                      : "opacity-0 max-h-0 overflow-hidden"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                    <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                      <Label
                        htmlFor="party_name"
                        className="flex items-center space-x-2"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <label className="block text-sm font-medium text-gray-700">
                          Customer{" "}
                          <span className="text-gray-500">
                            (name/email/phone)
                          </span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        {(fetchingCustomerDetails || fetchingLeadDetails) && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="party_name"
                          name="party_name"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Search by name, phone, or email"
                          disabled={isReadOnly}
                          required
                          className="focus:ring-blue-500 focus:border-blue-500 pr-10 text-black"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>
                      {showDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
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
                                    {customer.lead_name && (
                                      <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">
                                        Has Property
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

                    <div className="space-y-2">
                      <Label
                        htmlFor="building_name"
                        className="flex items-center space-x-2"
                      >
                        <span>Building Name</span>
                      </Label>
                      <Input
                        id="building_name"
                        name="building_name"
                        value={formData.building_name}
                        onChange={handleInputChange}
                        placeholder="Enter building name"
                        disabled={isReadOnly}
                        className="focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property_no">Property No</Label>
                      <Input
                        id="property_no"
                        name="property_no"
                        value={formData.property_no}
                        onChange={handleInputChange}
                        placeholder="Enter property number"
                        disabled={isReadOnly}
                        className="focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="area"
                        className="flex items-center space-x-2"
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>Area</span>
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="Enter area"
                        disabled={isReadOnly}
                        className="focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 col-span-1 md:col-span-2 lg:col-span-1">
                      <div className="space-y-2 flex-1">
                        <Label
                          htmlFor="start_date"
                          className="flex items-center space-x-1"
                        >
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            Start Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <Input
                          id="start_date"
                          name="start_date"
                          type="date"
                          value={formData.start_date}
                          readOnly
                          disabled={isReadOnly}
                          className="w-full bg-gray-100 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2 flex-1">
                        <Label
                          htmlFor="finish_date"
                          className="flex items-center space-x-1"
                        >
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            Finish Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <Input
                          id="finish_date"
                          name="finish_date"
                          type="date"
                          value={formData.finish_date || ""}
                          onChange={handleInputChange}
                          required
                          disabled={isReadOnly}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-column layout for desktop */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
                {/* Pressing Charges Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                    onClick={() =>
                      setIsPressingChargesExpanded(!isPressingChargesExpanded)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Pressing Charges
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {calculatePressingTotal(pressingCharges).toFixed(2)}{" "}
                          AED
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                            isPressingChargesExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isPressingChargesExpanded
                        ? "opacity-100 max-h-[1500px] overflow-auto"
                        : "opacity-0 max-h-0 overflow-hidden"
                    }`}
                  >
                    <div className="p-4 space-y-4">
                      {pressingCharges.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">
                            No pressing charges added yet. Click "Add Charge" to
                            start.
                          </p>
                        </div>
                      ) : (
                        pressingCharges.map((charge, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="grid grid-cols-1 gap-2">
                              {/* Work Type - Full width */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">
                                  Work Type
                                </Label>
                                {loadingPressingItems ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    <span className="text-sm">
                                      Loading work types...
                                    </span>
                                  </div>
                                ) : (
                                  <Select
                                    value={charge.work_type}
                                    onValueChange={(value) =>
                                      updatePressingCharge(
                                        index,
                                        "work_type",
                                        value
                                      )
                                    }
                                    disabled={isReadOnly}
                                  >
                                    <SelectTrigger className="h-9 text-sm w-full">
                                      <SelectValue placeholder="Select work type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white min-w-[300px]">
                                      {pressingItems.map((item) => (
                                        <SelectItem
                                          key={item.name}
                                          value={item.name}
                                          className="truncate"
                                        >
                                          <span className="truncate">
                                            {item.item_name || item.name}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {/* Size and Thickness - Side by side */}
                              <div className="grid grid-cols-2 gap-1">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Size
                                  </Label>
                                  <Input
                                    placeholder="Size"
                                    value={charge.size}
                                    onChange={(e) =>
                                      updatePressingCharge(
                                        index,
                                        "size",
                                        e.target.value
                                      )
                                    }
                                    disabled={isReadOnly}
                                    className="h-9 text-sm w-full"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Thickness
                                  </Label>
                                  <Input
                                    placeholder="Thickness"
                                    value={charge.thickness}
                                    onChange={(e) =>
                                      updatePressingCharge(
                                        index,
                                        "thickness",
                                        e.target.value
                                      )
                                    }
                                    disabled={isReadOnly}
                                    className="h-9 text-sm w-full"
                                  />
                                </div>
                              </div>

                              {/* No of Sides and Price - Side by side */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    No of Sides
                                  </Label>
                                  <Input
                                    placeholder="No of Sides"
                                    type="number"
                                    min="1"
                                    value={charge.no_of_sides || ""}
                                    onChange={(e) =>
                                      updatePressingCharge(
                                        index,
                                        "no_of_sides",
                                        e.target.value
                                      )
                                    }
                                    disabled={isReadOnly}
                                    className="h-9 text-sm w-full"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Price
                                  </Label>
                                  <div className="flex rounded-md border border-gray-300 overflow-hidden w-full">
                                    <Input
                                      placeholder="0.00"
                                      type="number"
                                      value={charge.price || ""}
                                      onChange={(e) =>
                                        updatePressingCharge(
                                          index,
                                          "price",
                                          e.target.value
                                        )
                                      }
                                      disabled={isReadOnly}
                                      className="h-9 text-sm border-none focus:ring-0 rounded-none flex-1"
                                    />
                                    <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm border-l">
                                      AED
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Remarks - Full width */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">
                                  Remarks
                                </Label>
                                <Input
                                  placeholder="Enter remarks"
                                  value={charge.remarks}
                                  onChange={(e) =>
                                    updatePressingCharge(
                                      index,
                                      "remarks",
                                      e.target.value
                                    )
                                  }
                                  disabled={isReadOnly}
                                  className="h-9 text-sm w-full"
                                />
                              </div>

                              {/* Total and Delete - Full width */}
                              <div className="flex justify-between items-center pt-2">
                                <Label className="text-xs font-medium text-gray-600">
                                  Total Amount: {charge.amount} AED
                                </Label>
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => removePressingCharge(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {!isReadOnly && (
                        <Button
                          type="button"
                          onClick={addPressingCharge}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Charge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Materials Sold Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-purple-100 transition-colors"
                    onClick={() =>
                      setIsMaterialsSoldExpanded(!isMaterialsSoldExpanded)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Materials Sold
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {calculatePressingTotal(materialsSold).toFixed(2)} AED
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                            isMaterialsSoldExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isMaterialsSoldExpanded
                        ? "opacity-100 max-h-[1500px] overflow-auto"
                        : "opacity-0 max-h-0 overflow-hidden"
                    }`}
                  >
                    <div className="p-4 space-y-4">
                      {materialsSold.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">
                            No materials sold added yet. Click "Add Material" to
                            start.
                          </p>
                        </div>
                      ) : (
                        materialsSold.map((material, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="grid grid-cols-1 gap-4">
                              {/* Work Type - Full width */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">
                                  Work Type
                                </Label>
                                {loadingMaterialSoldItems ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    <span className="text-sm">
                                      Loading work types...
                                    </span>
                                  </div>
                                ) : (
                                  <Select
                                    value={material.work_type}
                                    onValueChange={(value) =>
                                      updateMaterialSold(
                                        index,
                                        "work_type",
                                        value
                                      )
                                    }
                                    disabled={isReadOnly}
                                  >
                                    <SelectTrigger className="h-9 text-sm w-full">
                                      <SelectValue placeholder="Select work type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white min-w-[300px]">
                                      {materialSoldItems.map((item) => (
                                        <SelectItem
                                          key={item.name}
                                          value={item.name}
                                          className="truncate"
                                        >
                                          <span className="truncate">
                                            {item.item_name || item.name}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {/* Unit and Qty - Side by side */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Unit
                                  </Label>
                                  <Input
                                    placeholder="Unit"
                                    value={material.size}
                                    onChange={(e) =>
                                      updateMaterialSold(
                                        index,
                                        "size",
                                        e.target.value
                                      )
                                    }
                                    disabled={isReadOnly}
                                    className="h-9 text-sm w-full"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Qty
                                  </Label>
                                  <Input
                                    placeholder="Qty"
                                    type="number"
                                    min="1"
                                    value={material.no_of_sides || ""}
                                    onChange={(e) =>
                                      updateMaterialSold(
                                        index,
                                        "no_of_sides",
                                        e.target.value
                                      )
                                    }
                                    disabled={isReadOnly}
                                    className="h-9 text-sm w-full"
                                  />
                                </div>
                              </div>

                              {/* Price - Full width */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">
                                  Price
                                </Label>
                                <div className="flex rounded-md border border-gray-300 overflow-hidden w-full">
                                  <Input
                                    placeholder="0.00"
                                    type="number"
                                    value={material.price || ""}
                                    onChange={(e) =>
                                      updateMaterialSold(
                                        index,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                    disabled={isReadOnly}
                                    className="h-9 text-sm border-none focus:ring-0 rounded-none flex-1"
                                  />
                                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm border-l">
                                    AED
                                  </span>
                                </div>
                              </div>

                              {/* Total and Delete - Full width */}
                              <div className="flex justify-between items-center pt-2">
                                <Label className="text-xs font-medium text-gray-600">
                                  Total Amount: {material.amount || 0} AED
                                </Label>
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => removeMaterialSold(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {!isReadOnly && (
                        <Button
                          type="button"
                          onClick={addMaterialSold}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Material
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isReadOnly && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelClick}
                      className="px-8 py-3 order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg order-1 sm:order-2"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin h-5 w-5" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-5 w-5" />
                          {jobCard ? "Update Job Card" : "Create Job Card"}
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Any unsaved changes will be lost. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDialogClose}>
              No, keep editing
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleConfirmCancel}
            >
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddCustomerDialog}
        onOpenChange={setShowAddCustomerDialog}
      >
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={newCustomerData.customer_name}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_no">Mobile Number</Label>
              <Input
                id="mobile_no"
                name="mobile_no"
                value={newCustomerData.mobile_no}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter mobile number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_id">Email (Optional)</Label>
              <Input
                id="email_id"
                name="email_id"
                value={newCustomerData.email_id || ""}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter email address"
                type="email"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddCustomerDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer}>
              {creatingCustomer ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {creatingCustomer ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCardForm;
