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

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requireExactRole = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, currentRole, availableRoles, loading, isSwitchingRole } = useAuth();
  const location = useLocation();

  // Extended delay during role switching to prevent unauthorized flicker
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  
  useEffect(() => {
    // Check if we're in the middle of a role switch
    const isRoleSwitching = localStorage.getItem('isRoleSwitching') === 'true';
    
    const delay = isRoleSwitching || isSwitchingRole ? 200 : 50; // Longer delay during role switching
    
    const timer = setTimeout(() => {
      setIsCheckingAccess(false);
      // Clear the role switching flag after access check
      if (isRoleSwitching) {
        localStorage.removeItem('isRoleSwitching');
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isSwitchingRole, currentRole]);

  if (loading || isCheckingAccess || isSwitchingRole) {
    return <PasswordResetLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    let hasAccess = false;

    if (requireExactRole) {
      hasAccess = currentRole ? allowedRoles.includes(currentRole) : false;
    } else {
      hasAccess = allowedRoles.some(role => availableRoles.includes(role));
    }

    if (!hasAccess) {
      // If user doesn't have access but has other roles, redirect to their primary role
      if (availableRoles.length > 0) {
        const primaryRole = currentRole || availableRoles[0];
        const roleRoutes: Record<string, string> = {
          'EITS_Sale_Representative': '/sales',
          'EITS_Site_Inspector': '/inspector',
          'EITS_Project_Manager': '/project_manager',
          'accountUser': '/accountUser'
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

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading, currentRole, availableRoles } = useAuth();

  if (loading) {
    return <PasswordResetLoader />;
  }

  if (
    isAuthenticated &&
    !window.location.pathname.includes("first-time-password-reset")
  ) {
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
  const { currentRole, availableRoles } = useAuth();

  const activeRole = currentRole || availableRoles[0] || "accountUser";
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
            <PublicRoute>
              <FirstTimePasswordReset />
            </PublicRoute>
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
            toastOptions={{
              className: "",
              style: {
                border: "1px solid #713200",
                padding: "16px",
                color: "#713200",
              },
              success: {
                className:
                  "border border-green-500 bg-green-100 text-green-700",
              },
              error: {
                className: "border border-red-500 bg-red-100 text-red-700",
              },
            }}
          />
        </div>
      </LeadsProvider>
    </AuthProvider>
  );
}

export default App;