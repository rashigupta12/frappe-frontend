/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlertCircle,
  FileText,
  LogOut,
  Menu,
  MessageCircle,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import FeedbackComponent from "../common/FeedbackManagement";
import { RoleSwitcherMinimal } from "../common/RoleSwitcher";
import { useAuth } from "../../context/AuthContext";
import JobCardForm from "../JobCard/JobCardForm";
import JobCardList from "../JobCard/JobCardList";
import JobCardOtherForm from "../JobCard/JobCardOtherForm";
import JobCardOtherList from "../JobCard/JobCardOtherList";
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
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export default function ProjectManagerDashboard() {
  const [isJobCardFormOpen, setIsJobCardFormOpen] = useState(false);
  const [isJobCardOtherFormOpen, setIsJobCardOtherFormOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [selectedJobCardOther, setSelectedJobCardOther] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isMultiRole } = useAuth();

  const initialTab = searchParams.get("tab") || "veneer-pressing";
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
    setSidebarOpen(false);
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

  // Job Card Functions
  const openJobCardForm = () => {
    setSelectedJobCard(null);
    setIsJobCardFormOpen(true);
    setIsJobCardOtherFormOpen(false);
    setSidebarOpen(false);
  };

  const openJobCardOtherForm = () => {
    setSelectedJobCardOther(null);
    setIsJobCardOtherFormOpen(true);
    setIsJobCardFormOpen(false);
    setSidebarOpen(false);
  };

  const closeJobCardForm = () => {
    setIsJobCardFormOpen(false);
    setSelectedJobCard(null);
  };

  const closeJobCardOtherForm = () => {
    setIsJobCardOtherFormOpen(false);
    setSelectedJobCardOther(null);
  };

  const handleEditJobCard = (jobCard: any) => {
    setSelectedJobCard(jobCard);
    setIsJobCardFormOpen(true);
  };

  const handleEditJobCardOther = (jobCard: any) => {
    setSelectedJobCardOther(jobCard);
    setIsJobCardOtherFormOpen(true);
  };

  const renderContent = () => {
    if (isJobCardFormOpen) {
      return (
        <JobCardForm
          isOpen={isJobCardFormOpen}
          onClose={closeJobCardForm}
          jobCard={selectedJobCard}
        />
      );
    }

    if (isJobCardOtherFormOpen) {
      return (
        <JobCardOtherForm
          isOpen={isJobCardOtherFormOpen}
          onClose={closeJobCardOtherForm}
          jobCard={selectedJobCardOther}
        />
      );
    }

    switch (activeTab) {
      case "veneer-pressing":
        return (
          <JobCardList
            onEdit={handleEditJobCard}
            onOpenForm={openJobCardForm}
          />
        );
      case "other-services":
        return (
          <JobCardOtherList
            onEdit={handleEditJobCardOther}
            onOpenForm={openJobCardOtherForm}
          />
        );
      default:
        return (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Job Cards Dashboard
            </h2>
            <p className="text-gray-600 text-lg">
              Welcome to your Project Manager dashboard. Manage job cards here.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 font-sans antialiased">
      {/* Top Navigation Bar */}
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
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5">
              <div className="rounded-full p-1 flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-8 h-8 object-contain rounded-full"
                />
              </div>
            </Link>
            {/* Optional Dashboard Title */}
            <h1 className="hidden sm:block text-lg sm:text-xl font-bold text-emerald-800">
              Dashboard
            </h1>
          </div>

          {/* Right Section - User Menu */}
          <div className="flex items-center ">
            {isMultiRole && (
              <div className="sm:hidden">
                <RoleSwitcherMinimal className="text-emerald-600" />
              </div>
            )}

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

            <Button
              variant="ghost"
              size="icon"
              onClick={confirmLogout}
              className="lg:hidden p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>

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

              <PopoverContent
                className="w-56 border border-gray-200 bg-white shadow-xl"
                align="end"
              >
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
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              <Button
                variant={activeTab === "veneer-pressing" ? "default" : "ghost"}
                onClick={() => handleTabChange("veneer-pressing")}
                className={`w-full justify-start gap-3 rounded-lg p-3 text-left transition-all duration-200 text-base font-semibold ${
                  activeTab === "veneer-pressing"
                    ? "bg-emerald-500 text-white shadow-lg scale-100 hover:bg-emerald-600"
                    : "text-emerald-500 hover:bg-emerald-50"
                }`}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium truncate">Veneer Pressing</span>
              </Button>

              <Button
                variant={activeTab === "other-services" ? "default" : "ghost"}
                onClick={() => handleTabChange("other-services")}
                className={`w-full justify-start gap-3 rounded-lg p-3 text-left transition-all duration-200 text-base font-semibold ${
                  activeTab === "other-services"
                    ? "bg-emerald-500 text-white shadow-lg scale-100 hover:bg-emerald-600"
                    : "text-emerald-500 hover:bg-emerald-50"
                }`}
              >
                <Wrench className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium truncate">Other Services</span>
              </Button>
            </nav>
          </div>

          {/* User Info Section - Fixed at Bottom */}
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
                {/* Role badge for mobile if multi-role */}
                {isMultiRole && (
                  <div className="text-xs text-emerald-900 bg-emerald-100 px-2 py-1 rounded mt-1 truncate lg:hidden capitalize">
                    Role: <span className="font-medium">Project Manager</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation - Mobile Only */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
           <div className="flex space-x-1">
              <button
                onClick={() => handleTabChange("veneer-pressing")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all truncate ${
                  activeTab === "veneer-pressing"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Veneer Pressing
              </button>
              <button
                onClick={() => handleTabChange("other-services")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all truncate ${
                  activeTab === "other-services"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Other Services
              </button>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-2  ">
              <div className="pb-6 ">{renderContent()}</div>
            </div>
          </main>
        </div>
      </div>

      {/* Job Card Form Modal */}
      {isJobCardFormOpen && (
        <JobCardForm
          isOpen={isJobCardFormOpen}
          onClose={closeJobCardForm}
          jobCard={selectedJobCard}
        />
      )}

      {/* Job Card Other Form Modal */}
      {isJobCardOtherFormOpen && (
        <JobCardOtherForm
          isOpen={isJobCardOtherFormOpen}
          onClose={closeJobCardOtherForm}
          jobCard={selectedJobCardOther}
        />
      )}

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
