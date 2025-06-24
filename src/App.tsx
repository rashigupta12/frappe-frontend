/* eslint-disable @typescript-eslint/no-unused-vars */
// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/Login';
import HomePage from './components/pages/Homepage';
import type { ReactNode } from 'react';
import { roleMiddleware } from './middleware/roleMiddleware';
import { useEffect } from 'react';
import SalesDashboard from './components/pages/Dashboard';
import { LeadsProvider } from './context/LeadContext';
import InspectorDashboard from './components/pages/InspectorDashboard';

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

// Auto-redirect component for authenticated users
const AuthenticatedRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      switch(user.role) {
        case 'sales':
          navigate('/sales', { replace: true });
          break;
        case 'inspector':
          navigate('/inspector', { replace: true });
          break;
        case 'user':
          navigate('/user', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return null;
};

// Dashboard Router - routes users to appropriate dashboard based on role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch(user.role) {
    case 'user':
      return <Navigate to="/user" replace />;
    case 'sales':
      return <Navigate to="/sales" replace />;
    case 'inspector':
      return <Navigate to="/inspector" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
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

// Login wrapper that handles post-login redirection
const LoginWrapper = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <AuthenticatedRedirect />;
  }
  
  return <LoginPage />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginWrapper />} />
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
              <InspectorDashboard/>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <LeadsProvider>
      {/* Uncomment if you have LeadsProvider context */}
      <div className="App">
        <AppRoutes />
      </div>
      </LeadsProvider>
      
    </AuthProvider>
  );
}

export default App;
// App.tsx
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import { AuthProvider, useAuth } from "./context/AuthContext";
// import LoginPage from "./components/auth/Login";
// // import HomePage from "./components/pages/Homepage";
// import { Loader2 } from "lucide-react";
// import type { ReactNode } from "react";
// import SalesDashboard from "./components/pages/Dashboard";
// import { LeadsProvider } from "./context/LeadContext";

// import { Toaster } from "react-hot-toast";

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
//   const { isAuthenticated, loading ,user } = useAuth();
//   console.log("User in ProtectedRoute:", user);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
//         <div className="flex flex-col items-center gap-4">
//           <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
//           <p className="text-emerald-700 font-medium">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   return <>{children}</>;
// };

// const PublicRoute = ({ children }: ProtectedRouteProps) => {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
//         <div className="flex flex-col items-center gap-4">
//           <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
//           <p className="text-emerald-700 font-medium">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return <>{children}</>;
// };

// function AppRoutes() {
//   return (
//     <Router>
//       <Routes>
//         {/* Redirect root to login */}
//         <Route path="/" element={<Navigate to="/login" replace />} />
        
//         {/* Public Routes */}
//         <Route
//           path="/login"
//           element={
//             <PublicRoute>
//               <LoginPage />
//             </PublicRoute>
//           }
//         />

//         {/* Protected Dashboard Route */}
//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <SalesDashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* Catch all route */}
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// function App() {
//   return (
//      <AuthProvider>
//       <LeadsProvider>
     
//         <div className="App">
//           <AppRoutes />
//           {/* Add the Toaster component here */}
//           <Toaster 
//             position="top-right"
//             toastOptions={{
//               className: '',
//               style: {
//                 border: '1px solid #713200',
//                 padding: '16px',
//                 color: '#713200',

//               },
//               // Customize Tailwind classes
//               success: {
//                 className: 'border border-green-500 bg-green-100 text-green-700',
//               },
//               error: {
//                 className: 'border border-red-500 bg-red-100 text-red-700',
//               },
//             }}
//           />
//         </div>
//       </LeadsProvider>
//     </AuthProvider>
//   );
// }

// export default App;
