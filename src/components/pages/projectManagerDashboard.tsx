/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FileText,
  LogOut,
  Menu,
  Plus,
  Wrench,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import JobCardForm from "../JobCard/JobCardForm";
import JobCardOtherForm from "../JobCard/JobCardOtherForm";
import JobCardOtherList from "../JobCard/JobCardOtherList";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import JobCardList from "../JobCard/JobCardList";

export default function ProjectManagerDashboard() {
  const [isJobCardFormOpen, setIsJobCardFormOpen] = useState(false);
  const [isJobCardOtherFormOpen, setIsJobCardOtherFormOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [selectedJobCardOther, setSelectedJobCardOther] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const initialTab = searchParams.get("tab") || "veneer-pressing";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your changes may not be saved.";
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
        return <JobCardList onEdit={handleEditJobCard} onOpenForm={openJobCardForm} />;
      case "other-services":
        return <JobCardOtherList onEdit={handleEditJobCardOther} onOpenForm={openJobCardOtherForm} />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">
              Job Cards Dashboard
            </h2>
            <p className="text-emerald-600">
              Welcome to your Project Manager dashboard. Manage job cards here.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
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

          {/* Title */}
          <h1 className="text-center text-lg sm:text-xl font-bold text-emerald-800">
            Supervisor
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

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative z-40 w-64 bg-white border-r-2 border-emerald-200 
            h-full p-4 shadow-lg lg:shadow-none overflow-y-auto flex-shrink-0
            transform transition-transform duration-300 ease-in-out lg:transform-none
            ${sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <nav className="space-y-2">
            <Button
              variant={activeTab === "veneer-pressing" ? "default" : "ghost"}
              onClick={() => handleTabChange("veneer-pressing")}
              className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${activeTab === "veneer-pressing"
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-green-600"
                  : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
                }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Veneer Pressing</span>
            </Button>

            <Button
              variant={activeTab === "other-services" ? "default" : "ghost"}
              onClick={() => handleTabChange("other-services")}
              className={`w-full justify-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${activeTab === "other-services"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105 hover:from-blue-600 hover:to-purple-600"
                  : "text-blue-700 hover:bg-blue-50 hover:shadow-md"
                }`}
            >
              <Wrench className="h-5 w-5" />
              <span className="font-medium">Other Services</span>
            </Button>

            {/* Desktop Add Buttons in Sidebar */}
            {/* <div className="hidden lg:block space-y-2 mt-6">
              <Button
                onClick={openJobCardForm}
                className="w-full justify-start gap-3 rounded-xl p-3 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">New JC - Veneer</span>
              </Button>

              <Button
                onClick={openJobCardOtherForm}
                className="w-full justify-start gap-3 rounded-xl p-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Wrench className="h-5 w-5" />
                <span className="font-medium">New JC - Other</span>
              </Button>
            </div> */}
          </nav>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation - Mobile Only */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex space-x-1">
              <button
                onClick={() => handleTabChange("veneer-pressing")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === "veneer-pressing"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Veneer Pressing
              </button>
              <button
                onClick={() => handleTabChange("other-services")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === "other-services"
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
            <div className="max-w-7xl mx-auto pb-4 pt-2 px-4">
              <div className="pb-6">
                {/* Floating Action Buttons for Desktop */}
                {/* <div className="hidden lg:flex justify-end gap-4 mb-4">
                  <Button
                    onClick={openJobCardForm}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New JC - Veneer Pressing
                  </Button>
                  <Button
                    onClick={openJobCardOtherForm}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    New JC - Other Service
                  </Button>
                </div> */}
                {renderContent()}
              </div>
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb">
            <div className="flex items-center justify-between px-4 py-2">
              {/* New JC - Veneer Pressing Button */}
              <div className="flex-1 max-w-xs flex justify-center">
                <button
                  onClick={openJobCardForm}
                  className="flex flex-col items-center justify-center w-full py-1 group"
                >
                  <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
                    <Plus
                      className={`h-5 w-5 ${isJobCardFormOpen ? "text-emerald-600" : "text-gray-500"
                        }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 text-center ${isJobCardFormOpen ? "text-emerald-600" : "text-gray-600"
                      }`}
                  >
                    New JC-Veneer
                  </span>
                </button>
              </div>

              {/* New JC - Other Service Button */}
              <div className="flex-1 max-w-xs flex justify-center">
                <button
                  onClick={openJobCardOtherForm}
                  className="flex flex-col items-center justify-center w-full py-1 group"
                >
                  <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
                    <Wrench
                      className={`h-5 w-5 ${isJobCardOtherFormOpen ? "text-blue-600" : "text-gray-500"
                        }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 text-center ${isJobCardOtherFormOpen ? "text-blue-600" : "text-gray-600"
                      }`}
                  >
                    New JC-Other
                  </span>
                </button>
              </div>
            </div>
          </div>
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
    </div>
  );
}