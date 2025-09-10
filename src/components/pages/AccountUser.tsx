import {
  AlertCircle,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

import FeedbackComponent from "../common/FeedbackManagement";
import { RoleSwitcherMinimal } from "../common/RoleSwitcher";
import PaymentContainer from "../account/PaymentContainer";
import PaymentForm from "../account/Paytmentform";
import ReceiptForm from "../account/Recipt";
import ReceiptContainer from "../account/ReciptContainer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export default function AccountDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isMultiRole } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Default to summary, with payment-summary as the default toggle
  const initialTab = searchParams.get("tab") || "payment-summary";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "payment-summary";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/accountUser?tab=${tab}`, { replace: true });
    setSidebarOpen(false); // Close mobile sidebar after navigation
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "payment-summary":
        return <PaymentContainer />;

      case "receipt-summary":
        return <ReceiptContainer />;

      case "payment-form":
        return <PaymentForm />;

      case "receipt-form":
        return <ReceiptForm />;

      default:
        return (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dashboard Overview
            </h2>
            <p className="text-gray-600 text-lg">
              Welcome to your account dashboard.
            </p>
          </div>
        );
    }
  };

  const isFormView =
    activeTab === "payment-form" || activeTab === "receipt-form";
  const isSummaryView =
    activeTab === "payment-summary" || activeTab === "receipt-summary";

  return (
    <div className="h-screen flex flex-col bg-gray-100 font-sans antialiased">
      {/* Top Navigation Bar - Clean & Soft */}
      <nav className="bg-white shadow-md border-b border-emerald-100 px-4 py-3 flex-shrink-0 z-50">
        <div className="flex items-center justify-between relative max-w-7xl mx-auto">
          {/* Left Section - Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Center Section - Logo */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <div className="rounded-full p-1 flex items-center justify-center">
              <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-full" />
            </div>
            {/* <span className="hidden sm:block text-emerald-700 font-semibold text-xl">Account</span> */}
          </Link>

          {/* Right Section - User Menu */}
          <div className="flex items-center ">
            {/* Mobile Role Switcher */}
            {isMultiRole && (
              <div className="lg:hidden">
                <RoleSwitcherMinimal className="text-emerald-600" />
              </div>
            )}
            
            {/* Mobile Feedback Button */}
            <FeedbackComponent className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 rounded-lg hover:bg-emerald-50 text-blue-500 hover:text-blue-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Feedback</span>
              </Button>
            </FeedbackComponent>

            {/* Mobile Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={confirmLogout}
              className="lg:hidden p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
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
                  className="hidden lg:flex items-center gap-2 hover:bg-emerald-50 rounded-lg px-3 py-2 transition-colors"
                >
                  <span className="text-emerald-700 font-medium">
                    {user?.full_name || user?.username || "User"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 border border-gray-200 bg-white shadow-xl" align="end">
                {isMultiRole && (
                  <div className="px-3 py-2 border-b border-gray-100">
                    <RoleSwitcherMinimal className="w-full" />
                  </div>
                )}
                <div className="space-y-1 py-2">
                  <FeedbackComponent>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Feedback
                    </Button>
                  </FeedbackComponent>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={confirmLogout}
                    className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-white/10 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Responsive Sidebar */}
        <aside
          className={`
            fixed lg:relative z-40 bg-white border-r border-emerald-100 
            h-full shadow-lg lg:shadow-none overflow-hidden flex-shrink-0
            transform transition-transform duration-300 ease-in-out lg:transform-none
            flex flex-col
            w-64
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Sidebar Nav */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              <Button
                variant={activeTab === "payment-summary" || activeTab === "payment-form" ? "default" : "ghost"}
                onClick={() => handleTabChange("payment-summary")}
                className={`w-full justify-start gap-3 rounded-lg p-3 text-left transition-all duration-200 text-base font-semibold ${
                  activeTab === "payment-summary" || activeTab === "payment-form"
                    ? "bg-emerald-500 text-white shadow-lg scale-100 hover:bg-emerald-600"
                    : "text-emerald-500 hover:bg-emerald-50"
                }`}
              >
                <CreditCard className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Payments</span>
              </Button>

              <Button
                variant={activeTab === "receipt-summary" || activeTab === "receipt-form" ? "default" : "ghost"}
                onClick={() => handleTabChange("receipt-summary")}
                className={`w-full justify-start gap-3 rounded-lg p-3 text-left transition-all duration-200 text-base font-semibold ${
                  activeTab === "receipt-summary" || activeTab === "receipt-form"
                    ? "bg-emerald-500 text-white shadow-lg scale-100 hover:bg-emerald-600"
                    : "text-emerald-500 hover:bg-emerald-50"
                }`}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Receipts</span>
              </Button>
            </nav>
          </div>

          {/* User Info Section */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-800 truncate mb-1 capitalize">
                  {user?.full_name || user?.username || "User"}
                </div>
                {user?.email && (
                  <div className="text-xs text-emerald-600 truncate opacity-90 mb-1">
                    {user.email}
                  </div>
                )}
                {isMultiRole && (
                  <div className="text-xs text-emerald-900 bg-emerald-100 px-2 py-1 rounded mt-1 truncate lg:hidden capitalize">
                    Role: <span className="font-medium">Account</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Summary Toggle - Only show for summary views */}
          {isSummaryView && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
              <div className="flex bg-gray-100 rounded-full p-1 max-w-md mx-auto">
                <button
                  onClick={() => handleTabChange("payment-summary")}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeTab === "payment-summary"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Payment
                </button>
                <button
                  onClick={() => handleTabChange("receipt-summary")}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeTab === "receipt-summary"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Receipt
                </button>
              </div>
            </div>
          )}

          {/* Back button for form views */}
          {isFormView && (
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <Button
                variant="ghost"
                onClick={() => {
                  if (activeTab === "payment-form") {
                    handleTabChange("payment-summary");
                  } else if (activeTab === "receipt-form") {
                    handleTabChange("receipt-summary");
                  }
                }}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Back to Summary
              </Button>
            </div>
          )}

          <main className="flex-1 overflow-y-auto">
            <div className="p-2">{renderContent()}</div>
          </main>
        </div>
      </div>

      {/* Mobile Footer Navigation - Modern & Centered */}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30 lg:hidden">
        <div className="flex items-stretch justify-around px-2 py-1.5">
          <Link to="/accountUser?tab=payment-summary" className="flex-1 flex justify-center">
            <button
              onClick={() => handleTabChange("payment-summary")}
              className={`flex flex-col items-center justify-center w-full py-2 group transition-colors ${
                activeTab === "payment-summary" || activeTab === "payment-form"
                  ? "text-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CreditCard className={`h-6 w-6 transition-all ${
                activeTab === "payment-summary" || activeTab === "payment-form" ? "scale-110" : ""
              }`} />
              <span className="text-xs font-medium mt-1">Payments</span>
            </button>
          </Link>

          <Link to="/accountUser?tab=receipt-summary" className="flex-1 flex justify-center">
            <button
              onClick={() => handleTabChange("receipt-summary")}
              className={`flex flex-col items-center justify-center w-full py-2 group transition-colors ${
                activeTab === "receipt-summary" || activeTab === "receipt-form"
                  ? "text-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className={`h-6 w-6 transition-all ${
                activeTab === "receipt-summary" || activeTab === "receipt-form" ? "scale-110" : ""
              }`} />
              <span className="text-xs font-medium mt-1">Receipts</span>
            </button>
          </Link>
        </div>
      </div> */}

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-white rounded-lg p-6">
          <AlertDialogHeader className="justify-center items-center">
            <AlertDialogTitle className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mb-2" />
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              Are you sure you want to exit the app?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center space-x-4 mt-4">
            <AlertDialogCancel onClick={cancelLogout} className="mt-0 border-gray-300 text-gray-700 hover:bg-gray-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}