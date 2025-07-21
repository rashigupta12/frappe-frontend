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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Plus, Trash2, Save, Loader2, Calendar, User, Building, MapPin, FileText, DollarSign } from 'lucide-react';

interface JobCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
}

const JobCardForm: React.FC<JobCardFormProps> = ({ isOpen, onClose, jobCard }) => {
  const { createJobCard, updateJobCard, loading, employees, fetchEmployees } = useJobCards();

  const [formData, setFormData] = useState<JobCardFormData>({
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

  const [pressingCharges, setPressingCharges] = useState<PressingCharges[]>([]);
  const [materialsSold, setMaterialsSold] = useState<MaterialSold[]>([]);

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load existing job card data when editing
  useEffect(() => {
    if (jobCard) {
      setFormData({
        ...jobCard,
        party_name: jobCard.party_name || '',
        prepared_by: jobCard.prepared_by || '',
        approved_by: jobCard.approved_by || '',
        project_id_no: jobCard.project_id_no || '',
        ac_v_no_and_date: jobCard.ac_v_no_and_date || '',
        pressing_charges: jobCard.pressing_charges || [],
        material_sold: jobCard.material_sold || [],
      });
      setPressingCharges(jobCard.pressing_charges || []);
      setMaterialsSold(jobCard.material_sold || []);
    } else {
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

  const handleSelectChange = (field: string, value: string) => {
    console.log(`🔄 Select changed - ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to get employee name for display
  const getEmployeeDisplayName = (employeeId: string) => {
    const employee = employees.find(emp => emp.name === employeeId);
    return employee ? employee.employee_name : employeeId;
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 sm:inset-y-0 sm:right-0 w-full sm:max-w-6xl bg-white shadow-2xl sm:border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600 p-6 ">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {jobCard ? "Edit Job Card" : "New Job Card"}
                </h3>
                <p className="text-blue-100 text-sm">Veneer Pressing Details</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full text-white hover:bg-white/10 transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
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
                    <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Date <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date || ''}
                        onChange={handleInputChange}
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="party_name" className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>Customer Name <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="party_name"
                        name="party_name"
                        value={formData.party_name || ''}
                        onChange={handleInputChange}
                        placeholder="Enter customer name"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="building_name" className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>Building Name <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="building_name"
                        name="building_name"
                        value={formData.building_name || ''}
                        onChange={handleInputChange}
                        placeholder="Enter building name"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property_no">Property No <span className="text-red-500">*</span></Label>
                      <Input
                        id="property_no"
                        name="property_no"
                        value={formData.property_no || ''}
                        onChange={handleInputChange}
                        placeholder="Enter property number"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area" className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>Area <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        value={formData.area || ''}
                        onChange={handleInputChange}
                        placeholder="Enter area"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project_id_no">Project ID No</Label>
                      <Input
                        id="project_id_no"
                        name="project_id_no"
                        value={formData.project_id_no || ''}
                        onChange={handleInputChange}
                        placeholder="Enter project ID"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {/* <div className='flex gap-1'>
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Start Date <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        value={formData.start_date || ''}
                        onChange={handleInputChange}
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="finish_date" className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Finish Date <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="finish_date"
                        name="finish_date"
                        type="date"
                        value={formData.finish_date || ''}
                        onChange={handleInputChange}
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    </div>
                     */}
                    <div className="flex flex-wrap gap-2">
                      {/* Start Date */}
                      <div className="w-[48%] space-y-2">
                        <Label htmlFor="start_date" className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Start Date <span className="text-red-500">*</span></span>
                        </Label>
                        <Input
                          id="start_date"
                          name="start_date"
                          type="date"
                          value={formData.start_date || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>

                      {/* Finish Date */}
                      <div className="w-[48%] space-y-2">
                        <Label htmlFor="finish_date" className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Finish Date <span className="text-red-500">*</span></span>
                        </Label>
                        <Input
                          id="finish_date"
                          name="finish_date"
                          type="date"
                          value={formData.finish_date || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>
                    </div>

<div className='flex gap-2'>
  {/* Prepared By Dropdown - Using Employee ID */}
  <div className="space-y-2">
    <Label htmlFor="prepared_by">Prepared By</Label>
    <Select
      value={formData.prepared_by || 'none'}
      onValueChange={(value) => handleSelectChange('prepared_by', value === 'none' ? '' : value)}
    >
      <SelectTrigger className="focus:ring-blue-500 bg-white focus:border-blue-500">
        <SelectValue placeholder="Select preparer">
          {formData.prepared_by && formData.prepared_by !== 'none'
            ? getEmployeeDisplayName(formData.prepared_by)
            : "Select preparer"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent  className="bg-white">
        <SelectItem value="none">Select preparer</SelectItem>
        {employees.filter(employee => employee.employee_name && employee.name).map((employee) => (
          <SelectItem key={employee.name} value={employee.name}>
            {employee.employee_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Approved By Dropdown - Using Employee ID */}
  <div className="space-y-2">
    <Label htmlFor="approved_by">Approved By</Label>
    <Select
      value={formData.approved_by || 'none'}
      onValueChange={(value) => handleSelectChange('approved_by', value === 'none' ? '' : value)}
    >
      <SelectTrigger className="focus:ring-blue-500 bg-white focus:border-blue-500">
        <SelectValue placeholder="Select approver">
          {formData.approved_by && formData.approved_by !== 'none'
            ? getEmployeeDisplayName(formData.approved_by)
            : "Select approver"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent  className="bg-white">
        <SelectItem value="none">Select approver</SelectItem>
        {employees.filter(employee => employee.employee_name && employee.name).map((employee) => (
          <SelectItem key={employee.name} value={employee.name}>
            {employee.employee_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>


                    <div className="space-y-2">
                      <Label htmlFor="ac_v_no_and_date">AC V No / Date</Label>
                      <Input
                        id="ac_v_no_and_date"
                        name="ac_v_no_and_date"
                        value={formData.ac_v_no_and_date || ''}
                        onChange={handleInputChange}
                        placeholder="Enter AC V number/date"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
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
                      <h4 className="text-lg font-semibold text-gray-900">Pressing Charges</h4>
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
                      <p className="text-sm">Click "Add Charge" to get started</p>
                    </div>
                  ) : (
                    pressingCharges.map((charge, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Work Type</Label>
                            <Input
                              placeholder="Work Type"
                              value={charge.work_type}
                              onChange={(e) => updatePressingCharge(index, 'work_type', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className='flex gap-2'>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Size</Label>
                            <Input
                              placeholder="Size"
                              value={charge.size}
                              onChange={(e) => updatePressingCharge(index, 'size', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Thickness</Label>
                            <Input
                              placeholder="Thickness"
                              value={charge.thickness}
                              onChange={(e) => updatePressingCharge(index, 'thickness', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          </div>
                           <div className='flex gap-2'>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">No of Sides</Label>
                            <Input
                              placeholder="No of Sides"
                              value={charge.no_of_sides}
                              onChange={(e) => updatePressingCharge(index, 'no_of_sides', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Price</Label>
                            <Input
                              placeholder="0.00"
                              type="number"
                              step="0.01"
                              value={charge.price}
                              onChange={(e) => updatePressingCharge(index, 'price', Number(e.target.value))}
                              className="h-9 text-sm"
                            />
                          </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Amount</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                value={charge.amount}
                                onChange={(e) => updatePressingCharge(index, 'amount', Number(e.target.value))}
                                className="h-9 text-sm"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removePressingCharge(index)}
                                className="h-9 w-9 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                      <h4 className="text-lg font-semibold text-gray-900">Materials Sold</h4>
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
                      <p className="text-sm">Click "Add Material" to get started</p>
                    </div>
                  ) : (
                    materialsSold.map((material, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Work Type</Label>
                            <Input
                              placeholder="Work Type"
                              value={material.work_type}
                              onChange={(e) => updateMaterialSold(index, 'work_type', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                           <div className='flex gap-2'>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Size</Label>
                            <Input
                              placeholder="Size"
                              value={material.size}
                              onChange={(e) => updateMaterialSold(index, 'size', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Thickness</Label>
                            <Input
                              placeholder="Thickness"
                              value={material.thickness}
                              onChange={(e) => updateMaterialSold(index, 'thickness', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                           </div>
                            <div className='flex gap-2'>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">No of Sides</Label>
                            <Input
                              placeholder="No of Sides"
                              value={material.no_of_sides}
                              onChange={(e) => updateMaterialSold(index, 'no_of_sides', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Price</Label>
                            <Input
                              placeholder="0.00"
                              type="number"
                              step="0.01"
                              value={material.price}
                              onChange={(e) => updateMaterialSold(index, 'price', Number(e.target.value))}
                              className="h-9 text-sm"
                            />
                          </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">Amount</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                value={material.amount}
                                onChange={(e) => updateMaterialSold(index, 'amount', Number(e.target.value))}
                                className="h-9 text-sm"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMaterialSold(index)}
                                className="h-9 w-9 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
