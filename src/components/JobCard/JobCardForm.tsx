// "use client";

// import React, { useState, useEffect } from 'react';
// import { 
//   useJobCards, 
//   type JobCardFormData, 
//   type PressingCharges, 
//   type MaterialSold,
//   type JobCard 
// } from '../../context/JobCardContext';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { Label } from '../ui/label';
// import { Textarea } from '../ui/textarea';
// import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';

// interface JobCardFormProps {
//   isOpen: boolean;
//   onClose: () => void;
//   jobCard?: JobCard | null;
// }

// const JobCardForm: React.FC<JobCardFormProps> = ({ isOpen, onClose, jobCard }) => {
//   const { createJobCard, updateJobCard, loading } = useJobCards();
  
//   const [formData, setFormData] = useState<JobCardFormData>({
//     date: new Date().toISOString().split('T')[0],
//     building_name: '',
//     property_no: '',
//     area: '',
//     custom_customer_name: '',
//     start_date: '',
//     finish_date: '',
//     custom_prepared_by: '',
//     custom_approved_by: '',
//     custom_project_id_no_: '',
//     custom_ac_v_no__date: '',
//     custom_pressing_charges: [],
//     custom_materials_sold: [],
//   });

//   const [pressingCharges, setPressingCharges] = useState<PressingCharges[]>([]);
//   const [materialsSold, setMaterialsSold] = useState<MaterialSold[]>([]);

//   // Load existing job card data when editing
//   useEffect(() => {
//     if (jobCard) {
//       setFormData({
//         ...jobCard,
//         custom_pressing_charges: jobCard.custom_pressing_charges || [],
//         custom_materials_sold: jobCard.custom_materials_sold || [],
//       });
//       setPressingCharges(jobCard.custom_pressing_charges || []);
//       setMaterialsSold(jobCard.custom_materials_sold || []);
//     } else {
//       // Reset form for new job card
//       setFormData({
//         date: new Date().toISOString().split('T')[0],
//         building_name: '',
//         property_no: '',
//         area: '',
//         custom_customer_name: '',
//         start_date: '',
//         finish_date: '',
//         custom_prepared_by: '',
//         custom_approved_by: '',
//         custom_project_id_no_: '',
//         custom_ac_v_no__date: '',
//         custom_pressing_charges: [],
//         custom_materials_sold: [],
//       });
//       setPressingCharges([]);
//       setMaterialsSold([]);
//     }
//   }, [jobCard, isOpen]);

// //   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
// //     const { name, value } = e.target;
// //     setFormData(prev => ({ ...prev, [name]: value }));
// //   };
// // Make sure handleInputChange is working
// const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//   const { name, value } = e.target;
//   console.log(`🔄 Input changed - ${name}:`, value); // Debug log
//   setFormData(prev => ({ ...prev, [name]: value }));
// };

// // Also check if form inputs have correct name attributes
// <Input
//   id="custom_customer_name"
//   name="custom_customer_name" // Make sure this matches your state keys
//   value={formData.custom_customer_name || ''}
//   onChange={handleInputChange}
//   placeholder="Enter customer name"
//   required
// />

//   // Pressing Charges functions
//   const addPressingCharge = () => {
//     const newCharge: PressingCharges = {
//       work_type: '',
//       size: '',
//       thickness: '',
//       no_of_sides: '',
//       price: 0,
//       amount: 0,
//     };
//     setPressingCharges(prev => [...prev, newCharge]);
//   };

//   const updatePressingCharge = (index: number, field: keyof PressingCharges, value: string | number) => {
//     setPressingCharges(prev => prev.map((charge, i) => 
//       i === index ? { ...charge, [field]: value } : charge
//     ));
//   };

//   const removePressingCharge = (index: number) => {
//     setPressingCharges(prev => prev.filter((_, i) => i !== index));
//   };

//   // Materials Sold functions
//   const addMaterialSold = () => {
//     const newMaterial: MaterialSold = {
//       work_type: '',
//       size: '',
//       thickness: '',
//       no_of_sides: '',
//       price: 0,
//       amount: 0,
//     };
//     setMaterialsSold(prev => [...prev, newMaterial]);
//   };

//   const updateMaterialSold = (index: number, field: keyof MaterialSold, value: string | number) => {
//     setMaterialsSold(prev => prev.map((material, i) => 
//       i === index ? { ...material, [field]: value } : material
//     ));
//   };

//   const removeMaterialSold = (index: number) => {
//     setMaterialsSold(prev => prev.filter((_, i) => i !== index));
//   };

//   const validateForm = (): boolean => {
//     if (!formData.custom_customer_name) {
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

// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
    
// //     if (!validateForm()) return;

// //     try {
// //       const submissionData = {
// //         ...formData,
// //          doctype: "Job Card -Veneer Pressing",
// //         custom_pressing_charges: pressingCharges,
// //         custom_materials_sold: materialsSold,
// //       };

// //       if (jobCard?.name) {
// //         await updateJobCard(jobCard.name, submissionData);
// //       } else {
// //         await createJobCard(submissionData);
// //       }
      
// //       onClose();
// //     } catch (error) {
// //       console.error('Error submitting job card:', error);
// //     }
// //   };
// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
  
//   if (!validateForm()) return;

//   try {
//     const submissionData = {
//       ...formData,
//       custom_pressing_charges: pressingCharges,
//       custom_materials_sold: materialsSold,
//     };

//     console.log('🔍 Final submission data:', submissionData);

//     if (jobCard?.name) {
//       const result = await updateJobCard(jobCard.name, submissionData);
//       console.log('✅ Update result:', result);
//     } else {
//       const result = await createJobCard(submissionData);
//       console.log('✅ Create result:', result);
//     }
    
//     onClose();
//   } catch (error) {
//     console.error('❌ Form submission error:', error);
    
//     // Type-safe error handling
//     if (error instanceof Error) {
//       console.error('📋 Error message:', error.message);
//     }
    
//     // For axios errors (if using axios)
//     if (typeof error === 'object' && error !== null && 'response' in error) {
//       const axiosError = error as any;
//       console.error('📋 Error details:', {
//         message: axiosError.message,
//         response: axiosError.response?.data,
//         status: axiosError.response?.status
//       });
//     }
//   }
// };





//   if (!isOpen) return null;

//   return (
//     <>
//       <div
//         className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 z-40 transition-opacity duration-300"
//         onClick={onClose}
//       />

//       <div
//         className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50"
//         style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
//       >
//         <div className="flex flex-col h-full">
//           <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white">
//             <div className="flex justify-between items-center">
//               <h3 className="text-xl font-semibold">
//                 {jobCard ? "Edit Job Card" : "New Job Card"}
//               </h3>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
//                 onClick={onClose}
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>

//           <div className="p-6 flex-1 overflow-y-auto">
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Basic Information */}
//               <div className="space-y-4">
//                 <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="date"
//                       name="date"
//                       type="date"
//                       value={formData.date || ''}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="custom_customer_name">Customer Name <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="custom_customer_name"
//                       name="custom_customer_name"
//                       value={formData.custom_customer_name || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter customer name"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="building_name">Building Name <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="building_name"
//                       name="building_name"
//                       value={formData.building_name || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter building name"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="property_no">Property No <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="property_no"
//                       name="property_no"
//                       value={formData.property_no || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter property number"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="area">Area <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="area"
//                       name="area"
//                       value={formData.area || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter area"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="custom_project_id_no_">Project ID No</Label>
//                     <Input
//                       id="custom_project_id_no_"
//                       name="custom_project_id_no_"
//                       value={formData.custom_project_id_no_ || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter project ID"
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="start_date"
//                       name="start_date"
//                       type="date"
//                       value={formData.start_date || ''}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="finish_date">Finish Date <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="finish_date"
//                       name="finish_date"
//                       type="date"
//                       value={formData.finish_date || ''}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="custom_prepared_by">Prepared By</Label>
//                     <Input
//                       id="custom_prepared_by"
//                       name="custom_prepared_by"
//                       value={formData.custom_prepared_by || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter preparer name"
//                     />
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="custom_approved_by">Approved By</Label>
//                     <Input
//                       id="custom_approved_by"
//                       name="custom_approved_by"
//                       value={formData.custom_approved_by || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter approver name"
//                     />
//                   </div>
                  
//                   <div className="md:col-span-2">
//                     <Label htmlFor="custom_ac_v_no__date">AC V No / Date</Label>
//                     <Input
//                       id="custom_ac_v_no__date"
//                       name="custom_ac_v_no__date"
//                       value={formData.custom_ac_v_no__date || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter AC V number/date"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Pressing Charges Section */}
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <h4 className="text-lg font-semibold text-gray-900">Pressing Charges</h4>
//                   <Button type="button" onClick={addPressingCharge} size="sm">
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Pressing Charge
//                   </Button>
//                 </div>
                
//                 {pressingCharges.map((charge, index) => (
//                   <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
//                     <div className="col-span-2">
//                       <Label>Work Type</Label>
//                       <Input
//                         placeholder="Work Type"
//                         value={charge.work_type}
//                         onChange={(e) => updatePressingCharge(index, 'work_type', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>Size</Label>
//                       <Input
//                         placeholder="Size"
//                         value={charge.size}
//                         onChange={(e) => updatePressingCharge(index, 'size', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>Thickness</Label>
//                       <Input
//                         placeholder="Thickness"
//                         value={charge.thickness}
//                         onChange={(e) => updatePressingCharge(index, 'thickness', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>No of Sides</Label>
//                       <Input
//                         placeholder="No of Sides"
//                         value={charge.no_of_sides}
//                         onChange={(e) => updatePressingCharge(index, 'no_of_sides', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>Price</Label>
//                       <Input
//                         placeholder="Price"
//                         type="number"
//                         step="0.01"
//                         value={charge.price}
//                         onChange={(e) => updatePressingCharge(index, 'price', Number(e.target.value))}
//                       />
//                     </div>
//                     <div className="col-span-1">
//                       <Label>Amount</Label>
//                       <Input
//                         placeholder="Amount"
//                         type="number"
//                         step="0.01"
//                         value={charge.amount}
//                         onChange={(e) => updatePressingCharge(index, 'amount', Number(e.target.value))}
//                       />
//                     </div>
//                     <div className="col-span-1">
//                       <Button 
//                         type="button" 
//                         variant="destructive" 
//                         size="sm"
//                         onClick={() => removePressingCharge(index)}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Materials Sold Section */}
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <h4 className="text-lg font-semibold text-gray-900">Materials Sold</h4>
//                   <Button type="button" onClick={addMaterialSold} size="sm">
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Material
//                   </Button>
//                 </div>
                
//                 {materialsSold.map((material, index) => (
//                   <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
//                     <div className="col-span-2">
//                       <Label>Work Type</Label>
//                       <Input
//                         placeholder="Work Type"
//                         value={material.work_type}
//                         onChange={(e) => updateMaterialSold(index, 'work_type', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>Size</Label>
//                       <Input
//                         placeholder="Size"
//                         value={material.size}
//                         onChange={(e) => updateMaterialSold(index, 'size', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>Thickness</Label>
//                       <Input
//                         placeholder="Thickness"
//                         value={material.thickness}
//                         onChange={(e) => updateMaterialSold(index, 'thickness', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>No of Sides</Label>
//                       <Input
//                         placeholder="No of Sides"
//                         value={material.no_of_sides}
//                         onChange={(e) => updateMaterialSold(index, 'no_of_sides', e.target.value)}
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <Label>Price</Label>
//                       <Input
//                         placeholder="Price"
//                         type="number"
//                         step="0.01"
//                         value={material.price}
//                         onChange={(e) => updateMaterialSold(index, 'price', Number(e.target.value))}
//                       />
//                     </div>
//                     <div className="col-span-1">
//                       <Label>Amount</Label>
//                       <Input
//                         placeholder="Amount"
//                         type="number"
//                         step="0.01"
//                         value={material.amount}
//                         onChange={(e) => updateMaterialSold(index, 'amount', Number(e.target.value))}
//                       />
//                     </div>
//                     <div className="col-span-1">
//                       <Button 
//                         type="button" 
//                         variant="destructive" 
//                         size="sm"
//                         onClick={() => removeMaterialSold(index)}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={onClose}
//                   className="px-6"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="px-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
//                 >
//                   {loading ? (
//                     <div className="flex items-center gap-2">
//                       <Loader2 className="animate-spin h-4 w-4" />
//                       Saving...
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-2">
//                       <Save className="h-4 w-4" />
//                       {jobCard ? "Update" : "Create"} Job Card
//                     </div>
//                   )}
//                 </Button>
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

import React, { useState, useEffect } from 'react';
import { 
  useJobCards, 
  type JobCardFormData, 
  type PressingCharges, 
  type MaterialSold,
  type JobCard 
} from '../../context/JobCardContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface JobCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
}

const JobCardForm: React.FC<JobCardFormProps> = ({ isOpen, onClose, jobCard }) => {
  const { createJobCard, updateJobCard, loading } = useJobCards();
  
  const [formData, setFormData] = useState<JobCardFormData>({
    date: new Date().toISOString().split('T')[0],
    building_name: '',
    property_no: '',
    area: '',
    party_name: '', // Changed from custom_customer_name
    start_date: '',
    finish_date: '',
    prepared_by: '', // Changed from custom_prepared_by
    approved_by: '', // Changed from custom_approved_by
    project_id_no: '', // Changed from custom_project_id_no_
    ac_v_no_and_date: '', // Changed from custom_ac_v_no__date
    pressing_charges: [],
    material_sold: [],
  });

  const [pressingCharges, setPressingCharges] = useState<PressingCharges[]>([]);
  const [materialsSold, setMaterialsSold] = useState<MaterialSold[]>([]);

  // Load existing job card data when editing
  useEffect(() => {
    if (jobCard) {
      setFormData({
        ...jobCard,
        party_name: jobCard.party_name || '',
        prepared_by: jobCard.prepared_by ||  '',
        approved_by: jobCard.approved_by ||  '',
        project_id_no: jobCard.project_id_no ||  '',
        ac_v_no_and_date: jobCard.ac_v_no_and_date ||  '',
        pressing_charges:  jobCard.pressing_charges || [],
        material_sold:  jobCard.material_sold || [],
      });
      setPressingCharges(jobCard.pressing_charges || []);
      setMaterialsSold(jobCard.material_sold || []);
    } else {
      // Reset form for new job card
      setFormData({
        date: new Date().toISOString().split('T')[0],
        building_name: '',
        property_no: '',
        area: '',
        party_name: '',
        start_date: '',
        finish_date: '',
        prepared_by: '',
        approved_by: '',
        project_id_no: '',
        ac_v_no_and_date: '',
        pressing_charges: [],
        material_sold: [],
      });
      setPressingCharges([]);
      setMaterialsSold([]);
    }
  }, [jobCard, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`🔄 Input changed - ${name}:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Pressing Charges functions
  const addPressingCharge = () => {
    const newCharge: PressingCharges = {
      work_type: '',
      size: '',
      thickness: '',
      no_of_sides: '',
      price: 0,
      amount: 0,
    };
    setPressingCharges(prev => [...prev, newCharge]);
  };

  const updatePressingCharge = (index: number, field: keyof PressingCharges, value: string | number) => {
    setPressingCharges(prev => prev.map((charge, i) => 
      i === index ? { ...charge, [field]: value } : charge
    ));
  };

  const removePressingCharge = (index: number) => {
    setPressingCharges(prev => prev.filter((_, i) => i !== index));
  };

  // Materials Sold functions
  const addMaterialSold = () => {
    const newMaterial: MaterialSold = {
      work_type: '',
      size: '',
      thickness: '',
      no_of_sides: '',
      price: 0,
      amount: 0,
    };
    setMaterialsSold(prev => [...prev, newMaterial]);
  };

  const updateMaterialSold = (index: number, field: keyof MaterialSold, value: string | number) => {
    setMaterialsSold(prev => prev.map((material, i) => 
      i === index ? { ...material, [field]: value } : material
    ));
  };

  const removeMaterialSold = (index: number) => {
    setMaterialsSold(prev => prev.filter((_, i) => i !== index));
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
      // Transform data to match the expected API structure
    // In your handleSubmit function, try simplifying the data structure first:
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
  // Try sending these as simple arrays first
  pressing_charges: pressingCharges,
  material_sold: materialsSold
};


      console.log('🔍 Final submission data:', submissionData);

      if (jobCard?.name) {
        const result = await updateJobCard(jobCard.name, submissionData);
        console.log('✅ Update result:', result);
      } else {
        const result = await createJobCard(submissionData);
        console.log('✅ Create result:', result);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Form submission error:', error);
      
      if (error instanceof Error) {
        console.error('📋 Error message:', error.message);
        alert(`Error: ${error.message}`);
      }
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        console.error('📋 Error details:', {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status
        });
        alert(`API Error: ${axiosError.response?.data?.message || axiosError.message}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex flex-col h-full">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {jobCard ? "Edit Job Card" : "New Job Card"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="party_name">Customer Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="party_name"
                      name="party_name"
                      value={formData.party_name || ''}
                      onChange={handleInputChange}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="building_name">Building Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="building_name"
                      name="building_name"
                      value={formData.building_name || ''}
                      onChange={handleInputChange}
                      placeholder="Enter building name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="property_no">Property No <span className="text-red-500">*</span></Label>
                    <Input
                      id="property_no"
                      name="property_no"
                      value={formData.property_no || ''}
                      onChange={handleInputChange}
                      placeholder="Enter property number"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="area">Area <span className="text-red-500">*</span></Label>
                    <Input
                      id="area"
                      name="area"
                      value={formData.area || ''}
                      onChange={handleInputChange}
                      placeholder="Enter area"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="project_id_no">Project ID No</Label>
                    <Input
                      id="project_id_no"
                      name="project_id_no"
                      value={formData.project_id_no || ''}
                      onChange={handleInputChange}
                      placeholder="Enter project ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="finish_date">Finish Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="finish_date"
                      name="finish_date"
                      type="date"
                      value={formData.finish_date || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="prepared_by">Prepared By</Label>
                    <Input
                      id="prepared_by"
                      name="prepared_by"
                      value={formData.prepared_by || ''}
                      onChange={handleInputChange}
                      placeholder="Enter preparer name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="approved_by">Approved By</Label>
                    <Input
                      id="approved_by"
                      name="approved_by"
                      value={formData.approved_by || ''}
                      onChange={handleInputChange}
                      placeholder="Enter approver name"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="ac_v_no_and_date">AC V No / Date</Label>
                    <Input
                      id="ac_v_no_and_date"
                      name="ac_v_no_and_date"
                      value={formData.ac_v_no_and_date || ''}
                      onChange={handleInputChange}
                      placeholder="Enter AC V number/date"
                    />
                  </div>
                </div>
              </div>

              {/* Pressing Charges Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Pressing Charges</h4>
                  <Button type="button" onClick={addPressingCharge} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pressing Charge
                  </Button>
                </div>
                
                {pressingCharges.map((charge, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                    <div className="col-span-2">
                      <Label>Work Type</Label>
                      <Input
                        placeholder="Work Type"
                        value={charge.work_type}
                        onChange={(e) => updatePressingCharge(index, 'work_type', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Size</Label>
                      <Input
                        placeholder="Size"
                        value={charge.size}
                        onChange={(e) => updatePressingCharge(index, 'size', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Thickness</Label>
                      <Input
                        placeholder="Thickness"
                        value={charge.thickness}
                        onChange={(e) => updatePressingCharge(index, 'thickness', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>No of Sides</Label>
                      <Input
                        placeholder="No of Sides"
                        value={charge.no_of_sides}
                        onChange={(e) => updatePressingCharge(index, 'no_of_sides', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Price</Label>
                      <Input
                        placeholder="Price"
                        type="number"
                        step="0.01"
                        value={charge.price}
                        onChange={(e) => updatePressingCharge(index, 'price', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>Amount</Label>
                      <Input
                        placeholder="Amount"
                        type="number"
                        step="0.01"
                        value={charge.amount}
                        onChange={(e) => updatePressingCharge(index, 'amount', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removePressingCharge(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Materials Sold Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Materials Sold</h4>
                  <Button type="button" onClick={addMaterialSold} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>
                
                {materialsSold.map((material, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                    <div className="col-span-2">
                      <Label>Work Type</Label>
                      <Input
                        placeholder="Work Type"
                        value={material.work_type}
                        onChange={(e) => updateMaterialSold(index, 'work_type', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Size</Label>
                      <Input
                        placeholder="Size"
                        value={material.size}
                        onChange={(e) => updateMaterialSold(index, 'size', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Thickness</Label>
                      <Input
                        placeholder="Thickness"
                        value={material.thickness}
                        onChange={(e) => updateMaterialSold(index, 'thickness', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>No of Sides</Label>
                      <Input
                        placeholder="No of Sides"
                        value={material.no_of_sides}
                        onChange={(e) => updateMaterialSold(index, 'no_of_sides', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Price</Label>
                      <Input
                        placeholder="Price"
                        type="number"
                        step="0.01"
                        value={material.price}
                        onChange={(e) => updateMaterialSold(index, 'price', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>Amount</Label>
                      <Input
                        placeholder="Amount"
                        type="number"
                        step="0.01"
                        value={material.amount}
                        onChange={(e) => updateMaterialSold(index, 'amount', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeMaterialSold(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {jobCard ? "Update" : "Create"} Job Card
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobCardForm;