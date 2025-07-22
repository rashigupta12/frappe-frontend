// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   useJobCards,
//   type JobCardFormData,
//   type PressingCharges,
//   type MaterialSold,
//   type JobCard,
// } from "../../context/JobCardContext";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Label } from "../ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import {
//   X,
//   Plus,
//   Trash2,
//   Save,
//   Loader2,
//   Calendar,
//   User,
//   Building,
//   MapPin,
//   FileText,
//   DollarSign,
//   Phone,
//   Mail,
// } from "lucide-react";
// import { toast } from "react-hot-toast";
// import { frappeAPI } from "../../api/frappeClient";

// interface JobCardFormProps {
//   isOpen: boolean;
//   onClose: () => void;
//   jobCard?: JobCard | null;
// }

// const JobCardForm: React.FC<JobCardFormProps> = ({
//   isOpen,
//   onClose,
//   jobCard,
// }) => {
//   const { createJobCard, updateJobCard, loading, fetchEmployees } =
//     useJobCards();

//   const [formData, setFormData] = useState<JobCardFormData>({
//     date: new Date().toISOString().split("T")[0],
//     building_name: "",
//     property_no: "",
//     area: "",
//     party_name: "",
//     start_date: "",
//     finish_date: "",
//     prepared_by: "",
//     approved_by: "",
//     project_id_no: "",
//     ac_v_no_and_date: "",
//     pressing_charges: [],
//     material_sold: [],
//     lead_id: "",
//     customer_id: "",
//   });

//   const [pressingCharges, setPressingCharges] = useState<PressingCharges[]>([]);
//   const [materialsSold, setMaterialsSold] = useState<MaterialSold[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
//   const [fetchingLeadDetails, setFetchingLeadDetails] = useState(false);
//   const [searchError, setSearchError] = useState<string | null>(null);
//   const [items, setItems] = useState<{ name: string }[]>([]);
//   const [loadingItems, setLoadingItems] = useState(false);

//   // Fetch items when component mounts
//   useEffect(() => {
//     const fetchItems = async () => {
//       setLoadingItems(true);
//       try {
//         const response = await frappeAPI.getItem();
//         const itemsArray = Array.isArray(response.data) ? response.data : [response.data];
        
//         // Debug: Log all item names
//         console.log("All item names:", itemsArray.map((item: { name: any; }) => item.name));
        
//         // Filter for MDF-related items
//         const filteredItems = itemsArray.filter((item: { name: string }) => {
//           const name = item.name?.toLowerCase() || '';
//           return (
//             name.includes("6mm mr mdf") ||
//             name.includes("mdf cladding") ||
//             name.includes("veneer")
//           );
//         });

//         console.log("Filtered items:", filteredItems);
//         setItems(filteredItems.length > 0 ? filteredItems : itemsArray);
//       } catch (error) {
//         console.error("Failed to fetch items:", error);
//         toast.error("Failed to load work type options");
//       } finally {
//         setLoadingItems(false);
//       }
//     };

//     fetchItems();
//   }, []);

//   // Fetch employees when component mounts
//   useEffect(() => {
//     fetchEmployees();
//   }, [fetchEmployees]);

//   // Load existing job card data when editing
//   useEffect(() => {
//     if (jobCard) {
//       setFormData({
//         ...jobCard,
//         party_name: jobCard.party_name || "",
//         prepared_by: jobCard.prepared_by || "",
//         approved_by: jobCard.approved_by || "",
//         project_id_no: jobCard.project_id_no || "",
//         ac_v_no_and_date: jobCard.ac_v_no_and_date || "",
//         pressing_charges: jobCard.pressing_charges || [],
//         material_sold: jobCard.material_sold || [],
//         lead_id: (jobCard as any).lead_id || "",
//         customer_id: (jobCard as any).customer_id || "",
//       });
//       setSearchQuery(jobCard.party_name || "");
//       setPressingCharges(jobCard.pressing_charges || []);
//       setMaterialsSold(jobCard.material_sold || []);
//     } else {
//       setFormData({
//         date: new Date().toISOString().split("T")[0],
//         building_name: "",
//         property_no: "",
//         area: "",
//         party_name: "",
//         start_date: "",
//         finish_date: "",
//         prepared_by: "",
//         approved_by: "",
//         project_id_no: "",
//         ac_v_no_and_date: "",
//         pressing_charges: [],
//         material_sold: [],
//         lead_id: "",
//         customer_id: "",
//       });
//       setSearchQuery("");
//       setPressingCharges([]);
//       setMaterialsSold([]);
//     }
//   }, [jobCard, isOpen]);

//   // Debounce search
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       if (searchQuery.length > 2) {
//         handleCustomerSearch();
//       } else {
//         setSearchResults([]);
//         setShowDropdown(false);
//       }
//     }, 500);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [searchQuery]);

//   const handleCustomerSearch = async () => {
//     setSearchError(null);
//     if (!searchQuery.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     setIsSearching(true);
//     try {
//       const response = await frappeAPI.getcustomer({
//         mobile_no: searchQuery,
//         email_id: searchQuery,
//         customer_name: searchQuery,
//       });

//       if (!response.data || !Array.isArray(response.data)) {
//         throw new Error("Invalid response format");
//       }

//       if (response.data.length === 0) {
//         setSearchError("No customers found");
//         setSearchResults([]);
//         return;
//       }

//       // For each customer found, fetch their full details
//       const detailedCustomers = await Promise.all(
//         response.data.map(async (customer: { name: any }) => {
//           try {
//             const customerDetails = await frappeAPI.getCustomerById(
//               customer.name
//             );
//             return customerDetails.data;
//           } catch (error) {
//             console.error(
//               `Failed to fetch details for customer ${customer.name}:`,
//               error
//             );
//             return null;
//           }
//         })
//       );

//       // Filter out any failed requests
//       const validCustomers = detailedCustomers.filter(
//         (customer) => customer !== null
//       );

//       setSearchResults(validCustomers);
//       setShowDropdown(true);
//     } catch (error) {
//       console.error("Search error:", error);
//       setSearchError(
//         error instanceof Error ? error.message : "Failed to search customers"
//       );
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleCustomerSelect = async (customer: any) => {
//     setFetchingCustomerDetails(true);

//     try {
//       setFormData((prev) => ({
//         ...prev,
//         party_name: customer.customer_name || customer.name || "",
//         customer_id: customer.name,
//       }));

//       setSearchQuery(customer.customer_name || customer.name || "");
//       setShowDropdown(false);

//       if (customer.lead_name) {
//         setFetchingLeadDetails(true);
//         try {
//           const leadResponse = await frappeAPI.getLeadById(customer.lead_name);

//           if (leadResponse.data) {
//             const lead = leadResponse.data;
//             setFormData((prev) => ({
//               ...prev,
//               building_name: lead.custom_building_name || "",
//               property_no:
//                 lead.custom_bulding__apartment__villa__office_number || "",
//               area: lead.custom_property_area || "",
//               lead_id: lead.name,
//             }));
//             toast.success("Customer and property details loaded!");
//           }
//         } catch (error) {
//           console.error("Failed to fetch lead data:", error);
//           toast.error("Loaded customer but failed to fetch property details");
//         } finally {
//           setFetchingLeadDetails(false);
//         }
//       } else {
//         toast.success("Customer loaded (no property details found)");
//       }
//     } finally {
//       setFetchingCustomerDetails(false);
//     }
//   };

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Pressing Charges functions
//   const addPressingCharge = () => {
//     const newCharge: PressingCharges = {
//       work_type: "",
//       size: "",
//       thickness: "",
//       no_of_sides: "",
//       price: 0,
//       amount: 0,
//     };
//     setPressingCharges((prev) => [...prev, newCharge]);
//   };

//   const updatePressingCharge = (
//     index: number,
//     field: keyof PressingCharges,
//     value: string | number
//   ) => {
//     setPressingCharges((prev) =>
//       prev.map((charge, i) => {
//         if (i !== index) return charge;

//         const updatedCharge = { ...charge, [field]: value };

//         // Auto-calculate amount when price or no_of_sides changes
//         if (field === 'price' || field === 'no_of_sides') {
//           const price = Number(updatedCharge.price) || 0;
//           const sides = Number(updatedCharge.no_of_sides) || 1;
//           updatedCharge.amount = price * sides;
//         }

//         return updatedCharge;
//       })
//     );
//   };

//   const removePressingCharge = (index: number) => {
//     setPressingCharges((prev) => prev.filter((_, i) => i !== index));
//   };

//   // Materials Sold functions
//   const addMaterialSold = () => {
//     const newMaterial: MaterialSold = {
//       work_type: "",
//       size: "",
//       thickness: "",
//       no_of_sides: "",
//       price: 0,
//       amount: 0,
//     };
//     setMaterialsSold((prev) => [...prev, newMaterial]);
//   };

//   const updateMaterialSold = (
//     index: number,
//     field: keyof MaterialSold,
//     value: string | number
//   ) => {
//     setMaterialsSold((prev) =>
//       prev.map((material, i) =>
//         i === index ? { ...material, [field]: value } : material
//       )
//     );
//   };

//   const removeMaterialSold = (index: number) => {
//     setMaterialsSold((prev) => prev.filter((_, i) => i !== index));
//   };

//   const validateForm = (): boolean => {
//     if (!formData.party_name) {
//       alert("Customer name is required");
//       return false;
//     }
//     if (!formData.building_name) {
//       alert("Building name is required");
//       return false;
//     }
//     if (!formData.property_no) {
//       alert("Property number is required");
//       return false;
//     }
//     if (!formData.area) {
//       alert("Area is required");
//       return false;
//     }
//     if (!formData.start_date) {
//       alert("Start date is required");
//       return false;
//     }
//     if (!formData.finish_date) {
//       alert("Finish date is required");
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     try {
//       const submissionData = {
//         doctype: "Job Card -Veneer Pressing",
//         date: formData.date,
//         party_name: formData.party_name,
//         property_no: formData.property_no,
//         building_name: formData.building_name,
//         area: formData.area,
//         start_date: formData.start_date,
//         finish_date: formData.finish_date,
//         prepared_by: formData.prepared_by || "",
//         approved_by: formData.approved_by || "",
//         project_id_no: formData.project_id_no || "",
//         ac_v_no_and_date: formData.ac_v_no_and_date || "",
//         pressing_charges: pressingCharges,
//         material_sold: materialsSold,
//         customer_id: formData.customer_id || "",
//         lead_id: formData.lead_id || "",
//       };

//       if (jobCard?.name) {
//         await updateJobCard(jobCard.name, submissionData);
//       } else {
//         await createJobCard(submissionData);
//       }

//       onClose();
//     } catch (error) {
//       console.error("Form submission error:", error);
//       if (error instanceof Error) {
//         toast.error(`Error: ${error.message}`);
//       }
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <>
//       <div
//         className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
//         onClick={onClose}
//       />

//       <div
//         className="fixed inset-0 sm:inset-y-0 sm:right-0 w-full sm:max-w-6xl bg-white shadow-2xl sm:border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
//         style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
//       >
//         {/* Header */}
//         <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600 p-6 ">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <div className="bg-white/20 p-2 rounded-lg">
//                 <FileText className="h-6 w-6" />
//               </div>
//               <div>
//                 <h3 className="text-2xl font-bold">
//                   {jobCard ? "Edit Job Card" : "New Job Card"}
//                 </h3>
//                 <p className="text-blue-100 text-sm">Veneer Pressing Details</p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="text-right">
//                 <p className="text-sm text-blue-100">Today's Date</p>
//                 <p className="font-medium">
//                   {new Date().toLocaleDateString('en-US', {
//                     year: 'numeric',
//                     month: 'short',
//                     day: 'numeric'
//                   })}
//                 </p>
//               </div>
//               {formData.project_id_no && (
//                 <div className="text-right">
//                   <p className="text-sm text-blue-100">Project ID</p>
//                   <p className="font-medium">{formData.project_id_no}</p>
//                 </div>
//               )}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="h-10 w-10 p-0 rounded-full text-white hover:bg-white/10 transition-colors"
//                 onClick={onClose}
//               >
//                 <X className="h-5 w-5" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Form Content */}
//         <div className="flex-1 overflow-y-auto bg-gray-50">
//           <div className="max-w-5xl mx-auto p-6 space-y-8">
//             <form onSubmit={handleSubmit} className="space-y-8">
//               {/* Basic Information Card */}
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex items-center space-x-2">
//                     <User className="h-5 w-5 text-blue-600" />
//                     <h4 className="text-lg font-semibold text-gray-900">
//                       Basic Information
//                     </h4>
//                   </div>
//                 </div>

//                 <div className="p-6">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                     <div className="space-y-2 relative">
//                       <Label
//                         htmlFor="party_name"
//                         className="flex items-center space-x-2"
//                       >
//                         <User className="h-4 w-4 text-gray-500" />
//                         <span>
//                           Customer Name <span className="text-red-500">*</span>
//                         </span>
//                         {(fetchingCustomerDetails || fetchingLeadDetails) && (
//                           <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
//                         )}
//                       </Label>
//                       <div className="relative">
//                         <Input
//                           id="party_name"
//                           name="party_name"
//                           value={searchQuery}
//                           onChange={(e) => {
//                             setSearchQuery(e.target.value);
//                           }}
//                           placeholder="Search by name, email or phone"
//                           required
//                           className="focus:ring-blue-500 focus:border-blue-500 pr-10"
//                         />
//                         {isSearching && (
//                           <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
//                         )}
//                       </div>

//                       {searchError && (
//                         <p className="text-xs text-red-500 mt-1">
//                           {searchError}
//                         </p>
//                       )}

//                       {showDropdown && searchResults.length > 0 && (
//                         <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
//                           {searchResults.map((customer) => (
//                             <div
//                               key={customer.name}
//                               className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
//                               onClick={() => handleCustomerSelect(customer)}
//                             >
//                               <div>
//                                 <p className="font-medium">
//                                   {customer.customer_name || customer.name}
//                                 </p>
//                                 <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
//                                   {customer.mobile_no && (
//                                     <span className="flex items-center">
//                                       <Phone className="h-3 w-3 mr-1" />
//                                       {customer.mobile_no}
//                                     </span>
//                                   )}
//                                   {customer.email_id && (
//                                     <span className="flex items-center">
//                                       <Mail className="h-3 w-3 mr-1" />
//                                       {customer.email_id}
//                                     </span>
//                                   )}
//                                   {customer.lead_name && (
//                                     <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">
//                                       Has Property
//                                     </span>
//                                   )}
//                                 </div>
//                               </div>
//                               <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                                 Select
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>

//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="building_name"
//                         className="flex items-center space-x-2"
//                       >
//                         <Building className="h-4 w-4 text-gray-500" />
//                         <span>
//                           Building Name <span className="text-red-500">*</span>
//                         </span>
//                       </Label>
//                       <Input
//                         id="building_name"
//                         name="building_name"
//                         value={formData.building_name || ""}
//                         onChange={handleInputChange}
//                         placeholder="Enter building name"
//                         required
//                         className="focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="property_no">
//                         Property No <span className="text-red-500">*</span>
//                       </Label>
//                       <Input
//                         id="property_no"
//                         name="property_no"
//                         value={formData.property_no || ""}
//                         onChange={handleInputChange}
//                         placeholder="Enter property number"
//                         required
//                         className="focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="area"
//                         className="flex items-center space-x-2"
//                       >
//                         <MapPin className="h-4 w-4 text-gray-500" />
//                         <span>
//                           Area <span className="text-red-500">*</span>
//                         </span>
//                       </Label>
//                       <Input
//                         id="area"
//                         name="area"
//                         value={formData.area || ""}
//                         onChange={handleInputChange}
//                         placeholder="Enter area"
//                         required
//                         className="focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div className="flex flex-wrap gap-2">
//                       <div className="w-[48%] space-y-2">
//                         <Label
//                           htmlFor="start_date"
//                           className="flex items-center space-x-1"
//                         >
//                           <Calendar className="h-4 w-4 text-gray-500" />
//                           <span>
//                             Start Date <span className="text-red-500">*</span>
//                           </span>
//                         </Label>
//                         <Input
//                           id="start_date"
//                           name="start_date"
//                           type="date"
//                           value={formData.start_date || ""}
//                           onChange={handleInputChange}
//                           required
//                           className="w-full"
//                         />
//                       </div>

//                       <div className="w-[48%] space-y-2">
//                         <Label
//                           htmlFor="finish_date"
//                           className="flex items-center space-x-1"
//                         >
//                           <Calendar className="h-4 w-4 text-gray-500" />
//                           <span>
//                             Finish Date <span className="text-red-500">*</span>
//                           </span>
//                         </Label>
//                         <Input
//                           id="finish_date"
//                           name="finish_date"
//                           type="date"
//                           value={formData.finish_date || ""}
//                           onChange={handleInputChange}
//                           required
//                           className="w-full"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Pressing Charges Card */}
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center space-x-2">
//                       <DollarSign className="h-5 w-5 text-emerald-600" />
//                       <h4 className="text-lg font-semibold text-gray-900">
//                         Pressing Charges
//                       </h4>
//                     </div>
//                     <Button
//                       type="button"
//                       onClick={addPressingCharge}
//                       size="sm"
//                       className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Charge
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="p-6 space-y-4">
//                   {pressingCharges.length === 0 ? (
//                     <div className="text-center py-8 text-gray-500">
//                       <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                       <p>No pressing charges added yet</p>
//                       <p className="text-sm">
//                         Click "Add Charge" to get started
//                       </p>
//                     </div>
//                   ) : (
//                     pressingCharges.map((charge, index) => (
//                       <div
//                         key={index}
//                         className="bg-gray-50 rounded-lg p-4 border border-gray-200"
//                       >
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Work Type
//                             </Label>
//                             {loadingItems ? (
//                               <div className="flex items-center gap-2">
//                                 <Loader2 className="animate-spin h-4 w-4" />
//                                 <span className="text-sm">
//                                   Loading work types...
//                                 </span>
//                               </div>
//                             ) : (
//                               <Select
//                                 value={charge.work_type}
//                                 onValueChange={(value) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "work_type",
//                                     value
//                                   )
//                                 }
//                               >
//                                 <SelectTrigger className="h-9 text-sm">
//                                   <SelectValue placeholder="Select work type" />
//                                 </SelectTrigger>
//                                 <SelectContent className="bg-white">
//                                   <SelectItem value="none">
//                                     Select work type
//                                   </SelectItem>
//                                   {items.map((item) => (
//                                     <SelectItem
//                                       key={item.name}
//                                       value={item.name}
//                                     >
//                                       {item.name}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                             )}
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Size
//                               </Label>
//                               <Input
//                                 placeholder="Size"
//                                 value={charge.size}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "size",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Thickness
//                               </Label>
//                               <Input
//                                 placeholder="Thickness"
//                                 value={charge.thickness}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "thickness",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 No of Sides
//                               </Label>
//                               <Input
//                                 placeholder="No of Sides"
//                                 type="number"
//                                 min="1"
//                                 value={charge.no_of_sides || ''}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "no_of_sides",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Price
//                               </Label>
//                               <Input
//                                 placeholder="0.00"
//                                 type="number"
//                                 step="0.01"
//                                 value={charge.price || ''}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "price",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Amount
//                             </Label>
//                             <Input
//                               readOnly
//                               value={charge.amount || 0}
//                               className="bg-gray-100 h-9 text-sm"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

//               {/* Materials Sold Card */}
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center space-x-2">
//                       <Building className="h-5 w-5 text-purple-600" />
//                       <h4 className="text-lg font-semibold text-gray-900">
//                         Materials Sold
//                       </h4>
//                     </div>
//                     <Button
//                       type="button"
//                       onClick={addMaterialSold}
//                       size="sm"
//                       className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Material
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="p-6 space-y-4">
//                   {materialsSold.length === 0 ? (
//                     <div className="text-center py-8 text-gray-500">
//                       <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                       <p>No materials added yet</p>
//                       <p className="text-sm">
//                         Click "Add Material" to get started
//                       </p>
//                     </div>
//                   ) : (
//                     materialsSold.map((material, index) => (
//                       <div
//                         key={index}
//                         className="bg-gray-50 rounded-lg p-4 border border-gray-200"
//                       >
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Work Type
//                             </Label>
//                             {loadingItems ? (
//                               <div className="flex items-center gap-2">
//                                 <Loader2 className="animate-spin h-4 w-4" />
//                                 <span className="text-sm">
//                                   Loading work types...
//                                 </span>
//                               </div>
//                             ) : (
//                               <Select
//                                 value={material.work_type}
//                                 onValueChange={(value) =>
//                                   updateMaterialSold(index, "work_type", value)
//                                 }
//                               >
//                                 <SelectTrigger className="h-9 text-sm">
//                                   <SelectValue placeholder="Select work type" />
//                                 </SelectTrigger>
//                                 <SelectContent className="bg-white">
//                                   <SelectItem value="none">
//                                     Select work type
//                                   </SelectItem>
//                                   {items.map((item) => (
//                                     <SelectItem
//                                       key={item.name}
//                                       value={item.name}
//                                     >
//                                       {item.name}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                             )}
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Size
//                               </Label>
//                               <Input
//                                 placeholder="Size"
//                                 value={material.size}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "size",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Thickness
//                               </Label>
//                               <Input
//                                 placeholder="Thickness"
//                                 value={material.thickness}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "thickness",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 No of Sides
//                               </Label>
//                               <Input
//                                 placeholder="No of Sides"
//                                 value={material.no_of_sides}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "no_of_sides",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Price
//                               </Label>
//                               <Input
//                                 placeholder="0.00"
//                                 type="number"
//                                 step="0.01"
//                                 value={material.price}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "price",
//                                     Number(e.target.value)
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Amount
//                             </Label>
//                             <div className="flex gap-2">
//                               <Input
//                                 placeholder="0.00"
//                                 type="number"
//                                 step="0.01"
//                                 value={material.amount}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "amount",
//                                     Number(e.target.value)
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                               <Button
//                                 type="button"
//                                 variant="destructive"
//                                 size="sm"
//                                 onClick={() => removeMaterialSold(index)}
//                                 className="h-9 w-9 p-0"
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </Button>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
//                 <div className="flex flex-col sm:flex-row justify-end gap-3">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={onClose}
//                     className="px-8 py-3 order-2 sm:order-1"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={loading}
//                     className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg order-1 sm:order-2"
//                   >
//                     {loading ? (
//                       <div className="flex items-center gap-2">
//                         <Loader2 className="animate-spin h-5 w-5" />
//                         Saving...
//                       </div>
//                     ) : (
//                       <div className="flex items-center gap-2">
//                         <Save className="h-5 w-5" />
//                         {jobCard ? "Update Job Card" : "Create Job Card"}
//                       </div>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default JobCardForm;

/* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   useJobCards,
//   type JobCardFormData,
//   type PressingCharges,
//   type MaterialSold,
//   type JobCard,
// } from "../../context/JobCardContext";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Label } from "../ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import {
//   X,
//   Plus,
//   Trash2,
//   Save,
//   Loader2,
//   Calendar,
//   User,
//   Building,
//   MapPin,
//   FileText,
//   DollarSign,
//   Phone,
//   Mail,
// } from "lucide-react";
// import { toast } from "react-hot-toast";
// import { frappeAPI } from "../../api/frappeClient";

// interface JobCardFormProps {
//   isOpen: boolean;
//   onClose: () => void;
//   jobCard?: JobCard | null;
// }

// const JobCardForm: React.FC<JobCardFormProps> = ({
//   isOpen,
//   onClose,
//   jobCard,
// }) => {
//   const { createJobCard, updateJobCard, loading, fetchEmployees } =
//     useJobCards();

//   const [formData, setFormData] = useState<JobCardFormData>({
//     date: new Date().toISOString().split("T")[0],
//     building_name: "",
//     property_no: "",
//     area: "",
//     party_name: "",
//     start_date: "",
//     finish_date: "",
//     prepared_by: "",
//     approved_by: "",
//     project_id_no: "",
//     ac_v_no_and_date: "",
//     pressing_charges: [],
//     material_sold: [],
//     lead_id: "",
//     customer_id: "",
//   });

//   const [pressingCharges, setPressingCharges] = useState<PressingCharges[]>([]);
//   const [materialsSold, setMaterialsSold] = useState<MaterialSold[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
//   const [fetchingLeadDetails, setFetchingLeadDetails] = useState(false);
//   const [searchError, setSearchError] = useState<string | null>(null);
//   const [items, setItems] = useState<{ name: string }[]>([]);
//   const [loadingItems, setLoadingItems] = useState(false);

//   // Fetch items when component mounts
//   useEffect(() => {
//     const fetchItems = async () => {
//       setLoadingItems(true);
//       try {
//         const response = await frappeAPI.getItem();
//         const itemsArray = Array.isArray(response.data) ? response.data : [response.data];
        
//         // Filter for MDF-related items
//         const filteredItems = itemsArray.filter((item: { name: string }) => {
//           const name = item.name?.toLowerCase() || '';
//           return (
//             name.includes("6mm mr mdf") ||
//             name.includes("mdf cladding") ||
//             name.includes("veneer")
//           );
//         });

//         setItems(filteredItems.length > 0 ? filteredItems : itemsArray);
//       } catch (error) {
//         console.error("Failed to fetch items:", error);
//         toast.error("Failed to load work type options");
//       } finally {
//         setLoadingItems(false);
//       }
//     };

//     fetchItems();
//   }, []);

//   // Fetch employees when component mounts
//   useEffect(() => {
//     fetchEmployees();
//   }, [fetchEmployees]);

//   // Load existing job card data when editing
//   useEffect(() => {
//     if (jobCard) {
//       setFormData({
//         ...jobCard,
//         party_name: jobCard.party_name || "",
//         prepared_by: jobCard.prepared_by || "",
//         approved_by: jobCard.approved_by || "",
//         project_id_no: jobCard.project_id_no || "",
//         ac_v_no_and_date: jobCard.ac_v_no_and_date || "",
//         pressing_charges: jobCard.pressing_charges || [],
//         material_sold: jobCard.material_sold || [],
//         lead_id: (jobCard as any).lead_id || "",
//         customer_id: (jobCard as any).customer_id || "",
//       });
//       setSearchQuery(jobCard.party_name || "");
//       setPressingCharges(jobCard.pressing_charges || []);
//       setMaterialsSold(jobCard.material_sold || []);
//     } else {
//       setFormData({
//         date: new Date().toISOString().split("T")[0],
//         building_name: "",
//         property_no: "",
//         area: "",
//         party_name: "",
//         start_date: "",
//         finish_date: "",
//         prepared_by: "",
//         approved_by: "",
//         project_id_no: "",
//         ac_v_no_and_date: "",
//         pressing_charges: [],
//         material_sold: [],
//         lead_id: "",
//         customer_id: "",
//       });
//       setSearchQuery("");
//       setPressingCharges([]);
//       setMaterialsSold([]);
//     }
//   }, [jobCard, isOpen]);

//   // Debounce search
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       if (searchQuery.length > 2) {
//         handleCustomerSearch();
//       } else {
//         setSearchResults([]);
//         setShowDropdown(false);
//       }
//     }, 500);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [searchQuery]);

//   const handleCustomerSearch = async () => {
//     setSearchError(null);
//     if (!searchQuery.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     setIsSearching(true);
//     try {
//       const response = await frappeAPI.getcustomer({
//         mobile_no: searchQuery,
//         email_id: searchQuery,
//         customer_name: searchQuery,
//       });

//       if (!response.data || !Array.isArray(response.data)) {
//         throw new Error("Invalid response format");
//       }

//       if (response.data.length === 0) {
//         setSearchError("No customers found");
//         setSearchResults([]);
//         return;
//       }

//       // For each customer found, fetch their full details
//       const detailedCustomers = await Promise.all(
//         response.data.map(async (customer: { name: any }) => {
//           try {
//             const customerDetails = await frappeAPI.getCustomerById(
//               customer.name
//             );
//             return customerDetails.data;
//           } catch (error) {
//             console.error(
//               `Failed to fetch details for customer ${customer.name}:`,
//               error
//             );
//             return null;
//           }
//         })
//       );

//       // Filter out any failed requests
//       const validCustomers = detailedCustomers.filter(
//         (customer) => customer !== null
//       );

//       setSearchResults(validCustomers);
//       setShowDropdown(true);
//     } catch (error) {
//       console.error("Search error:", error);
//       setSearchError(
//         error instanceof Error ? error.message : "Failed to search customers"
//       );
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleCustomerSelect = async (customer: any) => {
//     setFetchingCustomerDetails(true);

//     try {
//       setFormData((prev) => ({
//         ...prev,
//         party_name: customer.customer_name || customer.name || "",
//         customer_id: customer.name,
//       }));

//       setSearchQuery(customer.customer_name || customer.name || "");
//       setShowDropdown(false);

//       if (customer.lead_name) {
//         setFetchingLeadDetails(true);
//         try {
//           const leadResponse = await frappeAPI.getLeadById(customer.lead_name);

//           if (leadResponse.data) {
//             const lead = leadResponse.data;
//             setFormData((prev) => ({
//               ...prev,
//               building_name: lead.custom_building_name || "",
//               property_no:
//                 lead.custom_bulding__apartment__villa__office_number || "",
//               area: lead.custom_property_area || "",
//               lead_id: lead.name,
//             }));
//             toast.success("Customer and property details loaded!");
//           }
//         } catch (error) {
//           console.error("Failed to fetch lead data:", error);
//           toast.error("Loaded customer but failed to fetch property details");
//         } finally {
//           setFetchingLeadDetails(false);
//         }
//       } else {
//         toast.success("Customer loaded (no property details found)");
//       }
//     } finally {
//       setFetchingCustomerDetails(false);
//     }
//   };

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Pressing Charges functions
//   const addPressingCharge = () => {
//     const newCharge: PressingCharges = {
//       work_type: "",
//       size: "",
//       thickness: "",
//       no_of_sides: "",
//       price: 0,
//       amount: 0,
//     };
//     setPressingCharges((prev) => [...prev, newCharge]);
//   };

//   const updatePressingCharge = (
//     index: number,
//     field: keyof PressingCharges,
//     value: string | number
//   ) => {
//     setPressingCharges((prev) =>
//       prev.map((charge, i) => {
//         if (i !== index) return charge;

//         const updatedCharge = { ...charge, [field]: value };

//         // Auto-calculate amount when price or no_of_sides changes
//         if (field === 'price' || field === 'no_of_sides') {
//           const price = Number(updatedCharge.price) || 0;
//           const sides = Number(updatedCharge.no_of_sides) || 1;
//           updatedCharge.amount = price * sides;
//         }

//         return updatedCharge;
//       })
//     );
//   };

//   const removePressingCharge = (index: number) => {
//     setPressingCharges((prev) => prev.filter((_, i) => i !== index));
//   };

//   // Materials Sold functions
//   const addMaterialSold = () => {
//     const newMaterial: MaterialSold = {
//       work_type: "",
//       size: "",
//       thickness: "",
//       no_of_sides: "",
//       price: 0,
//       amount: 0,
//     };
//     setMaterialsSold((prev) => [...prev, newMaterial]);
//   };

//   const updateMaterialSold = (
//     index: number,
//     field: keyof MaterialSold,
//     value: string | number
//   ) => {
//     setMaterialsSold((prev) =>
//       prev.map((material, i) => {
//         if (i !== index) return material;

//         const updatedMaterial = { ...material, [field]: value };

//         // Auto-calculate amount when price or no_of_sides changes
//         if (field === 'price' || field === 'no_of_sides') {
//           const price = Number(updatedMaterial.price) || 0;
//           const sides = Number(updatedMaterial.no_of_sides) || 1;
//           updatedMaterial.amount = price * sides;
//         }

//         return updatedMaterial;
//       })
//     );
//   };

//   const removeMaterialSold = (index: number) => {
//     setMaterialsSold((prev) => prev.filter((_, i) => i !== index));
//   };

//   const validateForm = (): boolean => {
//     if (!formData.party_name) {
//       alert("Customer name is required");
//       return false;
//     }
//     if (!formData.building_name) {
//       alert("Building name is required");
//       return false;
//     }
//     if (!formData.property_no) {
//       alert("Property number is required");
//       return false;
//     }
//     if (!formData.area) {
//       alert("Area is required");
//       return false;
//     }
//     if (!formData.start_date) {
//       alert("Start date is required");
//       return false;
//     }
//     if (!formData.finish_date) {
//       alert("Finish date is required");
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     try {
//       const submissionData = {
//         doctype: "Job Card -Veneer Pressing",
//         date: formData.date,
//         party_name: formData.party_name,
//         property_no: formData.property_no,
//         building_name: formData.building_name,
//         area: formData.area,
//         start_date: formData.start_date,
//         finish_date: formData.finish_date,
//         prepared_by: formData.prepared_by || "",
//         approved_by: formData.approved_by || "",
//         project_id_no: formData.project_id_no || "",
//         ac_v_no_and_date: formData.ac_v_no_and_date || "",
//         pressing_charges: pressingCharges,
//         material_sold: materialsSold,
//         customer_id: formData.customer_id || "",
//         lead_id: formData.lead_id || "",
//       };

//       if (jobCard?.name) {
//         await updateJobCard(jobCard.name, submissionData);
//       } else {
//         await createJobCard(submissionData);
//       }

//       onClose();
//     } catch (error) {
//       console.error("Form submission error:", error);
//       if (error instanceof Error) {
//         toast.error(`Error: ${error.message}`);
//       }
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <>
//       <div
//         className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
//         onClick={onClose}
//       />

//       <div
//         className="fixed inset-0 sm:inset-y-0 sm:right-0 w-full sm:max-w-6xl bg-white shadow-2xl sm:border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
//         style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
//       >
//         {/* Header */}
//         <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600 p-6 ">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <div className="bg-white/20 p-2 rounded-lg">
//                 <FileText className="h-6 w-6" />
//               </div>
//               <div>
//                 <h3 className="text-2xl font-bold">
//                   {jobCard ? "Edit Job Card" : "New Job Card"}
//                 </h3>
//                 <p className="text-blue-100 text-sm">Veneer Pressing Details</p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="text-right">
//                 <p className="text-sm text-blue-100">Today's Date</p>
//                 <p className="font-medium">
//                   {new Date().toLocaleDateString('en-US', {
//                     year: 'numeric',
//                     month: 'short',
//                     day: 'numeric'
//                   })}
//                 </p>
//               </div>
//               {formData.project_id_no && (
//                 <div className="text-right">
//                   <p className="text-sm text-blue-100">Project ID</p>
//                   <p className="font-medium">{formData.project_id_no}</p>
//                 </div>
//               )}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="h-10 w-10 p-0 rounded-full text-white hover:bg-white/10 transition-colors"
//                 onClick={onClose}
//               >
//                 <X className="h-5 w-5" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Form Content */}
//         <div className="flex-1 overflow-y-auto bg-gray-50">
//           <div className="max-w-5xl mx-auto p-6 space-y-8">
//             <form onSubmit={handleSubmit} className="space-y-8">
//               {/* Basic Information Card */}
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex items-center space-x-2">
//                     <User className="h-5 w-5 text-blue-600" />
//                     <h4 className="text-lg font-semibold text-gray-900">
//                       Basic Information
//                     </h4>
//                   </div>
//                 </div>

//                 <div className="p-6">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                     <div className="space-y-2 relative">
//                       <Label
//                         htmlFor="party_name"
//                         className="flex items-center space-x-2"
//                       >
//                         <User className="h-4 w-4 text-gray-500" />
//                         <span>
//                           Customer Name <span className="text-red-500">*</span>
//                         </span>
//                         {(fetchingCustomerDetails || fetchingLeadDetails) && (
//                           <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
//                         )}
//                       </Label>
//                       <div className="relative">
//                         <Input
//                           id="party_name"
//                           name="party_name"
//                           value={searchQuery}
//                           onChange={(e) => {
//                             setSearchQuery(e.target.value);
//                           }}
//                           placeholder="Search by name, email or phone"
//                           required
//                           className="focus:ring-blue-500 focus:border-blue-500 pr-10"
//                         />
//                         {isSearching && (
//                           <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
//                         )}
//                       </div>

//                       {searchError && (
//                         <p className="text-xs text-red-500 mt-1">
//                           {searchError}
//                         </p>
//                       )}

//                       {showDropdown && searchResults.length > 0 && (
//                         <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
//                           {searchResults.map((customer) => (
//                             <div
//                               key={customer.name}
//                               className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
//                               onClick={() => handleCustomerSelect(customer)}
//                             >
//                               <div>
//                                 <p className="font-medium">
//                                   {customer.customer_name || customer.name}
//                                 </p>
//                                 <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
//                                   {customer.mobile_no && (
//                                     <span className="flex items-center">
//                                       <Phone className="h-3 w-3 mr-1" />
//                                       {customer.mobile_no}
//                                     </span>
//                                   )}
//                                   {customer.email_id && (
//                                     <span className="flex items-center">
//                                       <Mail className="h-3 w-3 mr-1" />
//                                       {customer.email_id}
//                                     </span>
//                                   )}
//                                   {customer.lead_name && (
//                                     <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">
//                                       Has Property
//                                     </span>
//                                   )}
//                                 </div>
//                               </div>
//                               <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                                 Select
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>

//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="building_name"
//                         className="flex items-center space-x-2"
//                       >
//                         <Building className="h-4 w-4 text-gray-500" />
//                         <span>
//                           Building Name <span className="text-red-500">*</span>
//                         </span>
//                       </Label>
//                       <Input
//                         id="building_name"
//                         name="building_name"
//                         value={formData.building_name || ""}
//                         onChange={handleInputChange}
//                         placeholder="Enter building name"
//                         required
//                         className="focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="property_no">
//                         Property No <span className="text-red-500">*</span>
//                       </Label>
//                       <Input
//                         id="property_no"
//                         name="property_no"
//                         value={formData.property_no || ""}
//                         onChange={handleInputChange}
//                         placeholder="Enter property number"
//                         required
//                         className="focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="area"
//                         className="flex items-center space-x-2"
//                       >
//                         <MapPin className="h-4 w-4 text-gray-500" />
//                         <span>
//                           Area <span className="text-red-500">*</span>
//                         </span>
//                       </Label>
//                       <Input
//                         id="area"
//                         name="area"
//                         value={formData.area || ""}
//                         onChange={handleInputChange}
//                         placeholder="Enter area"
//                         required
//                         className="focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div className="flex flex-wrap gap-2">
//                       <div className="w-[48%] space-y-2">
//                         <Label
//                           htmlFor="start_date"
//                           className="flex items-center space-x-1"
//                         >
//                           <Calendar className="h-4 w-4 text-gray-500" />
//                           <span>
//                             Start Date <span className="text-red-500">*</span>
//                           </span>
//                         </Label>
//                         <Input
//                           id="start_date"
//                           name="start_date"
//                           type="date"
//                           value={formData.start_date || ""}
//                           onChange={handleInputChange}
//                           required
//                           className="w-full"
//                         />
//                       </div>

//                       <div className="w-[48%] space-y-2">
//                         <Label
//                           htmlFor="finish_date"
//                           className="flex items-center space-x-1"
//                         >
//                           <Calendar className="h-4 w-4 text-gray-500" />
//                           <span>
//                             Finish Date <span className="text-red-500">*</span>
//                           </span>
//                         </Label>
//                         <Input
//                           id="finish_date"
//                           name="finish_date"
//                           type="date"
//                           value={formData.finish_date || ""}
//                           onChange={handleInputChange}
//                           required
//                           className="w-full"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Pressing Charges Card */}
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center space-x-2">
//                       <DollarSign className="h-5 w-5 text-emerald-600" />
//                       <h4 className="text-lg font-semibold text-gray-900">
//                         Pressing Charges
//                       </h4>
//                     </div>
//                     <Button
//                       type="button"
//                       onClick={addPressingCharge}
//                       size="sm"
//                       className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Charge
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="p-6 space-y-4">
//                   {pressingCharges.length === 0 ? (
//                     <div className="text-center py-8 text-gray-500">
//                       <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                       <p>No pressing charges added yet</p>
//                       <p className="text-sm">
//                         Click "Add Charge" to get started
//                       </p>
//                     </div>
//                   ) : (
//                     pressingCharges.map((charge, index) => (
//                       <div
//                         key={index}
//                         className="bg-gray-50 rounded-lg p-4 border border-gray-200"
//                       >
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Work Type
//                             </Label>
//                             {loadingItems ? (
//                               <div className="flex items-center gap-2">
//                                 <Loader2 className="animate-spin h-4 w-4" />
//                                 <span className="text-sm">
//                                   Loading work types...
//                                 </span>
//                               </div>
//                             ) : (
//                               <Select
//                                 value={charge.work_type}
//                                 onValueChange={(value) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "work_type",
//                                     value
//                                   )
//                                 }
//                               >
//                                 <SelectTrigger className="h-9 text-sm">
//                                   <SelectValue placeholder="Select work type" />
//                                 </SelectTrigger>
//                                 <SelectContent className="bg-white">
//                                   <SelectItem value="none">
//                                     Select work type
//                                   </SelectItem>
//                                   {items.map((item) => (
//                                     <SelectItem
//                                       key={item.name}
//                                       value={item.name}
//                                     >
//                                       {item.name}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                             )}
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Size
//                               </Label>
//                               <Input
//                                 placeholder="Size"
//                                 value={charge.size}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "size",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Thickness
//                               </Label>
//                               <Input
//                                 placeholder="Thickness"
//                                 value={charge.thickness}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "thickness",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 No of Sides
//                               </Label>
//                               <Input
//                                 placeholder="No of Sides"
//                                 type="number"
//                                 min="1"
//                                 value={charge.no_of_sides || ''}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "no_of_sides",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Price
//                               </Label>
//                               <Input
//                                 placeholder="0.00"
//                                 type="number"
//                                 step="0.01"
//                                 value={charge.price || ''}
//                                 onChange={(e) =>
//                                   updatePressingCharge(
//                                     index,
//                                     "price",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Amount
//                             </Label>
//                             <Input
//                               readOnly
//                               value={charge.amount || 0}
//                               className="bg-gray-100 h-9 text-sm"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

//               {/* Materials Sold Card */}
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center space-x-2">
//                       <Building className="h-5 w-5 text-purple-600" />
//                       <h4 className="text-lg font-semibold text-gray-900">
//                         Materials Sold
//                       </h4>
//                     </div>
//                     <Button
//                       type="button"
//                       onClick={addMaterialSold}
//                       size="sm"
//                       className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Material
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="p-6 space-y-4">
//                   {materialsSold.length === 0 ? (
//                     <div className="text-center py-8 text-gray-500">
//                       <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                       <p>No materials added yet</p>
//                       <p className="text-sm">
//                         Click "Add Material" to get started
//                       </p>
//                     </div>
//                   ) : (
//                     materialsSold.map((material, index) => (
//                       <div
//                         key={index}
//                         className="bg-gray-50 rounded-lg p-4 border border-gray-200"
//                       >
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Work Type
//                             </Label>
//                             {loadingItems ? (
//                               <div className="flex items-center gap-2">
//                                 <Loader2 className="animate-spin h-4 w-4" />
//                                 <span className="text-sm">
//                                   Loading work types...
//                                 </span>
//                               </div>
//                             ) : (
//                               <Select
//                                 value={material.work_type}
//                                 onValueChange={(value) =>
//                                   updateMaterialSold(index, "work_type", value)
//                                 }
//                               >
//                                 <SelectTrigger className="h-9 text-sm">
//                                   <SelectValue placeholder="Select work type" />
//                                 </SelectTrigger>
//                                 <SelectContent className="bg-white">
//                                   <SelectItem value="none">
//                                     Select work type
//                                   </SelectItem>
//                                   {items.map((item) => (
//                                     <SelectItem
//                                       key={item.name}
//                                       value={item.name}
//                                     >
//                                       {item.name}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                             )}
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Size
//                               </Label>
//                               <Input
//                                 placeholder="Size"
//                                 value={material.size}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "size",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Thickness
//                               </Label>
//                               <Input
//                                 placeholder="Thickness"
//                                 value={material.thickness}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "thickness",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="flex gap-2">
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 No of Sides
//                               </Label>
//                               <Input
//                                 placeholder="No of Sides"
//                                 type="number"
//                                 min="1"
//                                 value={material.no_of_sides || ''}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "no_of_sides",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                             <div className="space-y-1">
//                               <Label className="text-xs font-medium text-gray-600">
//                                 Price
//                               </Label>
//                               <Input
//                                 placeholder="0.00"
//                                 type="number"
//                                 step="0.01"
//                                 value={material.price || ''}
//                                 onChange={(e) =>
//                                   updateMaterialSold(
//                                     index,
//                                     "price",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-9 text-sm"
//                               />
//                             </div>
//                           </div>
//                           <div className="space-y-1">
//                             <Label className="text-xs font-medium text-gray-600">
//                               Amount
//                             </Label>
//                             <Input
//                               readOnly
//                               value={material.amount || 0}
//                               className="bg-gray-100 h-9 text-sm"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
//                 <div className="flex flex-col sm:flex-row justify-end gap-3">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={onClose}
//                     className="px-8 py-3 order-2 sm:order-1"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={loading}
//                     className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg order-1 sm:order-2"
//                   >
//                     {loading ? (
//                       <div className="flex items-center gap-2">
//                         <Loader2 className="animate-spin h-5 w-5" />
//                         Saving...
//                       </div>
//                     ) : (
//                       <div className="flex items-center gap-2">
//                         <Save className="h-5 w-5" />
//                         {jobCard ? "Update Job Card" : "Create Job Card"}
//                       </div>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default JobCardForm;

"use client";

import React, { useState, useEffect } from "react";
import {
  useJobCards,
  type JobCardFormData,
  type PressingCharges,
  type MaterialSold,
  type JobCard,
} from "../../context/JobCardContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  X,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calendar,
  User,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { frappeAPI } from "../../api/frappeClient";

interface JobCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
}

const JobCardForm: React.FC<JobCardFormProps> = ({
  isOpen,
  onClose,
  jobCard,
}) => {
  const { createJobCard, updateJobCard, loading, fetchEmployees } =
    useJobCards();

  const [formData, setFormData] = useState<JobCardFormData>({
    date: new Date().toISOString().split("T")[0],
    building_name: "",
    property_no: "",
    area: "",
    party_name: "",
    start_date: "",
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
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
  const [fetchingLeadDetails, setFetchingLeadDetails] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [items, setItems] = useState<{
    item_name: string; name: string; valuation_rate?: number 
}[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch items with prices when component mounts
  // useEffect(() => {
  //   const fetchItems = async () => {
  //     setLoadingItems(true);
  //     try {
  //       const response = await frappeAPI.getItem();
  //       const itemsArray = Array.isArray(response.data) ? response.data : [response.data];
        
  //       // Filter for MDF-related items
  //       const filteredItems = itemsArray.filter((item: { name: string }) => {
  //         const name = item.name?.toLowerCase() || '';
  //         return (
  //           name.includes("6mm mr mdf") ||
  //           name.includes("mdf cladding") ||
  //           name.includes("veneer")
  //         );
  //       });

  //       // Fetch prices for all items
  //       const itemsWithPrices = await Promise.all(
  //         (filteredItems.length > 0 ? filteredItems : itemsArray).map(async (item: { name: any; }) => {
  //           try {
  //             const itemDetails = await frappeAPI.getItemById(item.name);
  //             return {
  //               ...item,
  //               valuation_rate: itemDetails.data.valuation_rate || 0
  //             };
  //           } catch (error) {
  //             console.error(`Failed to fetch price for item ${item.name}:`, error);
  //             return {
  //               ...item,
  //               valuation_rate: 0
  //             };
  //           }
  //         })
  //       );

  //       setItems(itemsWithPrices);
  //     } catch (error) {
  //       console.error("Failed to fetch items:", error);
  //       toast.error("Failed to load work type options");
  //     } finally {
  //       setLoadingItems(false);
  //     }
  //   };

  //   fetchItems();
  // }, []);
  useEffect(() => {
  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const response = await frappeAPI.getItem();
      const itemsData = response.data.data || [];
      
      // Map the items to include both name and item_name
      const formattedItems = itemsData.map((item: any) => ({
        name: item.name,
        item_name: item.item_name,
        valuation_rate: item.valuation_rate || 0
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Failed to load work type options");
    } finally {
      setLoadingItems(false);
    }
  };

  fetchItems();
}, []);

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load existing job card data when editing
  useEffect(() => {
    if (jobCard) {
      setFormData({
        ...jobCard,
        party_name: jobCard.party_name || "",
        prepared_by: jobCard.prepared_by || "",
        approved_by: jobCard.approved_by || "",
        project_id_no: jobCard.project_id_no || "",
        ac_v_no_and_date: jobCard.ac_v_no_and_date || "",
        pressing_charges: jobCard.pressing_charges || [],
        material_sold: jobCard.material_sold || [],
        lead_id: (jobCard as any).lead_id || "",
        customer_id: (jobCard as any).customer_id || "",
      });
      setSearchQuery(jobCard.party_name || "");
      setPressingCharges(jobCard.pressing_charges || []);
      setMaterialsSold(jobCard.material_sold || []);
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        building_name: "",
        property_no: "",
        area: "",
        party_name: "",
        start_date: "",
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
  }, [jobCard, isOpen]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleCustomerSearch();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleCustomerSearch = async () => {
    setSearchError(null);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await frappeAPI.getcustomer({
        mobile_no: searchQuery,
        email_id: searchQuery,
        customer_name: searchQuery,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      if (response.data.length === 0) {
        setSearchError("No customers found");
        setSearchResults([]);
        return;
      }

      // For each customer found, fetch their full details
      const detailedCustomers = await Promise.all(
        response.data.map(async (customer: { name: any }) => {
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

      // Filter out any failed requests
      const validCustomers = detailedCustomers.filter(
        (customer) => customer !== null
      );

      setSearchResults(validCustomers);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        error instanceof Error ? error.message : "Failed to search customers"
      );
    } finally {
      setIsSearching(false);
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

  // Fetch item price when work type is selected
  const fetchItemPrice = async (itemName: string) => {
    try {
      const response = await frappeAPI.getItemById(itemName);
      return response.data.valuation_rate || 0;
    } catch (error) {
      console.error("Failed to fetch item price:", error);
      return 0;
    }
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
    };
    setPressingCharges((prev) => [...prev, newCharge]);
  };

  const updatePressingCharge = async (
    index: number,
    field: keyof PressingCharges,
    value: string | number
  ) => {
    // If updating work_type, fetch and set the price automatically
    if (field === 'work_type' && typeof value === 'string' && value !== 'none') {
      const price = await fetchItemPrice(value);
      setPressingCharges((prev) =>
        prev.map((charge, i) => {
          if (i !== index) return charge;

          return {
            ...charge,
            work_type: value,
            price: price,
            amount: price * (Number(charge.no_of_sides) || 1)
          };
        })
      );
    } else {
      setPressingCharges((prev) =>
        prev.map((charge, i) => {
          if (i !== index) return charge;

          const updatedCharge = { ...charge, [field]: value };

          // Auto-calculate amount when price or no_of_sides changes
          if (field === 'price' || field === 'no_of_sides') {
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
    };
    setMaterialsSold((prev) => [...prev, newMaterial]);
  };

  const updateMaterialSold = async (
    index: number,
    field: keyof MaterialSold,
    value: string | number
  ) => {
    // If updating work_type, fetch and set the price automatically
    if (field === 'work_type' && typeof value === 'string' && value !== 'none') {
      const price = await fetchItemPrice(value);
      setMaterialsSold((prev) =>
        prev.map((material, i) => {
          if (i !== index) return material;

          return {
            ...material,
            work_type: value,
            price: price,
            amount: price * (Number(material.no_of_sides) || 1)
          };
        })
      );
    } else {
      setMaterialsSold((prev) =>
        prev.map((material, i) => {
          if (i !== index) return material;

          const updatedMaterial = { ...material, [field]: value };

          // Auto-calculate amount when price or no_of_sides changes
          if (field === 'price' || field === 'no_of_sides') {
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
      alert("Customer name is required");
      return false;
    }
    if (!formData.building_name) {
      alert("Building name is required");
      return false;
    }
    if (!formData.property_no) {
      alert("Property number is required");
      return false;
    }
    if (!formData.area) {
      alert("Area is required");
      return false;
    }
    if (!formData.start_date) {
      alert("Start date is required");
      return false;
    }
    if (!formData.finish_date) {
      alert("Finish date is required");
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 sm:inset-y-0 sm:right-0 w-full sm:max-w-6xl bg-white shadow-2xl sm:border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600 p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2 rounded-lg mt-1">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {jobCard ? "Edit Job Card" : "New Job Card"}
                </h3>
                <div className="flex items-center space-x-6 mt-1">
                  {formData.project_id_no && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-100">Project ID:</span>
                      <span className="text-sm font-medium">
                        {formData.project_id_no}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white font-medium">Date:</span>
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10 transition-colors"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-5xl mx-auto p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Basic Information
                    </h4>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 relative">
                      <Label
                        htmlFor="party_name"
                        className="flex items-center space-x-2"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <span>
                          Customer Name <span className="text-red-500">*</span>
                        </span>
                        {(fetchingCustomerDetails || fetchingLeadDetails) && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="party_name"
                          name="party_name"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          placeholder="Search by name, email or phone"
                          required
                          className="focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>

                      {searchError && (
                        <p className="text-xs text-red-500 mt-1">
                          {searchError}
                        </p>
                      )}

                      {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                          {searchResults.map((customer) => (
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
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="building_name"
                        className="flex items-center space-x-2"
                      >
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>
                          Building Name <span className="text-red-500">*</span>
                        </span>
                      </Label>
                      <Input
                        id="building_name"
                        name="building_name"
                        value={formData.building_name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter building name"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property_no">
                        Property No <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="property_no"
                        name="property_no"
                        value={formData.property_no || ""}
                        onChange={handleInputChange}
                        placeholder="Enter property number"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="area"
                        className="flex items-center space-x-2"
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>
                          Area <span className="text-red-500">*</span>
                        </span>
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        value={formData.area || ""}
                        onChange={handleInputChange}
                        placeholder="Enter area"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="w-[48%] space-y-2">
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
                          value={formData.start_date || ""}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>

                      <div className="w-[48%] space-y-2">
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
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pressing Charges Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Pressing Charges
                      </h4>
                    </div>
                    <Button
                      type="button"
                      onClick={addPressingCharge}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Charge
                    </Button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {pressingCharges.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No pressing charges added yet</p>
                      <p className="text-sm">
                        Click "Add Charge" to get started
                      </p>
                    </div>
                  ) : (
                    pressingCharges.map((charge, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">
                              Work Type
                            </Label>
                            {loadingItems ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" />
                                <span className="text-sm">
                                  Loading work types...
                                </span>
                              </div>
                            ) : (
                              // <Select
                              //   value={charge.work_type}
                              //   onValueChange={(value) =>
                              //     updatePressingCharge(
                              //       index,
                              //       "work_type",
                              //       value
                              //     )
                              //   }
                              // >
                              <Select
  value={charge.work_type}
  onValueChange={(value) => updatePressingCharge(index, "work_type", value)}
>
  <SelectTrigger className="h-9 text-sm">
    <SelectValue placeholder="Select work type" />
  </SelectTrigger>
  <SelectContent className="bg-white">
    <SelectItem value="none">Select work type</SelectItem>
    {items.map((item) => (
      <SelectItem key={item.name} value={item.name}>
        <div className="flex justify-between w-full">
          <span>{item.item_name || item.name}</span>
          <span className="text-gray-500 ml-2">
            ₹{item.valuation_rate || 0}
          </span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                                
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="space-y-1">
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
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
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
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-600">
                                No of Sides
                              </Label>
                              <Input
                                placeholder="No of Sides"
                                type="number"
                                min="1"
                                value={charge.no_of_sides || ''}
                                onChange={(e) =>
                                  updatePressingCharge(
                                    index,
                                    "no_of_sides",
                                    e.target.value
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-600">
                                Price
                              </Label>
                              <Input
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                value={charge.price || ''}
                                onChange={(e) =>
                                  updatePressingCharge(
                                    index,
                                    "price",
                                    e.target.value
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">
                              Amount
                            </Label>
                            <Input
                              readOnly
                              value={charge.amount || 0}
                              className="bg-gray-100 h-9 text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removePressingCharge(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Materials Sold Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Materials Sold
                      </h4>
                    </div>
                    <Button
                      type="button"
                      onClick={addMaterialSold}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Material
                    </Button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {materialsSold.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No materials added yet</p>
                      <p className="text-sm">
                        Click "Add Material" to get started
                      </p>
                    </div>
                  ) : (
                    materialsSold.map((material, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">
                              Work Type
                            </Label>
                            {loadingItems ? (
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
                                  updateMaterialSold(index, "work_type", value)
                                }
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Select work type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="none">
                                    Select work type
                                  </SelectItem>
                                  {items.map((item) => (
                                    <SelectItem
                                      key={item.name}
                                      value={item.name}
                                    >
                                      <div className="flex justify-between w-full">
                                        <span>{item.name}</span>
                                        <span className="text-gray-500 ml-2">
                                          ₹{item.valuation_rate || 0}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="space-y-1">
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
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-600">
                                Thickness
                              </Label>
                              <Input
                                placeholder="Thickness"
                                value={material.thickness}
                                onChange={(e) =>
                                  updateMaterialSold(
                                    index,
                                    "thickness",
                                    e.target.value
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-600">
                                No of Sides
                              </Label>
                              <Input
                                placeholder="No of Sides"
                                type="number"
                                min="1"
                                value={material.no_of_sides || ''}
                                onChange={(e) =>
                                  updateMaterialSold(
                                    index,
                                    "no_of_sides",
                                    e.target.value
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-600">
                                Price
                              </Label>
                              <Input
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                value={material.price || ''}
                                onChange={(e) =>
                                  updateMaterialSold(
                                    index,
                                    "price",
                                    e.target.value
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">
                              Amount
                            </Label>
                            <Input
                              readOnly
                              value={material.amount || 0}
                              className="bg-gray-100 h-9 text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeMaterialSold(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
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
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobCardForm;
