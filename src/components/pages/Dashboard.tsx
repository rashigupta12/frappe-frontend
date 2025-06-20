/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Clock,
  Clock1,
  Home,
  HomeIcon,
  LogOut,
  Menu,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import InquiryPage from "../Inquiry/h";
import Assign from "../Inquiry/Assign";
// import InquiryPage from "../Inquiry/Inquiry";
// import InquiryPage from "../Inquiry/Inquiry";

export default function SalesDashboard() {
  const navigate = useNavigate();
  // const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const initialTab = searchParams.get("tab") || "inquiry-form";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`, { replace: true });
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "inquiry-form":
        // return <InquiryManagement/>;
        return (
          // <InquiryPage/>
          <InquiryPage />
        );
      case "assign":
        return <Assign />;
      case "progress":
        return <p>Reports</p>;
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
    <div className="h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Top Navigation Bar - Fixed */}
      <nav className="bg-white shadow-lg border-b-2 border-emerald-200 px-3 sm:px-4 py-2 flex-shrink-0 z-50">
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

          {/* Title - Visible on all screens */}
          <h1 className="text-center text-lg sm:text-xl font-bold text-emerald-800">
            Sales Representative
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
                    {user || "User"}
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
          <nav className="space-y-2 mt-2">
            <Button
              variant={activeTab === "inquiry-form" ? "default" : "ghost"}
              onClick={() => handleTabChange("inquiry-form")}
              className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                activeTab === "inquiry-form"
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600"
                  : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span className="font-medium">Inquiry Form</span>
            </Button>
            <Button
              variant={activeTab === "assign" ? "default" : "ghost"}
              onClick={() => handleTabChange("assign")}
              className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                activeTab === "inquiry-form"
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600"
                  : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Assign </span>
            </Button>
            <Button
              variant={activeTab === "progress" ? "default" : "ghost"}
              onClick={() => handleTabChange("progress")}
              className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                activeTab === "inquiry-form"
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600"
                  : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
              }`}
            >
              <Clock1 className="h-5 w-5" />
              <span className="font-medium">Progress </span>
            </Button>
          </nav>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Main Content Area */}
              <div className="pb-6">{renderContent()}</div>
            </div>
          </main>

          {/* Footer - Sticky at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb">
            <div className="flex items-center justify-around px-2 py-1">
              {/* Home Button */}
              <Link to="/dashboard?tab=inquiry-form" className="flex-1">
                <button className="flex flex-col items-center justify-center py-1 px-3 min-w-0 flex-1 group">
                  <div className="relative">
                    <div className="w-10 h-6  flex items-center justify-center  group-active:scale-95 transition-transform">
                      <Home className="h-5 w-5 text-emerald-700" />
                    </div>
                    {/* Active indicator dot */}
                    {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div> */}
                  </div>
                  <span className="text-xs font-medium text-gray-700 mt-1">
                    Home
                  </span>
                </button>
              </Link>

              {/* Assign Button */}
              <Link
                to="/dashboard?tab=assign"
                className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 group"
              >
                <button className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 group">
                  <div className="w-10 h-6  flex items-center justify-center group-active:scale-95 transition-transform group-hover:bg-purple-100">
                    <UserPlus className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 mt-1">
                    Assign
                  </span>
                </button>
              </Link>

              {/* In Progress Button */}
              <Link
                to="/dashboard?tab=progress"
                className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 group"
              >
                <button className="flex flex-col items-center justify-center py-1 px-3 min-w-0 flex-1 group">
                  <div className="w-10 h-6  flex items-center justify-center group-active:scale-95 transition-transform group-hover:bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 mt-1">
                    In Progress
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
