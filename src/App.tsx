import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import LoginPage from "./components/auth/Login";
import AccountUser from "./components/pages/AccountUser";
import SalesDashboard from "./components/pages/Dashboard";
import InspectorDashboard from "./components/pages/InspectorDashboard";
import ProjectManagerDashboard from "./components/pages/projectManagerDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { JobCardProvider } from "./context/JobCardContext";
import { JobCardOtherProvider } from "./context/JobCardOtherContext";
import { LeadsProvider } from "./context/LeadContext";

import "./App.css";
import { PasswordResetLoader } from "./common/Loader";
import { FirstTimePasswordReset } from "./components/auth/NewPassword";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireExactRole?: boolean;
}

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.requiresPasswordReset) {
    return <Navigate to="/first-time-password-reset" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requireExactRole = false,
}: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    currentRole,
    availableRoles,
    loading,
    isSwitchingRole,
    user,
  } = useAuth();
  const location = useLocation();

  // Extended delay during role switching to prevent unauthorized flicker
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    // Check if we're in the middle of a role switch
    const isRoleSwitching = localStorage.getItem("isRoleSwitching") === "true";

    const delay = isRoleSwitching || isSwitchingRole ? 200 : 50; // Longer delay during role switching

    const timer = setTimeout(() => {
      setIsCheckingAccess(false);
      // Clear the role switching flag after access check
      if (isRoleSwitching) {
        localStorage.removeItem("isRoleSwitching");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isSwitchingRole, currentRole]);

  if (loading || isCheckingAccess || isSwitchingRole) {
    return <PasswordResetLoader />;
  }

  // Check for password reset requirement first
  if (user?.requiresPasswordReset) {
    return <Navigate to="/first-time-password-reset" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    let hasAccess = false;

    if (requireExactRole) {
      hasAccess = currentRole ? allowedRoles.includes(currentRole) : false;
    } else {
      hasAccess = currentRole
        ? allowedRoles.some((role) => currentRole.includes(role))
        : false;
    }

    if (!hasAccess) {
      // If user doesn't have access but has other roles, redirect to their primary role
      if (availableRoles.length > 0) {
        const primaryRole = currentRole || availableRoles[0];
        const roleRoutes: Record<string, string> = {
          EITS_Sale_Representative: "/sales",
          EITS_Site_Inspector: "/inspector",
          EITS_Project_Manager: "/project_manager",
          accountUser: "/accountUser",
        };

        const redirectRoute = roleRoutes[primaryRole];
        if (redirectRoute && location.pathname !== redirectRoute) {
          return <Navigate to={redirectRoute} replace />;
        }
      }

      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

const PasswordResetRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading, currentRole, availableRoles, user } =
    useAuth();

  if (loading) {
    return <PasswordResetLoader />;
  }

  // Allow access to first-time-password-reset if user exists and needs reset
  if (window.location.pathname.includes("first-time-password-reset")) {
    if (user?.requiresPasswordReset) {
      return <>{children}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // If user requires password reset, redirect to password reset page
  if (user?.requiresPasswordReset) {
    return <Navigate to="/first-time-password-reset" replace />;
  }

  // Only redirect to dashboard if user is fully authenticated (no password reset needed)
  if (isAuthenticated) {
    const activeRole = currentRole || availableRoles[0] || "accountUser";
    const roleRoutes: Record<string, string> = {
      EITS_Sale_Representative: "/sales",
      EITS_Site_Inspector: "/inspector",
      EITS_Project_Manager: "/project_manager",
      accountUser: "/accountUser",
    };

    const redirectRoute = roleRoutes[activeRole];
    if (redirectRoute) {
      return <Navigate to={redirectRoute} replace />;
    }
  }

  return <>{children}</>;
};

const DashboardRouter = () => {
  const { currentRole, availableRoles, logout, user } = useAuth();

  // Check for password reset requirement
  if (user?.requiresPasswordReset) {
    return <Navigate to="/first-time-password-reset" replace />;
  }

  if (availableRoles.length === 0) {
    // No valid roles - force logout or show error
    logout();
    return <Navigate to="/login" replace />;
  }

  const activeRole = currentRole || availableRoles[0];
  const roleRoutes: Record<string, string> = {
    EITS_Sale_Representative: "/sales",
    EITS_Site_Inspector: "/inspector",
    EITS_Project_Manager: "/project_manager",
    accountUser: "/accountUser",
  };

  const targetRoute = roleRoutes[activeRole];
  return <Navigate to={targetRoute} replace />;
};

const Unauthorized = () => {
  const { logout, currentRole, availableRoles } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <h2>Unauthorized Access</h2>
      <p>You don't have permission to access this page.</p>
      <div style={{ textAlign: "center" }}>
        <p>
          Current active role: <strong>{currentRole || "Unknown"}</strong>
        </p>
        <p>
          Available roles:{" "}
          <strong>{availableRoles.join(", ") || "None"}</strong>
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => window.history.back()}>Go Back</button>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Navigate to="/login" replace />
            </PublicRoute>
          }
        />

        <Route
          path="/first-time-password-reset"
          element={
            <PasswordResetRoute>
              <FirstTimePasswordReset />
            </PasswordResetRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute
              allowedRoles={["EITS_Sale_Representative"]}
              requireExactRole={true}
            >
              <SalesDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector"
          element={
            <ProtectedRoute
              allowedRoles={["EITS_Site_Inspector"]}
              requireExactRole={true}
            >
              <InspectorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accountUser"
          element={
            <ProtectedRoute
              allowedRoles={["accountUser"]}
              requireExactRole={true}
            >
              <AccountUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project_manager"
          element={
            <ProtectedRoute
              allowedRoles={["EITS_Project_Manager"]}
              requireExactRole={true}
            >
              <JobCardProvider>
                <JobCardOtherProvider>
                  <ProjectManagerDashboard />
                </JobCardOtherProvider>
              </JobCardProvider>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <LeadsProvider>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            containerStyle={{
              top: 20,
              right: 20,
              zIndex: 9999,
            }}
            toastOptions={{
              className: "",
              style: {
                border: "1px solid #713200",
                padding: "16px",
                color: "#713200",
                fontSize: "14px",
                maxWidth: "350px",
                wordBreak: "break-word",
                zIndex: 9999,
              },
              success: {
                className: "border border-green-500 text-green-700",
                style: {
                  border: "1px solid #22c55e",
                  color: "#15803d",
                },
              },
              error: {
                className: "border border-red-500 text-red-700",
                style: {
                  border: "1px solid #ef4444",
                  color: "#dc2626",
                },
              },
              duration: 4000,
            }}
            gutter={8}
            // Add these two props to allow multiple toasts
            containerClassName="toast-container"
            reverseOrder={false}
          />
        </div>
      </LeadsProvider>
    </AuthProvider>
  );
}

export default App;
