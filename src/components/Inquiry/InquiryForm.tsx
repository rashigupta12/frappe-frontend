/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import {
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Home,
  Loader2,
  Mail,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { frappeAPI } from "../../api/frappeClient";
import { useAuth } from "../../context/AuthContext";
import {
  type Lead,
  type LeadFormData,
  useLeads,
} from "../../context/LeadContext";
import {
  budgetRanges,
  buildingTypes,
  defaultFormData,
  formatSubmissionData,
  propertyTypes,
  type FormSection,
} from "../../helpers/helper";
import { useAssignStore } from "../../store/assign";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "../ui/textarea";
import PropertyAddressSection from "./PropertyAddress";



type PriorityLevel = "Low" | "Medium" | "High";

interface InquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry?: Lead | null;
}


const sections: FormSection[] = [
  {
    id: "contact",
    title: "Customer Details",
    icon: <Phone className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "job",
    title: "Job Details",
    icon: <Home className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "property",
    title: "Property Information",
    icon: <Building className="h-4 w-4" />,
    completed: false,
  },
  // {
  //   id: "inspection",
  //   title: "Date and Time",
  //   icon: <CalendarIcon className="h-4 w-4" />,
  //   completed: false,
  // },
  {
    id: "additional",
    title: "Additional Information",
    icon: <FileText className="h-4 w-4" />,
    completed: true,
  },
  {
    id: "inspector",
    title: "Assign Inspector",
    icon: <User className="h-4 w-4" />,
    completed: false,
  },
];

const InquiryForm: React.FC<InquiryFormProps> = ({
  isOpen,
  onClose,
  inquiry,
}) => {
  const { user } = useAuth();
  const {
    loading,
    createLead,
    updateLead,
    jobTypes,
    fetchJobTypes,
    fetchProjectUrgency,
    projectUrgency,
    utmSource,
    fetchUtmSource,
  } = useLeads();

  const {
    fetchInspectors,
    inspectors,
    inspectorsLoading,
    createTodo,
    createTodoLoading,
    error: assignError,
    success: assignSuccess,
  } = useAssignStore();
  console.log("InquiryForm rendered with inquiry:", inquiry);

  console.log("Inspectors:", inspectors);

  const [activeSection, setActiveSection] = useState<string>("contact");
  const [phoneNumber, setPhoneNumber] = useState("+971 ");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [inspectorEmail, setInspectorEmail] = useState("");
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    ...defaultFormData,
  });
  const [showReferenceInput, setShowReferenceInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    customer_name: "",
    mobile_no: "",
    email_id: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
  const [fetchingLeadDetails, setFetchingLeadDetails] = useState(false);
  const navigate = useNavigate();

  // Update section completion status
  const updatedSections = useMemo(() => {
    return sections.map((section) => {
      switch (section.id) {
        case "contact":
          return {
            ...section,
            completed:
              !!formData.lead_name &&
              !!formData.email_id &&
              !!formData.mobile_no &&
              (!showReferenceInput || !!formData.custom_reference_name),
          };
        case "job":
          return { ...section, completed: !!formData.custom_job_type };
        case "property":
          return {
            ...section,
            completed:
              !!formData.custom_property_type &&
              !!formData.custom_type_of_building,
          };
        // case "inspection":
        //   return {
        //     ...section,
        //     completed:
        //       !!formData.custom_preferred_inspection_date &&
        //       !!formData.custom_preferred_inspection_time,
        //   };
        case "additional":
          return {
            ...section,
            completed:
              !!formData.custom_special_requirements ||
              (!!formData.custom_preferred_inspection_date &&
                !!formData.custom_preferred_inspection_time),
          };
        case "inspector":
          return { ...section, completed: !!inspectorEmail };
        default:
          return section;
      }
    });
  }, [formData, showReferenceInput, inspectorEmail]);

  // Fetch initial data
  useEffect(() => {
    if (!hasFetchedInitialData && isOpen) {
      const fetchData = async () => {
        await fetchJobTypes();
        if (fetchProjectUrgency) await fetchProjectUrgency();
        if (fetchUtmSource) await fetchUtmSource();
        await fetchInspectors();
        setHasFetchedInitialData(true);
      };
      fetchData();
    }
  }, [
    isOpen,
    hasFetchedInitialData,
    fetchJobTypes,
    fetchProjectUrgency,
    fetchUtmSource,
    fetchInspectors,
  ]);
  // Only update if the value actually changed
  // const propertyAreaRef = useRef(propertyArea);

  // useEffect(() => {
  //   // Only update if propertyArea changed externally (not from our own state update)
  //   if (propertyAreaRef.current !== propertyArea && formData.custom_property_area !== propertyArea) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       custom_property_area: propertyArea,
  //     }));
  //   }
  //   propertyAreaRef.current = propertyArea;
  // }, [propertyArea]);

  // Set default values when data is loaded
  // useEffect(() => {
  //   if (hasFetchedInitialData && !inquiry) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       custom_job_type:  "",
  //       custom_project_urgency: projectUrgency[0]?.name || "",
  //       utm_source: utmSource[0]?.name || "",
  //     }));
  //   }
  // }, [hasFetchedInitialData, jobTypes, projectUrgency, utmSource, inquiry]);
  useEffect(() => {
    // Set initial time value if not already set
    if (!formData.custom_preferred_inspection_time) {
      setFormData((prev) => ({
        ...prev,
        custom_preferred_inspection_time: getCurrentTime(),
      }));
    }
  }, []);
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // STEP 3: Update the initialization logic
  useEffect(() => {
    if (inquiry && hasFetchedInitialData) {
      setFormData({
        ...defaultFormData,
        ...inquiry,
        custom_job_type: inquiry.custom_job_type || "",
        custom_project_urgency: inquiry.custom_project_urgency || "",
        utm_source: inquiry.utm_source || "",
        custom_preferred_inspection_date:
          inquiry.custom_preferred_inspection_date
            ? new Date(inquiry.custom_preferred_inspection_date)
            : null,
        custom_alternative_inspection_date:
          inquiry.custom_alternative_inspection_date
            ? new Date(inquiry.custom_alternative_inspection_date)
            : null,
      });
      // Remove setPropertyArea call - use formData.custom_property_area directly
      setPhoneNumber(inquiry.mobile_no || "+971 ");
      setDate(
        inquiry.custom_preferred_inspection_date
          ? new Date(inquiry.custom_preferred_inspection_date)
          : new Date()
      );
      setShowReferenceInput(
        inquiry.utm_source === "Reference" ||
          inquiry.utm_source === "Supplier Reference"
      );
    }
  }, [inquiry, hasFetchedInitialData, jobTypes, projectUrgency, utmSource]);

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setPhoneNumber("+971 ");
    setInspectorEmail("");
    setPriority("Medium");
    setDate(new Date());
    setHasFetchedInitialData(false);
    setShowReferenceInput(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? "" : sectionId);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "utm_source" && { custom_reference_name: "" }),
    }));
    if (name === "utm_source") {
      setShowReferenceInput(
        value === "Reference" || value === "Supplier Reference"
      );
    }
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: date || null }));
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

  const validateForm = (): boolean => {
    if (!formData.lead_name) {
      alert("Name is required");
      return false;
    }
    if (!formData.mobile_no) {
      alert("Mobile number is required");
      return false;
    }
    if (!formData.custom_job_type) {
      alert("Job type is required");
      return false;
    }
    if (
      (formData.utm_source === "Reference" ||
        formData.utm_source === "Supplier Reference") &&
      !formData.custom_reference_name
    ) {
      alert("Reference name is required");
      return false;
    }
    return true;
  };

  const saveLead = async (): Promise<string | undefined> => {
    try {
      const submissionData = formatSubmissionData(formData);

      if (inquiry?.name) {
        await updateLead(inquiry.name, submissionData);
        toast.success("Inquiry updated successfully!");
        return inquiry.name;
      } else {
        const newInquiry = await createLead(submissionData);
        toast.success("Inquiry created successfully!");
        return newInquiry.name;
      }
    } catch (err) {
      console.error("Error saving lead:", err);
      toast.error("Failed to save inquiry. Please try again.");
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await saveLead();
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error("Failed to create inquiry. Please try again.");
    }
  };

  const handleAssignAndSave = async () => {
    if (!validateForm()) return;

    if (!inspectorEmail) {
      toast.error("Please select an inspector");
      return;
    }

    if (!date) {
      toast.error("Please select an inspection date");
      return;
    }

    try {
      // 1. Save Lead

      const inquiryName = await saveLead();
      if (!inquiryName) {
        toast.error("Failed to save inquiry");
        return;
      }

      // 2. Create ToDo
      const preferredDate = format(date, "yyyy-MM-dd");
      console.log("Creating ToDo with data:", {
        inquiry_id: inquiryName,
        inspector_email: inspectorEmail,
        preferred_date: preferredDate,
        priority,
        description: formData.custom_special_requirements || "",
      });

      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiryName,
        inspector_email: inspectorEmail,
        description: formData.custom_special_requirements || "",
        priority: priority,
        preferred_date: preferredDate,
      });

      console.log("ToDo created successfully");
      toast.success("Inspector assigned successfully!");
      navigate("/sales?tab=assign");
      onClose();
    } catch (error) {
      console.error("Full error in assignment process:", error);
      toast.error(
        `Failed to complete assignment: ${
          error && typeof error === "object" && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`
      );
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        lead_name: customer.customer_name || customer.name || "",
        email_id: customer.email_id || "",
        mobile_no: customer.mobile_no || "+971 ",
        customer_id: customer.name,
      }));

      setSearchQuery(customer.customer_name || customer.name || "");
      setShowDropdown(false);

      if (customer.lead_name) {
        setFetchingLeadDetails(true);
        try {
          const leadResponse = await frappeAPI.getLeadById(customer.lead_name);
          console.log("leadResponse", leadResponse);

          if (leadResponse.data) {
            const lead = leadResponse.data;
            setFormData((prev) => ({
              ...prev,
              custom_building_name: lead.custom_building_name || "",
              custom_bulding__apartment__villa__office_number:
                lead.custom_bulding__apartment__villa__office_number || "",
              custom_property_area: lead.custom_property_area || "",
              lead_id: lead.name,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch lead data:", error);
          toast.error("Loaded customer but failed to fetch property details");
        } finally {
          setFetchingLeadDetails(false);
        }
      }
    } finally {
      setFetchingCustomerDetails(false);
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

  useEffect(() => {
    if (inquiry?.lead_name) {
      const fetchCustomerData = async () => {
        try {
          const customer = await frappeAPI.getCustomerById(inquiry.lead_name);
          setFormData((prev) => ({
            ...prev,
            lead_name: customer.data.customer_name || "",
          }));
          setSearchQuery(customer.data.customer_name || "");
        } catch (error) {
          console.error("Failed to fetch customer data:", error);
        }
      };

      fetchCustomerData();
    }
  }, [inquiry?.lead_name]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [8, 9, 13, 16, 17, 18, 20, 27, 35, 36, 37, 38, 39, 40, 45, 46].includes(
        e.keyCode
      )
    ) {
      return;
    }

    const input = e.currentTarget;
    if (input.selectionStart && input.selectionStart < 5) {
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      <div
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex flex-col h-full">
          <div className="bg-emerald-600  p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {inquiry ? "Edit Inquiry" : "New Inquiry"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {updatedSections.map((section) => (
                <Section
                  key={section.id}
                  section={section}
                  activeSection={activeSection}
                  toggleSection={toggleSection}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                  handleDateChange={handleDateChange}
                  handlePhoneChange={handlePhoneChange}
                  phoneNumber={phoneNumber}
                  jobTypes={jobTypes}
                  projectUrgency={projectUrgency}
                  utmSource={utmSource}
                  inspectors={inspectors}
                  inspectorsLoading={inspectorsLoading}
                  assignError={assignError}
                  assignSuccess={assignSuccess}
                  date={date}
                  priority={priority}
                  setDate={setDate}
                  setPriority={setPriority}
                  inspectorEmail={inspectorEmail}
                  setInspectorEmail={setInspectorEmail}
                  handleAssignAndSave={handleAssignAndSave}
                  createTodoLoading={createTodoLoading}
                  loading={loading}
                  showReferenceInput={showReferenceInput}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  showDropdown={showDropdown}
                  isSearching={isSearching}
                  handleSearchChange={handleSearchChange}
                  handleCustomerSelect={handleCustomerSelect}
                  handleAddNewCustomer={handleAddNewCustomer}
                  fetchingCustomerDetails={fetchingCustomerDetails}
                  fetchingLeadDetails={fetchingLeadDetails}
                />
              ))}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-white">
                      <Save className="h-4 w-4" />
                      {inquiry ? "Update" : "Create"} Inquiry
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
              <Label htmlFor="mobile_no">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                id="mobile_no"
                name="mobile_no"
                value={newCustomerData.mobile_no || "+971 "}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                placeholder="+971 XX XXX XXXX"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={17}
                required
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

// Extracted Section component for better organization
interface SectionProps {
  section: FormSection;
  activeSection: string;
  toggleSection: (sectionId: string) => void;
  formData: LeadFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleDateChange: (name: string, date: Date | undefined) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  phoneNumber: string;
  jobTypes: { name: string }[];
  projectUrgency: { name: string }[];
  utmSource: { name: string }[];
  inspectors: {
    full_name?: string | null;
    name: string;
  }[];
  inspectorsLoading: boolean;
  assignError: string | null;
  assignSuccess: boolean;
  date: Date | undefined;
  priority: PriorityLevel;
  setDate: (date: Date | undefined) => void;
  setPriority: (priority: PriorityLevel) => void;
  inspectorEmail: string;
  setInspectorEmail: (email: string) => void;
  handleAssignAndSave: () => Promise<void>;
  createTodoLoading: boolean;
  loading: boolean;
  showReferenceInput: boolean;
  searchQuery: string;
  searchResults: any[];
  showDropdown: boolean;
  isSearching: boolean;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCustomerSelect: (customer: any) => void;
  handleAddNewCustomer: () => void;
  fetchingCustomerDetails: boolean;
  fetchingLeadDetails: boolean;
}

const Section: React.FC<SectionProps> = ({
  section,
  activeSection,
  toggleSection,
  formData,
  handleInputChange,
  handleSelectChange,
  handleDateChange,
  handlePhoneChange,
  phoneNumber,
  jobTypes,
  projectUrgency,
  utmSource,
  inspectors,
  inspectorsLoading,
  assignError,
  assignSuccess,
  date,
  priority,
  setDate,
  setPriority,
  inspectorEmail,
  setInspectorEmail,
  handleAssignAndSave,
  createTodoLoading,
  loading,
  showReferenceInput,
  searchQuery,
  searchResults,
  showDropdown,
  isSearching,
  handleSearchChange,
  handleCustomerSelect,
  handleAddNewCustomer,
  fetchingCustomerDetails,
  fetchingLeadDetails,
}) => {
  // console.log("propertyArea:", getPropertyArea);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [8, 9, 13, 16, 17, 18, 20, 27, 35, 36, 37, 38, 39, 40, 45, 46].includes(
        e.keyCode
      )
    ) {
      return;
    }

    const input = e.currentTarget;
    if (input.selectionStart && input.selectionStart < 5) {
      e.preventDefault();
    }
  };
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className={`w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors ${
          activeSection === section.id ? "bg-gray-50" : ""
        }`}
        onClick={() => toggleSection(section.id)}
      >
        <div className="flex items-center gap-3">
          {section.icon}
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
            {section.title}
          </h4>
          {section.completed && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
        </div>
        {activeSection === section.id ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          activeSection === section.id
            ? "max-h-[1000px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 pt-2 space-y-4">
          {section.id === "contact" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-3 relative">
                {" "}
                {/* Added relative here */}
                <Label
                  htmlFor="customer_search"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">
                    Customer{" "}
                    <span className="text-gray-500">(name/email/phone)</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {(fetchingCustomerDetails || fetchingLeadDetails) && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="customer_search"
                    name="customer_search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by name, phone, or email"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 pr-10 text-black w-full"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                  )}
                </div>
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                    {" "}
                    {/* Changed to overflow-y-auto */}
                    {searchResults.length > 0 ? (
                      searchResults.map((customer) => (
                        <div
                          key={customer.name}
                          className="px-4 pt-2  hover:bg-gray-100 cursor-pointer flex items-center min-w-0"
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="min-w-0 overflow-hidden flex-1">
                            {" "}
                            {/* Added flex-1 */}
                            <p className="font-medium truncate">
                              {customer.customer_name || customer.name}
                            </p>
                            <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2 mt-1">
                              {" "}
                              {/* Changed to column on mobile */}
                              {customer.mobile_no && (
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">
                                    {customer.mobile_no}
                                  </span>
                                </span>
                              )}
                              {customer.email_id && (
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">
                                    {customer.email_id}
                                  </span>
                                </span>
                              )}
                              {customer.lead_name && (
                                <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs inline-flex items-center mt-1 sm:mt-0">
                                  Has Property
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0 ml-2">
                            Select
                          </span>
                        </div>
                      ))
                    ) : (
                      <div
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-w-0"
                        onClick={handleAddNewCustomer}
                      >
                        <div className="min-w-0 overflow-hidden">
                          <p className="font-medium truncate">
                            No customers found for "{searchQuery}"
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            Click to add a new customer
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
                          Add New
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.lead_name && (
                <>
                  {/* <div>
                    <label
                      htmlFor="lead_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="lead_name"
                      name="lead_name"
                      value={formData.lead_name || ""}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter Name"
                    />
                  </div> */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                      <span className="text-red-500"> *</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="mobile_no"
                      value={formData.mobile_no || phoneNumber}
                      onChange={handlePhoneChange}
                      onKeyDown={handleKeyDown}
                      placeholder="+971 XX XXX XXXX"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      maxLength={17}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <Input
                      type="email"
                      id="email_id"
                      name="email_id"
                      value={formData.email_id || ""}
                      onChange={handleInputChange}
                      placeholder="Enter Email"
                    />
                  </div>
                </>
              )}
              <div>
                <label
                  htmlFor="utm_source"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Source Of Inquiry <span className="text-red-500">*</span>
                </label>

                <Select
                  value={formData.utm_source || ""}
                  onValueChange={(value) => {
                    handleSelectChange("utm_source", value);
                  }}
                >
                  <SelectTrigger
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="utm_source"
                  >
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>

                  <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {[...utmSource]
                      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
                      .map((utms) => (
                        <SelectItem
                          key={utms.name}
                          value={utms.name}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                        >
                          {utms.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {showReferenceInput && (
                  <div className="mt-4">
                    <label
                      htmlFor="custom_reference_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Reference Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="custom_reference_name"
                      name="custom_reference_name"
                      value={formData.custom_reference_name || ""}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter reference name"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {section.id === "job" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="custom_job_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Job Type <span className="text-red-500">*</span>
                </label>

                <Select
                  value={formData.custom_job_type || ""}
                  onValueChange={(value) =>
                    handleSelectChange("custom_job_type", value)
                  }
                >
                  <SelectTrigger
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="custom_job_type"
                  >
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>

                  <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {jobTypes.map((jobType) => (
                      <SelectItem
                        key={jobType.name}
                        value={jobType.name}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                      >
                        {jobType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="custom_budget_range"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Budget Range
                </label>

                <Select
                  value={formData.custom_budget_range || ""}
                  onValueChange={(value) =>
                    handleSelectChange("custom_budget_range", value)
                  }
                >
                  <SelectTrigger
                    id="custom_budget_range"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>

                  <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {budgetRanges.map((range) => (
                      <SelectItem
                        key={range}
                        value={range}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                      >
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Urgency
                </label>
                <Select
                  value={formData.custom_project_urgency || ""}
                  onValueChange={(value) =>
                    handleSelectChange("custom_project_urgency", value)
                  }
                >
                  <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {projectUrgency.map((urgency) => (
                      <SelectItem
                        key={urgency.name}
                        value={urgency.name}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                      >
                        {urgency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {section.id === "property" && (
            // In the PropertyAddressSection props
            <PropertyAddressSection
              formData={formData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              propertyTypes={propertyTypes}
              buildingTypes={buildingTypes}
              getPropertyArea={formData.custom_property_area || ""} // Use formData directly
            />
          )}

          {/* {section.id === "inspection" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={
                    date
                      ? format(date, "yyyy-MM-dd")
                      : formData.custom_preferred_inspection_date
                      ? new Date(formData.custom_preferred_inspection_date)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const selectedDate = e.target.value
                      ? new Date(e.target.value)
                      : undefined;
                    setDate(selectedDate);
                    handleDateChange(
                      "custom_preferred_inspection_date",
                      selectedDate
                    );
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="col-span-4">
                <label
                  htmlFor="custom_preferred_inspection_time"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time
                </label>
                <Input
                  type="time"
                  id="custom_preferred_inspection_time"
                  name="custom_preferred_inspection_time"
                  value={
                    formData.custom_preferred_inspection_time ||
                    getCurrentTime()
                  }
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )} */}
          {section.id === "additional" && (
            <div>
              <div className="grid grid-cols-12 gap-4 mb-2">
                {/* Date Field */}
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={
                        date
                          ? format(date, "yyyy-MM-dd")
                          : formData.custom_preferred_inspection_date
                          ? new Date(formData.custom_preferred_inspection_date)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const selectedDate = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        setDate(selectedDate);
                        handleDateChange(
                          "custom_preferred_inspection_date",
                          selectedDate
                        );
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={
                        {
                          // Hide browser default icons
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                        } as React.CSSProperties
                      }
                    />
                    {/* Custom Calendar Icon - Clickable */}
                    <div
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                      onClick={() => {
                        // Focus and click the input to trigger date picker
                        const input = document.querySelector(
                          'input[type="date"]'
                        ) as HTMLInputElement;
                        if (input) {
                          input.focus();
                          if (
                            "showPicker" in input &&
                            typeof input.showPicker === "function"
                          ) {
                            input.showPicker();
                          }
                        }
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Time Field */}
                <div className="col-span-6">
                  <label
                    htmlFor="custom_preferred_inspection_time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Time
                  </label>
                  <div className="relative">
                    <Input
                      type="time"
                      id="custom_preferred_inspection_time"
                      name="custom_preferred_inspection_time"
                      value={
                        formData.custom_preferred_inspection_time ||
                        getCurrentTime()
                      }
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={
                        {
                          // Hide browser default icons
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                        } as React.CSSProperties
                      }
                    />
                    {/* Custom Clock Icon - Clickable */}
                    <div
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                      onClick={() => {
                        // Focus and click the input to trigger time picker
                        const input = document.querySelector(
                          'input[type="time"]'
                        ) as HTMLInputElement;
                        if (input) {
                          input.focus();
                          if (
                            "showPicker" in input &&
                            typeof input.showPicker === "function"
                          ) {
                            input.showPicker();
                          }
                        }
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="custom_special_requirements"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Special Requirements
                  </label>
                  <Textarea
                    id="custom_special_requirements"
                    name="custom_special_requirements"
                    value={formData.custom_special_requirements || ""}
                    onChange={handleInputChange}
                    placeholder="Enter any special requirements or notes"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {section.id === "inspector" && (
            <div className="space-y-4">
              {assignError && (
                <div className="text-red-500 text-sm">{assignError}</div>
              )}
              {assignSuccess && (
                <div className="text-emerald-500 text-sm">
                  Inspector assigned successfully!
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-700 text-sm font-medium">
                  Select Inspector
                </Label>
                <Select
                  value={inspectorEmail}
                  onValueChange={setInspectorEmail}
                  disabled={inspectorsLoading}
                >
                  <SelectTrigger className="w-full bg-white border border-gray-300">
                    <SelectValue placeholder="Select an inspector" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 max-h-[200px]">
                    {inspectors.map((inspector) => (
                      <SelectItem
                        key={inspector.full_name ?? inspector.name}
                        value={inspector.name ?? ""}
                      >
                        <div className="flex items-center gap-2">
                          <span>{inspector.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as PriorityLevel)
                    }
                  >
                    <SelectTrigger className="w-full bg-white border border-gray-300">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300">
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">
                    Inspection Date
                  </Label>
                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={
                        date
                          ? format(date, "yyyy-MM-dd")
                          : formData.custom_preferred_inspection_date
                          ? new Date(formData.custom_preferred_inspection_date)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const selectedDate = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        setDate(selectedDate);
                        handleDateChange(
                          "custom_preferred_inspection_date",
                          selectedDate
                        );
                      }}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={{
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      }}
                    />
                    {/* Custom Calendar Icon - Clickable */}
                    <div
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                      onClick={() => {
                        const input = document.querySelector(
                          'input[type="date"]'
                        ) as HTMLInputElement;
                        if (input) {
                          input.focus();
                          if (
                            "showPicker" in input &&
                            typeof input.showPicker === "function"
                          ) {
                            input.showPicker();
                          }
                        }
                      }}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleAssignAndSave}
                  disabled={
                    createTodoLoading ||
                    loading ||
                    !inspectorEmail ||
                    !date ||
                    !formData.lead_name ||
                    !formData.mobile_no ||
                    !formData.custom_job_type ||
                    (showReferenceInput && !formData.custom_reference_name)
                  }
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                >
                  {createTodoLoading || loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loading ? "Saving & Assigning..." : "Assigning..."}
                    </>
                  ) : (
                    "Save & Assign Inspector"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryForm;
