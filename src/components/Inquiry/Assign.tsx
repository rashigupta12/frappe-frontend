/* eslint-disable @typescript-eslint/no-unused-vars */
import { AlertCircle, ArrowLeft, Calendar, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAssign } from '../../context/TodoContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
// import { Input } from '../ui/input';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Calendar as CalendarComp } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

const Assign = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { inquiry } = location.state || {};
  const { user } = useAuth();

  const {
    fetchInspectors,
    inspectors,
    assignInquiry,
    loading,
    error,
    success,
    resetStatus
  } = useAssign();
  
  const [selectedInspector, setSelectedInspector] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // Default to 3 days from now

  useEffect(() => {
    if (!user) {
      return;
    }
    
    if (!inquiry) {
      console.error('No inquiry data found in location state');
      navigate('/inquiries');
      return;
    }
    
    fetchInspectors();
  }, [user, inquiry, navigate]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/inquiries');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async () => {
    if (!selectedInspector) {
      toast.error('Please select an inspector to assign this inquiry.');
      return;
    }

    if (!dueDate) {
      toast.error('Please select a due date for this assignment.');
      return;
    }

    const assignmentData = {
      allocated_to: selectedInspector,
      priority: priority,
      description: description || `Follow up with ${inquiry.lead_name} regarding their inquiry`,
      status: 'Open',
      date: new Date().toISOString().split('T')[0],
      due_date: format(dueDate, 'yyyy-MM-dd'),
      assigned_by: user || 'Administrator'
    };

    await assignInquiry(inquiry, assignmentData);
  };

  const handleCloseSuccess = () => {
    resetStatus();
    navigate('/inquiries');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="w-[400px]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to assign inquiries.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="w-[400px]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Inquiry Data</AlertTitle>
          <AlertDescription>
            No inquiry data found. Please select an inquiry to assign.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-1 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white ">
          <CardHeader className="bg-gray-50 rounded-t-lg ">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {/* <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Assign Inquiry</CardTitle>
                <CardDescription className="text-gray-600">
                  Assign this inquiry to an inspector with priority and due date
                </CardDescription>
              </div> */}
            </div>
          </CardHeader>
          
          <CardContent className=" space-y-6">
            {/* Customer Summary */}
            {/* <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Customer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{inquiry.lead_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{inquiry.email_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {inquiry.phone_number || inquiry.phone || inquiry.mobile_no}
                    </p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Inquiry Summary */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Home className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Job Type</p>
                    <p className="font-medium">{inquiry.custom_job_type}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Urgency</p>
                    <p className="font-medium">{inquiry.custom_urgency || 'Standard'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{inquiry.custom_location || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              {inquiry.custom_budget && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium">{inquiry.custom_budget}</p>
                    </div>
                  </div>
                </div>
              )}
            </div> */}

            {/* Assignment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Assignment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inspector */}
                <div className="space-y-2">
                  <Label htmlFor="inspector" className="text-gray-700">Inspector *</Label>
                  <Select 
                    value={selectedInspector} 
                    onValueChange={setSelectedInspector}
                    disabled={loading}
                  >
                    <SelectTrigger id="inspector" className="bg-white">
                      <SelectValue placeholder="Select inspector" />
                    </SelectTrigger>
                    <SelectContent className='bg-white' >
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.value} value={inspector.value}>
                          {inspector.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-gray-700">Priority</Label>
                  <Select 
                    value={priority} 
                    onValueChange={setPriority}
                    disabled={loading}
                  >
                    <SelectTrigger id="priority" className="bg-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="Low">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                          Low
                        </span>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="High">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-400"></span>
                          High
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-gray-700">Due Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white">
                      <CalendarComp
                      className='bg-white'
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        fromDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Assignment Notes */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700">Assignment Notes</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Provide specific instructions for ${inquiry.lead_name}'s inquiry`}
                  disabled={loading}
                  className="min-h-[100px] bg-white"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 p-6 bg-gray-50 rounded-b-lg">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              disabled={loading}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !selectedInspector || !dueDate}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Assigning...
                </div>
              ) : (
                "Assign Inquiry"
              )}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetStatus}
              className="mt-2"
            >
              Dismiss
            </Button>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Inquiry assigned successfully! Redirecting to inquiries page...
            </AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCloseSuccess}
              className="mt-2"
            >
              Go to Inquiries
            </Button>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Assign;