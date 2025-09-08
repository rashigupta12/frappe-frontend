// Updated RoleSwitcher.tsx with better error handling and session validation

import { ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAuth } from "../../context/AuthContext";

interface RoleSwitcherProps {
  className?: string;
  variant?: "default" | "minimal" | "compact";
}

export const RoleSwitcher = ({
  className = "",
  variant = "default",
}: RoleSwitcherProps) => {
  const {
    currentRole,
    availableRoles,
    switchRole,
    getDisplayRoleName,
    isMultiRole,
    // refreshAuth,
    user,
    isAuthenticated,
  } = useAuth();
  const navigate = useNavigate();

  // Don't show switcher if only one role or no roles
  if (!isMultiRole || availableRoles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = async (role: string) => {
    if (role === currentRole) return;

    try {
      console.log("Starting role switch to:", role);

      // Validate user is properly authenticated
      if (!isAuthenticated || !user || user.requiresPasswordReset) {
        console.error("User not properly authenticated for role switch");
        return;
      }

      // Set flag to indicate role switching is in progress
      localStorage.setItem("isRoleSwitching", "true");

      // Switch the role first
      const success = await switchRole(role);

      if (success) {
        console.log("Role switch successful, navigating...");

        // Define the role routes
        const roleRoutes: Record<string, string> = {
          EITS_Sale_Representative: "/sales",
          EITS_Site_Inspector: "/inspector",
          EITS_Project_Manager: "/project_manager",
          accountUser: "/accountUser",
        };

        const targetRoute = roleRoutes[role];
        if (targetRoute) {
          console.log("Navigating to:", targetRoute);
          // Use React Router navigation with a small delay to ensure state is updated
          setTimeout(() => {
            navigate(targetRoute, { replace: true });
          }, 150);
        }

        console.log("Role switch completed successfully");
      } else {
        console.error("Role switch failed");
        localStorage.removeItem("isRoleSwitching");
      }
    } catch (error) {
      console.error("Failed to switch role:", error);
      localStorage.removeItem("isRoleSwitching");
    }
  };

  const renderMinimal = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 text-xs ${className}`}
          disabled={!isAuthenticated || user?.requiresPasswordReset}
        >
          <User className="h-3 w-3" />
          <span className="hidden sm:inline">
            {getDisplayRoleName(currentRole || "")}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-white" align="end">
        <div className="text-xs text-gray-500 px-2 py-1 border-b">
          Switch Role
        </div>
        {availableRoles.map((role) => (
          <Button
            key={role}
            variant="ghost"
            size="sm"
            onClick={() => handleRoleSwitch(role)}
            className={`w-full justify-start text-xs h-8 ${
              role === currentRole
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            disabled={!isAuthenticated || user?.requiresPasswordReset}
          >
            {role === currentRole && (
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            )}
            {getDisplayRoleName(role)}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );

  const renderCompact = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className}`}
          disabled={!isAuthenticated || user?.requiresPasswordReset}
        >
          <User className="h-4 w-4" />
          <span className="font-medium">
            {getDisplayRoleName(currentRole || "")}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900 px-2 py-1">
            Available Roles
          </div>
          {availableRoles.map((role) => (
            <Button
              key={role}
              variant="ghost"
              onClick={() => handleRoleSwitch(role)}
              className={`w-full justify-start ${
                role === currentRole
                  ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              disabled={!isAuthenticated || user?.requiresPasswordReset}
            >
              <div className="flex items-center gap-2">
                {role === currentRole && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
                <span>{getDisplayRoleName(role)}</span>
              </div>
              {role === currentRole && (
                <span className="ml-auto text-xs text-blue-600">Current</span>
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  const renderDefault = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Role:</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 min-w-[140px] justify-between"
            disabled={!isAuthenticated || user?.requiresPasswordReset}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{getDisplayRoleName(currentRole || "")}</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-900">
              Switch Dashboard Role
            </div>
            <div className="text-xs text-gray-500">
              You have access to multiple roles. Switch to view different
              dashboards.
            </div>
            <div className="space-y-1 pt-2">
              {availableRoles.map((role) => (
                <Button
                  key={role}
                  variant="ghost"
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full justify-start ${
                    role === currentRole
                      ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  disabled={!isAuthenticated || user?.requiresPasswordReset}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        role === currentRole ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="flex-1 text-left">
                      {getDisplayRoleName(role)}
                    </span>
                    {role === currentRole && (
                      <span className="text-xs text-emerald-600 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  // Render based on variant
  switch (variant) {
    case "minimal":
      return renderMinimal();
    case "compact":
      return renderCompact();
    default:
      return renderDefault();
  }
};

export const RoleSwitcherMinimal = (
  props: Omit<RoleSwitcherProps, "variant">
) => <RoleSwitcher {...props} variant="minimal" />;

export const RoleSwitcherCompact = (
  props: Omit<RoleSwitcherProps, "variant">
) => <RoleSwitcher {...props} variant="compact" />;
