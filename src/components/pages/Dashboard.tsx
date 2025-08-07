import {
  Home,
  HomeIcon,
  LogOut,
  Menu,
  Plus,
  UserPlus,
  Users,
  X,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import InquiryPage from "../Inquiry/h";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import TodoPage from "../Inquiry/Assign";
import InquiryForm from "../Inquiry/InquiryForm";
import FeedbackComponent from "../../common/FeedbackManagement";
import { RoleSwitcherMinimal } from "../../common/RoleSwitcher";

export default function SalesDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const openInquiryForm = () => {
    setSelectedInquiry(null);
    setIsFormOpen(true);
    setSidebarOpen(false);
  };

  const closeInquiryForm = () => {
    setIsFormOpen(false);
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isMultiRole } = useAuth();

  const initialTab = searchParams.get("tab") || "inquiry-form";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your changes may not be saved.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/sales?tab=${tab}`, { replace: true });
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const renderContent = () => {
    if (isFormOpen) {
      return (
        <InquiryForm
          isOpen={isFormOpen}
          onClose={closeInquiryForm}
          inquiry={selectedInquiry}
        />
      );
    }

    switch (activeTab) {
      case "inquiry-form":
        return <InquiryPage />;
      case "assign":
        return <TodoPage />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">
              Dashboard
            </h2>
            <p className="text-emerald-600">
              Welcome to your Sales Representative dashboard.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar - Fixed */}
      <nav className="bg-white shadow-lg border-b-2 border-emerald-200 px-3 sm:px-2 py-2 flex-shrink-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

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

          {/* Title with Role Switcher */}
          <div className="flex items-center gap-2">
            <h1 className="text-center text-lg sm:text-xl font-bold text-emerald-800">
              Sales Representative
            </h1>
            {/* Show role switcher if user has multiple roles */}
            {isMultiRole && (
              <div className="hidden sm:block">
                <RoleSwitcherMinimal />
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Role Switcher */}
            {isMultiRole && (
              <div className="sm:hidden">
                <RoleSwitcherMinimal />
              </div>
            )}

            {/* Mobile Feedback Button */}
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
                {/* Role information in desktop menu */}
                {isMultiRole && (
                  <div className="px-3 py-2 border-b border-gray-100">
                    <RoleSwitcherMinimal className="w-full" />
                  </div>
                )}
                <div className="space-y-1">
                  {/* Desktop Feedback Button */}
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

                  {/* Logout Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start gap-2 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
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
            className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside
          className={`
            fixed lg:relative z-40 w-64 bg-white border-r-2 border-emerald-200 
            h-full p-4 shadow-lg lg:shadow-none overflow-y-auto flex-shrink-0
            transform transition-transform duration-300 ease-in-out lg:transform-none
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <nav className="space-y-2">
            <Button
              variant={activeTab === "inquiry-form" ? "default" : "ghost"}
              onClick={() => handleTabChange("inquiry-form")}
              className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                activeTab === "inquiry-form"
                  ? "bg-emerald-500 text-white shadow-lg transform scale-105 hover:emerald-900 border border-emerald-600"
                  : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span className="font-medium">Inquiries</span>
            </Button>
            <Button 
              variant="ghost"
              onClick={openInquiryForm}
              className="w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Add Inquiry
            </Button>
            <Button
              variant={activeTab === "assign" ? "default" : "ghost"}
              onClick={() => handleTabChange("assign")}
              className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                activeTab === "assign"
                  ? "bg-emerald-500 text-white shadow-lg transform scale-105 hover:emerald-600"
                  : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Assigned Inquires</span>
            </Button>
          </nav>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <div className="pb-6">{renderContent()}</div>
            </div>
          </main>

          {/* Footer - Sticky at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb lg:hidden">
            <div className="flex items-center justify-center">
              {/* Home Button */}
              <Link
                to="/sales?tab=inquiry-form"
                className="flex-1 max-w-xs flex justify-center"
              >
                <button
                  className={`flex flex-col items-center justify-center w-full py-1 group ${
                    activeTab === "inquiry-form"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-transparent"
                  }`}
                >
                  <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
                    <Home
                      className={`h-5 w-5 ${
                        activeTab === "inquiry-form"
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 ${
                      activeTab === "inquiry-form"
                        ? "text-emerald-600"
                        : "text-gray-600"
                    }`}
                  >
                    Home
                  </span>
                </button>
              </Link>

              <div className="flex-1 max-w-xs flex justify-center">
                <button
                  onClick={openInquiryForm}
                  className={`flex flex-col items-center justify-center w-full py-1 group border-b-4 ${
                    isFormOpen
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-transparent"
                  }`}
                >
                  <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
                    <Plus
                      className={`h-5 w-5 ${
                        isFormOpen ? "text-emerald-600" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 ${
                      isFormOpen ? "text-emerald-600" : "text-gray-600"
                    }`}
                  >
                    Add
                  </span>
                </button>
              </div>

              {/* Assign Button */}
              <Link
                to="/sales?tab=assign"
                className="flex-1 max-w-xs flex justify-center"
              >
                <button
                  className={`flex flex-col items-center justify-center w-full py-1 group ${
                    activeTab === "assign"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-transparent"
                  }`}
                >
                  <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
                    <UserPlus
                      className={`h-5 w-5 ${
                        activeTab === "assign"
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 ${
                      activeTab === "assign"
                        ? "text-emerald-600"
                        : "text-gray-600"
                    }`}
                  >
                    Assigned
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}