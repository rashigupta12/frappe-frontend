import {
  AlertCircle,
  ClipboardList,
  ListTodo,
  LogOut,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import FeedbackComponent from "../common/FeedbackManagement";
import { RoleSwitcherMinimal } from "../common/RoleSwitcher";

import InspectionList from "../inspection/Inspection LIst/InspectionList";
import TodosList from "../inspection/TodosList/TodosList";
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
import CreateInspection from "../inspection/Inspection Detail/CreateEditInspection";

export default function InspectorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isMultiRole } = useAuth();

  const initialTab = searchParams.get("tab") || "todos";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/inspector?tab=${tab}`, { replace: true });
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

  const renderContent = () => {
    switch (activeTab) {
      case "todos":
        return <TodosList userEmail={user?.username ?? ""} />;
      case "inspections":
        return <InspectionList userEmail={user?.username ?? ""} />;
      case "details":
        return <CreateInspection />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dashboard
            </h2>
            <p className="text-gray-600 text-lg">
              Welcome to your Inspector dashboard.
            </p>
          </div>
        );
    }
  };

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
              className="lg:hidden p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
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
            <span className="hidden sm:block text-emerald-800 font-semibold text-xl">
              Inspector
            </span>
          </div>

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
                variant={activeTab === "todos" ? "default" : "ghost"}
                onClick={() => handleTabChange("todos")}
                className={`w-full justify-start gap-3 rounded-lg p-3 text-left transition-all duration-200 text-base font-semibold ${
                  activeTab === "todos"
                    ? "bg-emerald-600 text-white shadow-lg scale-100 hover:bg-emerald-700"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <ListTodo className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">My Todos</span>
              </Button>

              <Button
                variant={activeTab === "inspections" ? "default" : "ghost"}
                onClick={() => handleTabChange("inspections")}
                className={`w-full justify-start gap-3 rounded-lg p-3 text-left transition-all duration-200 text-base font-semibold ${
                  activeTab === "inspections"
                    ? "bg-emerald-600 text-white shadow-lg scale-100 hover:bg-emerald-700"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <ClipboardList className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Inspections</span>
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
                    Role: <span className="font-medium">Inspector</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto">
            <div className="w-full mx-auto">
              <div className="pb-20">{renderContent()}</div>
            </div>
          </main>

          {/* Mobile Footer Navigation - Modern & Centered */}
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30 lg:hidden">
            <div className="flex items-stretch justify-around px-2 py-1.5">
              <Link
                to="/inspector?tab=todos"
                className="flex-1 max-w-xs flex justify-center"
              >
                <button
                  className={`flex flex-col items-center justify-center w-full py-2 group transition-colors ${
                    activeTab === "todos" ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <ListTodo
                    className={`h-6 w-6 transition-all ${
                      activeTab === "todos" ? "scale-110" : ""
                    }`}
                  />
                  <span className="text-xs font-medium mt-1">Todos</span>
                </button>
              </Link>

              <Link
                to="/inspector?tab=inspections"
                className="flex-1 max-w-xs flex justify-center"
              >
                <button
                  className={`flex flex-col items-center justify-center w-full py-2 group transition-colors ${
                    activeTab === "inspections" ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <ClipboardList
                    className={`h-6 w-6 transition-all ${
                      activeTab === "inspections" ? "scale-110" : ""
                    }`}
                  />
                  <span className="text-xs font-medium mt-1">Inspections</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

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