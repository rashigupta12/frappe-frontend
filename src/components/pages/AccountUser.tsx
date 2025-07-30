// import {
//   CreditCard,
//   FileText,
//   LogOut,
//   Menu,
//   X,
// } from "lucide-react";
// import { useEffect, useState, type SetStateAction } from "react";
// import { Link, useNavigate, useSearchParams } from "react-router-dom";

// import { useAuth } from "../../context/AuthContext";
// import { Button } from "../ui/button";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

// // import PaymentSummary from "../account/PaymentSummary";
// import PaymentForm from "../account/Paytmentform";
// import PaymentContainer from "../account/PaymentContainer";

// export default function AccountDashboard() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { user, logout } = useAuth();

//   const initialTab = searchParams.get("tab") || "payment"|| "summary" || "receipt";
//   const [activeTab, setActiveTab] = useState(initialTab);
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     setActiveTab(initialTab);
//   }, [initialTab]);

//   const handleTabChange = (tab: SetStateAction<string>) => {
//     setActiveTab(tab);
//     navigate(`/accountUser?tab=${tab}`, { replace: true });
//     setSidebarOpen(false); // Close sidebar on mobile after selection
//   };

//   const handleLogout = async () => {
//     await logout();
//     navigate("/");
//   };

//   const renderContent = () => {
//     switch (activeTab) {
//       case "payment":
//         return <PaymentForm />;
//       case "summary":
//         return (
//           <PaymentContainer />
//         );
//       case "receipt":
//         return(
//           <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
//             <h2 className="text-2xl font-bold text-emerald-800 mb-4">
//               Receipt
//             </h2>
//             <p className="text-emerald-600">
//               Your receipt will be displayed here.
//             </p>
//           </div>
//         )
//       default:
//         return (
//           <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
//             <h2 className="text-2xl font-bold text-emerald-800 mb-4">
//               Account Dashboard
//             </h2>
//             <p className="text-emerald-600">
//               Welcome to your account dashboard.
//             </p>
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* Top Navigation Bar - Fixed */}
//       <nav className="bg-white shadow-lg border-b-2 border-emerald-200 px-3 sm:px-4 py-2 flex-shrink-0 z-50">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2 sm:gap-3">
//             {/* Mobile Menu Button */}
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="lg:hidden p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
//             >
//               {sidebarOpen ? (
//                 <X className="h-5 w-5" />
//               ) : (
//                 <Menu className="h-5 w-5" />
//               )}
//             </Button>

//             {/* Logo */}
//             <Link to="/" className="flex items-center gap-1.5">
//               <div className="rounded-lg p-1 flex items-center justify-center">
//                 <img
//                   src="/logo.jpg"
//                   alt="Logo"
//                   className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
//                 />
//               </div>
//             </Link>
//           </div>

//           {/* Title - Visible on all screens */}
//           <h1 className="text-center text-lg sm:text-xl font-bold text-emerald-800">
//             Account Dashboard
//           </h1>

//           {/* User Menu */}
//           <div className="flex items-center gap-1 sm:gap-2">
//             {/* Mobile Logout Button */}
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={handleLogout}
//               className="lg:hidden p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
//             >
//               <LogOut className="h-4 w-4" />
//               <span className="sr-only">Logout</span>
//             </Button>

//             {/* Desktop User Menu */}
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="hidden lg:flex items-center gap-1 hover:bg-emerald-50 rounded-lg px-2 py-1.5 transition-colors"
//                 >
//                   <span className="text-sm text-emerald-700 font-medium">
//                     {user?.full_name || user?.username || "User"}
//                   </span>
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent
//                 className="w-48 border border-emerald-200 bg-white shadow-md"
//                 align="end"
//               >
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={handleLogout}
//                   className="w-full justify-start gap-2 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
//                 >
//                   <LogOut className="h-4 w-4" />
//                   Logout
//                 </Button>
//               </PopoverContent>
//             </Popover>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content Area with Sidebar */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Mobile Sidebar Overlay */}
//         {sidebarOpen && (
//           <div
//             className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40 lg:hidden"
//             onClick={() => setSidebarOpen(false)}
//           />
//         )}

//         {/* Sidebar - Fixed on desktop, overlay on mobile */}
//         <aside
//           className={`
//             fixed lg:relative z-40 w-64 bg-white border-r-2 border-emerald-200 
//             h-full p-4 shadow-lg lg:shadow-none overflow-y-auto flex-shrink-0
//             transform transition-transform duration-300 ease-in-out lg:transform-none
//             ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
//           `}
//         >
//           <nav className="space-y-2 mt-2">
//             <Button
//               variant={activeTab === "payment" ? "default" : "ghost"}
//               onClick={() => handleTabChange("payment")}
//               className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
//                 activeTab === "payment"
//                   ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600"
//                   : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
//               }`}
//             >
//               <CreditCard className="h-5 w-5" />
//               <span className="font-medium">Payment</span>
//             </Button>

//             {/* Summary Button */}
//             <Button
//               variant={activeTab === "summary" ? "default" : "ghost"}
//               onClick={() => handleTabChange("summary")}
//               className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
//                 activeTab === "summary"
//                   ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600"
//                   : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
//               }`}
//             >
//               <FileText className="h-5 w-5" />
//               <span className="font-medium">Summary</span>
//             </Button>
//               <Button
//               variant={activeTab === "receipt" ? "default" : "ghost"}
//               onClick={() => handleTabChange("receipt")}
//               className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
//                 activeTab === "receipt"
//                   ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600"
//                   : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
//               }`}
//             >
//               <FileText className="h-5 w-5" />
//               <span className="font-medium">receipt</span>
//             </Button>
//           </nav>
//         </aside>

//         {/* Main Content Container */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           {/* Main Content - Scrollable */}
//           <main className="flex-1 overflow-y-auto">
//             <div className="w-full mx-auto">
//               {/* Main Content Area */}
//               <div className="pb-20">{renderContent()}</div>
//             </div>
//           </main>

//           {/* Footer - Sticky at bottom (Mobile Only) */}
//           <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb lg:hidden">
//             <div className="flex items-center justify-center px-4 py-2">
//               {/* Payment Button */}
//               <Link
//                 to="/accountUser?tab=payment"
//                 className="flex-1 max-w-xs flex justify-center"
//               >
//                 <button className="flex flex-col items-center justify-center w-full py-1 group">
//                   <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
//                     <CreditCard
//                       className={`h-5 w-5 ${
//                         activeTab === "payment"
//                           ? "text-emerald-600"
//                           : "text-gray-500"
//                       }`}
//                     />
//                   </div>
//                   <span
//                     className={`text-xs font-medium mt-1 ${
//                       activeTab === "payment"
//                         ? "text-emerald-600"
//                         : "text-gray-600"
//                     }`}
//                   >
//                     Payment
//                   </span>
//                 </button>
//               </Link>

//               {/* Summary Button */}
//               <Link
//                 to="/accountUser?tab=summary"
//                 className="flex-1 max-w-xs flex justify-center"
//               >
//                 <button className="flex flex-col items-center justify-center w-full py-1 group">
//                   <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
//                     <FileText
//                       className={`h-5 w-5 ${
//                         activeTab === "summary"
//                           ? "text-emerald-600"
//                           : "text-gray-500"
//                       }`}
//                     />
//                   </div>
//                   <span
//                     className={`text-xs font-medium mt-1 ${
//                       activeTab === "summary"
//                         ? "text-emerald-600"
//                         : "text-gray-600"
//                     }`}
//                   >
//                     Summary
//                   </span>
//                 </button>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import {
  CreditCard,
  FileText,
  LogOut,
  Menu,
  Plus,
  Receipt,
  X,
} from "lucide-react";
import { useEffect, useState, type SetStateAction } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

import PaymentForm from "../account/Paytmentform";
import PaymentContainer from "../account/PaymentContainer";

export default function AccountDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  // Default to summary, with payment-summary as the default toggle
  const initialTab = searchParams.get("tab") || "summary";
  const initialSummaryType = searchParams.get("summaryType") || "payment-summary";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [summaryType, setSummaryType] = useState(initialSummaryType);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    if (initialTab === "summary") {
      setSummaryType(initialSummaryType);
    }
  }, [initialTab, initialSummaryType]);

  const handleSummaryToggle = (type: string) => {
    setSummaryType(type);
    navigate(`/accountUser?tab=summary&summaryType=${type}`, { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const openPaymentForm = () => {
    setIsPaymentFormOpen(true);
  };

  const closePaymentForm = () => {
    setIsPaymentFormOpen(false);
  };

  const renderSummaryContent = () => {
    switch (summaryType) {
      case "payment-summary":
        return (
          <div className="space-y-4">
            {/* Add Payment Button */}
            <div className="flex justify-end mb-4">
              <Button
                onClick={openPaymentForm}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>
            {/* Payment Summary Content */}
            <PaymentContainer />
          </div>
        );
      
      case "receipt-summary":
        return (
          <div className="space-y-4">
            {/* Add Receipt Button */}
            <div className="flex justify-end mb-4">
              <Button
                onClick={openPaymentForm}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Receipt
              </Button>
            </div>
            {/* Receipt Summary Content - Placeholder for now */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">
                Receipt Summary
              </h2>
              <p className="text-blue-600">
                Your receipt summary will be displayed here.
              </p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">
              Summary Dashboard
            </h2>
            <p className="text-emerald-600">
              Welcome to your summary dashboard.
            </p>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (isPaymentFormOpen) {
      return (
        <PaymentForm />
      );
    }

    // Always show summary content since that's the main functionality
    return renderSummaryContent();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar - Fixed */}
      <nav className="bg-white shadow-lg border-b-2 border-emerald-200 px-3 sm:px-4 py-2 flex-shrink-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5">
              <div className="rounded-lg p-1 flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Title - Visible on all screens */}
          <h1 className="text-center text-lg sm:text-xl font-bold text-emerald-800">
            Account Dashboard
          </h1>

          {/* User Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="lg:hidden p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>

            {/* Desktop User Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex items-center gap-1 hover:bg-emerald-50 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <span className="text-sm text-emerald-700 font-medium">
                    {user?.full_name || user?.username || "User"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 border border-emerald-200 bg-white shadow-md"
                align="end"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      {/* Summary Toggle - Only show when not in payment form */}
      {!isPaymentFormOpen && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex bg-gray-100 rounded-full p-1 max-w-md mx-auto">
            <button
              onClick={() => handleSummaryToggle("payment-summary")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                summaryType === "payment-summary"
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Payment Summary
            </button>
            <button
              onClick={() => handleSummaryToggle("receipt-summary")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                summaryType === "receipt-summary"
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Receipt Summary
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {/* Back Button - Only show when in payment form */}
          {isPaymentFormOpen && (
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <Button
                variant="ghost"
                onClick={closePaymentForm}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
              >
                <X className="h-4 w-4" />
                Back to Summary
              </Button>
            </div>
          )}

          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto">
            <div className="w-full mx-auto">
              {/* Main Content Area */}
              <div className="p-4 pb-20">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}