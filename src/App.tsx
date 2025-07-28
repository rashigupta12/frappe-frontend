// src/App.tsx
import type { ReactNode } from 'react';
import { Toaster } from "react-hot-toast";
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LoginPage from './components/auth/Login';
import SalesDashboard from './components/pages/Dashboard';
import ProjectManagerDashboard from './components/pages/projectManagerDashboard';
import InspectorDashboard from './components/pages/InspectorDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LeadsProvider } from './context/LeadContext';
import { roleMiddleware } from './middleware/roleMiddleware';
import { JobCardProvider } from './context/JobCardContext';
import HomePage from './components/pages/Homepage';
import { JobCardOtherProvider } from './context/JobCardOtherContext';
import AccountUser from './components/pages/AccountUser';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !roleMiddleware(user?.role ?? '', allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Public Route - prevents authenticated users from accessing login
const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
};

// Dashboard Router - routes users to appropriate dashboard based on role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role}`} replace />;
};

// Dashboard Components
const UserDashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>User Dashboard</h1>
    <p>Welcome to your user dashboard!</p>
    <div>
      <h3>Available Actions:</h3>
      <ul>
        <li>View Profile</li>
        <li>Create Orders</li>
        <li>View Your Orders</li>
      </ul>
    </div>
  </div>
);

// New AccountUser Dashboard Component
// const AccountUserDashboard = () => (
//   <div style={{ padding: '20px' }}>
//     <h1>Account User Dashboard</h1>
//     <p>Welcome to your financial management dashboard!</p>
//     <div>
//       <h3>Available Actions:</h3>
//       <ul>
//         <li>View Profile</li>
//         <li>View Orders & Customers</li>
//         <li>Manage Invoices</li>
//         <li>Process Payments</li>
//         <li>Generate Financial Reports</li>
//         <li>Handle Billing</li>
//         <li>View Projects & Tasks</li>
//       </ul>
//     </div>
//     <div style={{ marginTop: '20px' }}>
//       <h3>Financial Management Features:</h3>
//       <ul>
//         <li>Create and update invoices</li>
//         <li>Track payment status</li>
//         <li>Generate billing reports</li>
//         <li>Monitor accounts receivable</li>
//         <li>Financial analytics dashboard</li>
//       </ul>
//     </div>
//   </div>
// );

const AdminDashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>Admin Dashboard</h1>
    <p>Welcome to your admin dashboard!</p>
    <div>
      <h3>Available Actions:</h3>
      <ul>
        <li>Manage Users</li>
        <li>Manage All Orders</li>
        <li>Manage All Customers</li>
        <li>Create & View Reports</li>
        <li>Manage Projects & Tasks</li>
        <li>Financial Management</li>
        <li>System Administration</li>
      </ul>
    </div>
  </div>
);

// Unauthorized component
const Unauthorized = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h2>Unauthorized Access</h2>
      <p>You don't have permission to access this page.</p>
      <p>Current role: <strong>{user?.role || 'Unknown'}</strong></p>
      <div style={{ display: 'flex', gap: '10px' }}>
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
        {/* Root redirect to login */}
        <Route path="/" element={<HomePage />} />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Dashboard Router - redirects based on role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* Role-specific Dashboard Routes */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <SalesDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector"
          element={
            <ProtectedRoute allowedRoles={['inspector']}>
              <InspectorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accountUser"
          element={
            <ProtectedRoute allowedRoles={['accountUser']}>
              <AccountUser/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project_manager"
          element={
            <ProtectedRoute allowedRoles={['project_manager']}>
              <JobCardProvider>
                <JobCardOtherProvider>
                  <ProjectManagerDashboard />
                </JobCardOtherProvider>
              </JobCardProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
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
              className: '',
              style: {
                border: '1px solid #713200',
                padding: '16px',
                color: '#713200',
              },
              success: {
                className: 'border border-green-500 bg-green-100 text-green-700',
              },
              error: {
                className: 'border border-red-500 bg-red-100 text-red-700',
              },
            }}
          />
        </div>
      </LeadsProvider>
    </AuthProvider>
  );
}

export default App;