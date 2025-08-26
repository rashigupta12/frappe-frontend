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

import FeedbackComponent from "../../common/FeedbackManagement";
import { RoleSwitcherMinimal } from "../../common/RoleSwitcher";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "payment-summary";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/accountUser?tab=${tab}`, { replace: true });
    setMobileSidebarOpen(false); // Close mobile sidebar after navigation
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

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
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

  const isFormView =
    activeTab === "payment-form" || activeTab === "receipt-form";
  const isSummaryView =
    activeTab === "payment-summary" || activeTab === "receipt-summary";

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-50 md:z-auto flex flex-col w-64 border-r border-gray-200 bg-white`}
      >
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Sidebar header */}
          {/* Left Section - Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            >
              {mobileSidebarOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Sidebar navigation */}
          <nav className="flex-1 px-2 space-y-1">
            <button
              onClick={() => handleTabChange("payment-summary")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                activeTab === "payment-summary" || activeTab === "payment-form"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <CreditCard className="mr-3 h-5 w-5" />
              Payments
            </button>
            <button
              onClick={() => handleTabChange("receipt-summary")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                activeTab === "receipt-summary" || activeTab === "receipt-form"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <FileText className="mr-3 h-5 w-5" />
              Receipts
            </button>
          </nav>
          <div className="flex-shrink-0 p-2 sm:p-3   border-t border-emerald-100  ">
            <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-2 sm:p-3 ">
              <div className="min-w-0"> {/* min-w-0 allows flex children to shrink below content size */}
                <div className="text-xs sm:text-sm font-medium text-black truncate mb-1 capitalize">
                  {user?.full_name || user?.username || "User"}
                </div>
                {user?.email && (
                  <div className="text-xs text-emerald-600 truncate opacity-90 mb-1">
                    {user.email}
                  </div>
                )}
                {/* Role badge for mobile if multi-role */}
                {isMultiRole && (
                  <div className="text-xs text-emerald-900 bg-emerald-100 px-2 py-1 rounded mt-1 truncate lg:hidden capitalize">
                    Role:  <span className="font-medium">Account</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <nav className="bg-white shadow-lg border-b-2 border-emerald-200 px-3 sm:px-4 py-2 flex-shrink-0 z-40">
          <div className="flex items-center justify-between relative">
            {/* Left Section - Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleMobileSidebar}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Center Section - Logo */}
            <Link
              to="/"
              className="absolute left-1/2 transform -translate-x-1/2"
            >
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
            </Link>

            {/* Right Section - User Menu & Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {isMultiRole && (
                <div className="lg:hidden">
                  <RoleSwitcherMinimal />
                </div>
              )}

              <FeedbackComponent className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-white bg-emerald-700 hover:text-blue-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="sr-only">Feedback</span>
                </Button>
              </FeedbackComponent>

              <Button
                variant="ghost"
                size="icon"
                onClick={confirmLogout}
                className="lg:hidden p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>

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
                  {isMultiRole && (
                    <div className="px-3 border-b border-gray-100">
                      <RoleSwitcherMinimal className="w-full" />
                    </div>
                  )}
                  <FeedbackComponent>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Feedback
                    </Button>
                  </FeedbackComponent>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={confirmLogout}
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

        {/* Summary Toggle - Only show for summary views */}
        {isSummaryView && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
            <div className="flex bg-gray-100 rounded-full p-1 max-w-md mx-auto">
              <button
                onClick={() => handleTabChange("payment-summary")}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === "payment-summary"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Payment
              </button>
              <button
                onClick={() => handleTabChange("receipt-summary")}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === "receipt-summary"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Receipt
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden h-full">
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
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                >
                  <X className="h-4 w-4" />
                  Back to Summary
                </Button>
              </div>
            )}

            <main className="flex-1 overflow-y-auto">
              <div className="w-full mx-auto">
                <div className="py-2">{renderContent()}</div>
              </div>
            </main>
          </div>
        </div>
      </div>
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader className="justify-center items-center">
            <AlertDialogTitle>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit the app?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center space-x-2">
            <AlertDialogCancel onClick={cancelLogout} className="mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
