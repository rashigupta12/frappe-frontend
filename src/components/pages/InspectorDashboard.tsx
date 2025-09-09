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
// import CreateInspection from "../inspection/IspectionDetail";
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
    setSidebarOpen(false); // Close sidebar on mobile after selection
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
        // return <MobileInspectio userEmail={user?.username ?? ""} />;
        return <TodosList userEmail={user?.username??""}/>
      case "inspections":
        return <InspectionList userEmail={user?.username ?? ""} />;
      case "details":
        return <CreateInspection />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">
              Dashboard
            </h2>
            <p className="text-emerald-600">
              Welcome to your Inspector dashboard.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar - Fixed */}
      <nav className="bg-white shadow-lg border-b-2 border-emerald-200 px-3 sm:px-4 py-2 flex-shrink-0 z-50">
        <div className="flex items-center justify-between relative">
          {/* Left Section - Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
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
          </div>

          {/* Center Section - Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
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

          {/* Right Section - User Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Role Switcher */}
            {isMultiRole && (
              <div className="lg:hidden">
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
              onClick={confirmLogout}
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
                {isMultiRole && (
                  <div className="px-3 py-2 border-b border-gray-100">
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

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Responsive Sidebar */}
        <aside
          className={`
            fixed lg:relative z-40 bg-white border-r-2 border-emerald-200 
            h-full shadow-lg lg:shadow-none overflow-hidden flex-shrink-0
            transform transition-all duration-300 ease-in-out lg:transform-none
            flex flex-col
            w-56 xs:w-64 sm:w-64 lg:w-64
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <nav className="space-y-2 mt-2">
              <Button
                variant={activeTab === "todos" ? "default" : "ghost"}
                onClick={() => handleTabChange("todos")}
                className={`w-full justify-start gap-2 sm:gap-3 rounded-xl p-2 sm:p-3 text-left transition-all duration-200 text-sm sm:text-base ${
                  activeTab === "todos"
                    ? "bg-emerald-500 text-white shadow-lg transform scale-105 hover:bg-emerald-600"
                    : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
                }`}
              >
                <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-medium truncate">My Todos</span>
              </Button>

              <Button
                variant={activeTab === "inspections" ? "default" : "ghost"}
                onClick={() => handleTabChange("inspections")}
                className={`w-full justify-start gap-2 sm:gap-3 rounded-xl p-2 sm:p-3 text-left transition-all duration-200 text-sm sm:text-base ${
                  activeTab === "inspections"
                    ? "bg-emerald-500 text-white shadow-lg transform scale-105 hover:bg-emerald-600"
                    : "text-emerald-700 hover:bg-emerald-50 hover:shadow-md"
                }`}
              >
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-medium truncate">Inspections</span>
              </Button>
            </nav>
          </div>

          {/* User Info Section - Fixed at Bottom */}
          <div className="flex-shrink-0 p-2 scroll-pb-20 sm:p-3 border-t border-emerald-100 capitalize">
            <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-2 sm:p-3">
              <div className="min-w-0">
                {" "}
                {/* min-w-0 allows flex children to shrink below content size */}
                <div className="text-xs sm:text-sm font-medium text-emerald-800 truncate mb-0.5 capitalize">
                  {user?.full_name || user?.username || "User"}
                </div>
                {user?.email && (
                  <div className="text-xs text-emerald-600 truncate opacity-90">
                    {user.email}
                  </div>
                )}
                {/* Role badge for mobile if multi-role */}
                {isMultiRole && (
                  <div className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded mt-1 truncate lg:hidden capitalize">
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

          {/* Footer - Sticky at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb lg:hidden">
            <div className="flex items-center justify-center px-4 py-2">
              {/* Todos Button */}
              <Link
                to="/inspector?tab=todos"
                className="flex-1 max-w-xs flex justify-center"
              >
                <button
                  className={`flex flex-col items-center justify-center w-full py-1 group ${
                    activeTab === "todos" ? "bg-emerald-50" : ""
                  }`}
                >
                  <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
                    <ListTodo
                      className={`h-5 w-5 ${
                        activeTab === "todos"
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 ${
                      activeTab === "todos"
                        ? "text-emerald-600"
                        : "text-gray-600"
                    }`}
                  >
                    Todos
                  </span>
                </button>
              </Link>

              {/* Inspections Button */}
              <Link
                to="/inspector?tab=inspections"
                className="flex-1 max-w-xs flex justify-center"
              >
                <button
                  className={`flex flex-col items-center justify-center w-full py-1 group ${
                    activeTab === "inspections" ? "bg-emerald-50" : ""
                  }`}
                >
                  <div className="w-10 h-6 flex items-center justify-center group-active:scale-95 transition-transform">
                    <ClipboardList
                      className={`h-5 w-5 ${
                        activeTab === "inspections"
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium mt-1 ${
                      activeTab === "inspections"
                        ? "text-emerald-600"
                        : "text-gray-600"
                    }`}
                  >
                    Inspections
                  </span>
                </button>
              </Link>
            </div>
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
