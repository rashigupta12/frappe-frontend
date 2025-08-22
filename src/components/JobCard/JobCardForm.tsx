/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Calendar,
  ChevronDown,
  FileText,
  Home,
  Loader2,
  Mail,
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
import PropertyAddressSection from "../Inquiry/PropertyAddress";
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
import { handleKeyDown } from "../../helpers/helper";

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

  const isReadOnly = jobCard?.docstatus === 1;
  const projectidname = jobCard?.name || jobCard?.project_id_no || "";

  const [formData, setFormData] = useState<JobCardFormData>({
    date: new Date().toISOString().split("T")[0],
    area: "",
    party_name: "",
    start_date: new Date().toISOString().split("T")[0],
    finish_date: new Date().toISOString().split("T")[0],
    prepared_by: "",
    approved_by: "",
    project_id_no: "",
    ac_v_no_and_date: "",
    pressing_charges: [],
    material_sold: [],
    lead_id: "",
    customer_id: "",
    custom_property_category: "",
    custom_emirate: "",
    custom_uae_area: "",
    custom_community: "",
    custom_street_name: "",
    custom_property_number__name: "",
    custom_property_type: "",
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
  const [materialSoldItems, setMaterialSoldItems] = useState<any[]>([]);
  const [loadingMaterialSoldItems, setLoadingMaterialSoldItems] =
    useState(false);
  const [pressingItems, setPressingItems] = useState<any[]>([]);
  const [loadingPressingItems, setLoadingPressingItems] = useState(false);

  // Helper function for property address section
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Generate combined address when address components change
  useEffect(() => {
    const combinedAddress = [
      formData.custom_emirate,
      formData.custom_uae_area,
      formData.custom_community,
      formData.custom_street_name,
      formData.custom_property_number__name,
      formData.custom_property_type,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    if (combinedAddress && combinedAddress !== formData.area) {
      setFormData((prev) => ({
        ...prev,
        area: combinedAddress,
      }));
    }
  }, [
    formData.custom_emirate,
    formData.custom_uae_area,
    formData.custom_community,
    formData.custom_street_name,
    formData.custom_property_number__name,
    formData.custom_property_type,
    formData.area,
  ]);

  // Helper functions
  // const calculatePressingTotal = (charges: PressingCharges[]) => {
  //   return charges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  // };

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

  useEffect(() => {
    if (formData.start_date && !formData.finish_date) {
      setFormData((prev) => ({
        ...prev,
        finish_date: formData.start_date,
      }));
    }
  }, [formData.start_date, formData.finish_date]);

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load existing job card data when editing
  useEffect(() => {
    if (jobCard) {
      setFormData({
        date: jobCard.date || new Date().toISOString().split("T")[0],
        area: jobCard.area || "",
        party_name: jobCard.party_name || "",
        start_date:
          jobCard.start_date || new Date().toISOString().split("T")[0],
        finish_date:
          jobCard.finish_date || new Date().toISOString().split("T")[0],
        prepared_by: jobCard.prepared_by || "",
        approved_by: jobCard.approved_by || "",
        project_id_no: jobCard.project_id_no || "",
        ac_v_no_and_date: jobCard.ac_v_no_and_date || "",
        pressing_charges: jobCard.pressing_charges || [],
        material_sold: jobCard.material_sold || [],
        lead_id: jobCard.lead_id || "",
        customer_id: jobCard.customer_id || "",
        custom_property_category: jobCard.custom_property_category || "",
        custom_emirate: jobCard.custom_emirate || "",
        custom_uae_area: jobCard.custom_uae_area || "",
        custom_community: jobCard.custom_community || "",
        custom_street_name: jobCard.custom_street_name || "",
        custom_property_number__name:
          jobCard.custom_property_number__name || "",
        custom_property_type: jobCard.custom_property_type || "",
      });

      setSearchQuery(jobCard.party_name || "");
      setPressingCharges(jobCard.pressing_charges || []);
      setMaterialsSold(jobCard.material_sold || []);

      // If customer_id exists, fetch customer details
      if (jobCard.customer_id) {
        fetchCustomerDetails(jobCard.customer_id);
      }
    } else {
      // Reset form for new job card
      setFormData({
        date: new Date().toISOString().split("T")[0],
        area: "",
        party_name: "",
        start_date: new Date().toISOString().split("T")[0],
        finish_date: new Date().toISOString().split("T")[0],
        prepared_by: "",
        approved_by: "",
        project_id_no: "",
        ac_v_no_and_date: "",
        pressing_charges: [],
        material_sold: [],
        lead_id: "",
        customer_id: "",
        custom_property_category: "",
        custom_emirate: "",
        custom_uae_area: "",
        custom_community: "",
        custom_street_name: "",
        custom_property_number__name: "",
        custom_property_type: "",
      });
      setSearchQuery("");
      setPressingCharges([]);
      setMaterialsSold([]);
    }
  }, [jobCard]);

  // Add this helper function
  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const response = await frappeAPI.getCustomerById(customerId);
      const customer = response.data;

      setFormData((prev) => ({
        ...prev,
        party_name: customer.customer_name || "",
      }));
      setSearchQuery(customer.customer_name || "");

      // If customer has associated address, populate those fields
      if (customer.custom_property_address) {
        const address = JSON.parse(customer.custom_property_address);
        setFormData((prev) => ({
          ...prev,
          custom_property_category: address.category || "",
          custom_emirate: address.emirate || "",
          custom_uae_area: address.area || "",
          custom_community: address.community || "",
          custom_street_name: address.street || "",
          custom_property_name__number: address.propertyNumber || "",
          custom_property_type: address.propertyType || "",
          area: address.combined || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch customer details:", error);
    }
  };

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
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.site_address_search.search_site_addresses?search_term=${encodeURIComponent(
          query
        )}`
      );
      console.log("Search response:", response);

      // Check if response structure is correct
      if (!response.message?.data) {
        throw new Error("Invalid response structure");
      }

      const results = response.message.data;

      // Transform the results
      const transformedResults = results.map((result: any) => {
        // Extract customer/lead name from site_name (format: "Name-Number,...")
        const nameFromSite =
          result.site_name?.split("-")[0]?.split(",")[0] || "Unknown";

        return {
          ...result,
          search_type: "address",
          customer_name:
            result.lead_details?.lead_name ||
            result.customer_details?.customer_name ||
            nameFromSite,
          mobile_no:
            result.custom_lead_phone_number ||
            result.lead_details?.mobile_no ||
            result.custom_customer_phone_number ||
            result.customer_details?.mobile_no,
          email_id:
            result.custom_lead_email ||
            result.lead_details?.email_id ||
            result.custom_customer_email ||
            result.customer_details?.email_id,
          name: result.customer_details?.name || result.lead_details?.name,
          lead_name: result.lead_details?.name,
          area: result.site_name,
          address_details: {
            emirate: result.custom_emirate,
            area: result.custom_area,
            community: result.custom_community,
            street_name: result.custom_street_name,
            property_number: result.custom_property_number,
            combined_address: result.site_name,
          },
          match_info: result.match_info,
        };
      });

      setSearchResults(transformedResults);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(false);
      // Only show error if it's not a empty query case
      if (query.trim()) {
        toast.error("Failed to search. Please try again.");
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Updated handleCustomerSelect function for JobCard
  const handleCustomerSelect = async (customer: any) => {
    setFetchingCustomerDetails(true);

    try {
      if (customer.is_new_customer) {
        // Handle new customer
        setFormData((prev) => ({
          ...prev,
          party_name: customer.customer_name,
          customer_id: "",
          lead_id: "",
          area: "",
          custom_property_category: "",
          custom_emirate: "",
          custom_uae_area: "",
          custom_community: "",
          custom_street_name: "",
          custom_property_number__name: "",
          custom_property_type: "",
        }));
        setSearchQuery(customer.customer_name);
      } else {
        // Handle existing customer/lead
        const customerData = {
          party_name:
            customer.customer_name || customer.lead_details?.lead_name || "",
          customer_id: customer.customer_details?.name || "",
          lead_id: customer.lead_details?.name || "",
          area: customer.site_name || "",
          custom_property_category: customer.custom_property_category || "",
          custom_emirate: customer.custom_emirate || "",
          custom_uae_area: customer.custom_area || "",
          custom_community: customer.custom_community || "",
          custom_street_name: customer.custom_street_name || "",
          custom_property_number__name: customer.custom_property_number || "",
          custom_property_type: customer.custom_property_type || "",
        };

        setFormData((prev) => ({
          ...prev,
          ...customerData,
        }));

        setSearchQuery(
          customer.customer_name || customer.lead_details?.lead_name || ""
        );
      }

      setShowDropdown(false);

      // If there's a lead, fetch additional lead details
      if (customer.lead_details?.name && !customer.is_new_customer) {
        setFetchingLeadDetails(true);
        try {
          const leadResponse = await frappeAPI.getLeadById(
            customer.lead_details.name
          );

          if (leadResponse.data) {
            const lead = leadResponse.data;
            setFormData((prev) => ({
              ...prev,
              area: lead.custom_property_area || prev.area,
              lead_id: lead.name,
              custom_property_category:
                lead.custom_property_category || prev.custom_property_category,
              custom_emirate: lead.custom_emirate || prev.custom_emirate,
              custom_uae_area: lead.custom_area || prev.custom_uae_area,
              custom_community: lead.custom_community || prev.custom_community,
              custom_street_name:
                lead.custom_street_name || prev.custom_street_name,
              custom_property_number__name:
                lead.custom_property_number__name ||
                prev.custom_property_number__name,
              custom_property_type:
                lead.custom_property_type || prev.custom_property_type,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch lead data:", error);
        } finally {
          setFetchingLeadDetails(false);
        }
      }
    } finally {
      setFetchingCustomerDetails(false);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === "") {
      setFormData((prev) => ({
        ...prev,
        customer_id: "",
        lead_id: "",
      }));
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
    if (!formData.customer_id && !formData.lead_id) {
      toast.error(
        "Please select a customer to proceed with receipt submission"
      );
      setSearchQuery("");
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
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Pressing Charges functions
  const addPressingCharge = () => {
    const newCharge: PressingCharges = {
      work_type: "",
      size: "",
      thickness: "",
      uom: "mm",
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
              uom: itemDetails?.uom || "",
              remarks: itemDetails?.remarks || "",
            };
          })
        );
      } catch (error) {
        console.error("Failed to fetch item details:", error);

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
              uom: selectedItem?.uom || "",
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
      uom: "mm",
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
              uom: itemDetails?.uom || "",
              remarks: itemDetails?.remarks || "",
            };
          })
        );
      } catch (error) {
        console.error("Failed to fetch material sold item details:", error);
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
              uom: selectedItem?.uom || "",
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
    if (!formData.party_name) {
      toast.error("Customer name is required");
      return false;
    }
    if (!formData.start_date) {
      toast.error("Start date is required");
      return false;
    }

    // Fixed: Check for finish_date and auto-set it to start_date if empty
    const finishDate = formData.finish_date || formData.start_date;
    if (!finishDate) {
      toast.error("Finish date is required");
      return false;
    }

    // Allow same day completion
    if (new Date(finishDate) < new Date(formData.start_date)) {
      toast.error("Finish date cannot be before start date");
      return false;
    }

    if (pressingCharges.length === 0 && materialsSold.length === 0) {
      toast.error(
        "At least one entry in Pressing Charges or Materials Sold is required"
      );
      return false;
    }

    const hasValidPressingCharges =
      pressingCharges.length > 0
        ? pressingCharges.every((charge) => charge.work_type)
        : true;

    if (!hasValidPressingCharges && pressingCharges.length > 0) {
      toast.error("All pressing charges must have a work type and valid price");
      return false;
    }

    const hasValidMaterialsSold =
      materialsSold.length > 0
        ? materialsSold.every((material) => material.work_type)
        : true;

    if (!hasValidMaterialsSold && materialsSold.length > 0) {
      toast.error("All materials sold must have a work type and valid price");
      return false;
    }

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
        custom_property_category: formData.custom_property_category || "",
        custom_emirate: formData.custom_emirate || "",
        custom_uae_area: formData.custom_uae_area || "",
        custom_community: formData.custom_community || "",
        custom_street_name: formData.custom_street_name || "",
        custom_property_number__name:
          formData.custom_property_number__name || "",
        custom_property_type: formData.custom_property_type || "",
      };

      if (jobCard?.name) {
        await updateJobCard(jobCard.name, submissionData);
      } else {
        await createJobCard(submissionData);
      }

      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
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
  const extractCustomerNameFromSite = (siteName: string) => {
    if (!siteName) return "Unknown";
    // Format: "Name-Number,..." - extract everything before the first dash and number
    const parts = siteName.split("-");
    if (parts.length >= 2) {
      // Check if the part after dash starts with a number
      const afterDash = parts[1];
      if (/^\d/.test(afterDash)) {
        return parts[0].trim();
      }
    }
    // Fallback: take first part before comma
    return siteName.split(",")[0].trim();
  };

  // Helper function to extract address from site_name (remove customer name part)
  const extractAddressFromSite = (siteName: string) => {
    if (!siteName) return "";
    // Format: "Name-Number,..." - extract everything after the first dash
    const dashIndex = siteName.indexOf("-");
    if (dashIndex !== -1) {
      const afterDash = siteName.substring(dashIndex + 1);
      // Check if what comes after dash starts with a number (address part)
      if (/^\d/.test(afterDash)) {
        return afterDash.trim();
      }
    }
    // Fallback: return original if pattern doesn't match
    return siteName;
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
        <div className="bg-green-100 shadow-lg text-black transform scale-105 hover:emerald-600 hover:blue-600 p-4 sm:rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className=" p-2 rounded-lg mt-1">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl text-black font-bold">
                  {jobCard
                    ? isReadOnly
                      ? "View Job Card"
                      : "Edit Job Card"
                    : "New Job Card"}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                  {projectidname && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs ">Project ID:</span>
                      <span className="text-sm font-medium">
                        {projectidname}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      Date:
                    </span>
                    
                    <span className="text-sm font-medium">
  {new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}
</span>

                  </div>
                </div>
                {/* <p className="text-blue-100 text-sm mt-1">
                  Veneer Pressing Details
                </p> */}
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
              className="h-8 w-8 p-0 rounded-full text-black hover:bg-white/10 transition-colors"
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
                    <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="flex items-center space-x-2 text-sm md:text-base font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 text-black" />
                        <span className="text-black">
                          Customer{" "}
                          <span className="text-gray-500">
                            (name/email/phone)
                          </span>
                          <span className="text-red-500 ml-1">*</span>
                        </span>
                        {(fetchingCustomerDetails || fetchingLeadDetails) && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </label>
                      <div className="relative capitalize">
                        <Input
                          id="party_name"
                          name="party_name"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Search by name, phone, email or address"
                          disabled={isReadOnly}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10 capitalize"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>

                      {showDropdown && (
                        <>
                          {/* Backdrop to handle clicks outside */}
                          <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setShowDropdown(false)}
                          />

                          {/* Dropdown content with higher z-index */}
                          <div className="absolute z-[9999] mt-1 w-full bg-white shadow-xl rounded-md border border-gray-300 max-h-80 overflow-y-auto pb-40">
                            {searchResults.length > 0 ? (
                              searchResults.map((result, index) => {
                                // Extract customer name properly
                                const customerName =
                                  result.customer_name ||
                                  result.lead_details?.lead_name ||
                                  extractCustomerNameFromSite(result.site_name);

                                return (
                                  <div
                                    key={`search-result-${index}`}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                                    onClick={() => handleCustomerSelect(result)}
                                  >
                                    <div className="flex justify-between items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        {" "}
                                        {/* min-w-0 prevents flex item from overflowing */}
                                        <p className="font-medium text-gray-900 truncate text-sm">
                                          {customerName}
                                        </p>
                                        {/* Contact info */}
                                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                                          {result.mobile_no && (
                                            <span className="inline-flex items-center gap-1">
                                              <Phone className="h-3 w-3 flex-shrink-0" />
                                              <span className="truncate">
                                                {result.mobile_no}
                                              </span>
                                            </span>
                                          )}
                                          {result.email_id && (
                                            <span className="inline-flex items-center gap-1">
                                              <Mail className="h-3 w-3 flex-shrink-0" />
                                              <span className="truncate max-w-[150px]">
                                                {result.email_id}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                        {/* Address info with proper text wrapping */}
                                        {result.site_name && (
                                          <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                                            <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                              <p className="break-words text-xs leading-tight">
                                                {extractAddressFromSite(
                                                  result.site_name
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {/* Match info badges */}
                                        {/* {result.match_info?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.match_info.slice(0, 2).map((match, i) => ( // Limit to 2 badges
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                <span className="truncate max-w-[80px]">
                                  {match.display_name}: {match.value}
                                </span>
                              </span>
                            ))}
                            {result.match_info.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{result.match_info.length - 2} more
                              </span>
                            )}
                          </div>
                        )} */}
                                      </div>

                                      {/* Status badge - fixed width to prevent layout shift */}
                                      {/* <div className="flex-shrink-0 w-16">
                                        {result.lead_details ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            Lead
                                          </span>
                                        ) : result.customer_details ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Customer
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            Address
                                          </span>
                                        )}
                                      </div> */}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors duration-150"
                                onClick={handleAddNewCustomer}
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-700 text-sm">
                                    No results found for "{searchQuery}"
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Click to add a new customer
                                  </p>
                                </div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                  Add New
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Replace the old address section with PropertyAddressSection */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <PropertyAddressSection
                        formData={formData}
                        handleSelectChange={handleSelectChange}
                        fieldNames={{
                          propertyNumber: "custom_property_number__name",
                          emirate: "custom_emirate",
                          area: "custom_uae_area", // This is the individual area field
                          community: "custom_community",
                          streetName: "custom_street_name",
                          propertyArea: "area", // This maps to the actual 'area' field in backend
                          propertyCategory: "custom_property_category",
                          propertyType: "custom_property_type",
                        }}
                      />
                    </div>

                    {/* Date inputs */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 col-span-1 md:col-span-2 lg:col-span-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="start_date"
                          className="flex items-center space-x-1"
                        >
                          <Calendar className="h-4 w-4 text-black" />
                          <span>
                            Start Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="start_date"
                            name="start_date"
                            type="date"
                            value={formData.start_date || ""}
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              const today = new Date()
                                .toISOString()
                                .split("T")[0];

                              // Allow today's date - only prevent past dates
                              if (new Date(selectedDate) < new Date(today)) {
                                toast.error("Start date cannot be in the past");
                                return;
                              }

                              setFormData((prev) => ({
                                ...prev,
                                start_date: selectedDate,
                                // If finish date is the same as start date or earlier, clear it
                                // This allows same-day completion
                                ...(formData.finish_date &&
                                new Date(formData.finish_date) <
                                  new Date(selectedDate)
                                  ? { finish_date: "" }
                                  : {}),
                              }));
                            }}
                            min={new Date().toISOString().split("T")[0]}
                            required
                            disabled={isReadOnly}
                            className="w-full rounded-md border border-gray-300 px-2 py-2  text-md text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                          />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none pl-0" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="finish_date"
                          className="flex items-center space-x-2"
                        >
                          <Calendar className="h-4 w-4 text-black" />
                          <span>
                            Finish Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="finish_date"
                            name="finish_date"
                            type="date"
                            value={
                              formData.finish_date ||
                              formData.start_date ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) => {
                              const selectedDate = e.target.value;

                              // Allow same day completion - only prevent dates before start date
                              if (
                                formData.start_date &&
                                new Date(selectedDate) <
                                  new Date(formData.start_date)
                              ) {
                                toast.error(
                                  "Finish date cannot be before start date"
                                );
                                return;
                              }

                              setFormData((prev) => ({
                                ...prev,
                                finish_date: selectedDate,
                              }));
                            }}
                            min={
                              formData.start_date ||
                              new Date().toISOString().split("T")[0]
                            }
                            required
                            disabled={isReadOnly}
                            className="w-full rounded-md border border-gray-300 px-2 py-2 text-md text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                          />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
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

                              <div className="flex gap-2">
                                <div className="w-[40%] space-y-2">
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

                                <div className="w-[30%] space-y-2">
                                  <Label className="text-xs text-gray-600">
                                    Thickness
                                  </Label>
                                  <div className="flex w-full items-center">
                                    <Input
                                      type="number"
                                      value={charge.thickness}
                                      onChange={(e) =>
                                        updatePressingCharge(
                                          index,
                                          "thickness",
                                          e.target.value
                                        )
                                      }
                                      disabled={isReadOnly}
                                      className="h-9 text-sm w-[70%] rounded-r-none"
                                      
                                    />
                                     <span className="flex items-center justify-center w-[30%] h-9 text-xs text-gray-800 border border-l-0 rounded-r-md bg-white">
  mm
</span>

                                   
                                  </div>
                                </div>

                                <div className="w-[30%] space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Sides
                                  </Label>
                                  <Input
                                    placeholder="Sides"
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
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">
                                  Remarks
                                </Label>
                                <textarea
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
                                  className="min-h-[72px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-end items-end pt-1">
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 "
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
                        {/* <span className="font-medium">
                          {calculatePressingTotal(materialsSold).toFixed(2)} AED
                        </span> */}
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

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-600">
                                    Size
                                  </Label>
                                  <Input
                                    placeholder="Size"
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

                              {/* <div className="space-y-2">
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
                              </div> */}

                              <div className="flex justify-end items-center pt-2">
                                {/* <Label className="text-xs font-medium text-gray-600">
                                  Total Amount: {material.amount || 0} AED
                                </Label> */}
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
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                  <div className="flex flex-row justify-end gap-3 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelClick}
                      className="px-4 py-2 text-sm min-w-[100px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg min-w-[140px]"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin h-4 w-4" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Save className="h-4 w-4" />
                          {jobCard ? "Update" : "Create"}
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
      {/* Add Customer Dialog */}
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
            <button
              onClick={handleCloseCustomerDialog}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className=" space-y-2 capitalize">
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
                className="capitalize"
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="mobile_no">Mobile Number</Label>
              <Input
                id="mobile_no"
                name="mobile_no"
                value={newCustomerData.mobile_no}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter mobile number"
              />
            </div> */}
            <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="tel"
                          name="mobile_no"
                          value={newCustomerData.mobile_no}
                          onChange={handlePhoneChange}
                          onKeyDown={handleKeyDown}
                          placeholder="+971 XX XXX XXXX"
                          maxLength={17}
                          required
                          
                          className="w-full"
                        />
                      </div>
            {/* <div className="space-y-2">
              <Label htmlFor="email_id">Email (Optional)</Label>
              <Input
                id="email_id"
                name="email_id"
                value={newCustomerData.email_id || ""}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter email address"
                type="email"
              />
            </div> */}

             <div>
            <Label htmlFor="email_id">
              Email
            </Label>
            <Input
              type="email_id"
              name="email_id"
              value={newCustomerData.email_id}
              onChange={(e) => {
                const value = e.target.value;
                setNewCustomerData((prev: any) => ({ ...prev, email: value }));
              }}
              placeholder="Enter email"
            
              className="w-full"
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
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCloseCustomerDialog}>
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
