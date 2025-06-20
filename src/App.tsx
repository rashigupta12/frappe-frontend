/* eslint-disable @typescript-eslint/no-unused-vars */
// // src/App.js
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import LoginPage from './components/auth/Login';

// import UserDashboard from './components/pages/UserDashboard';
// import SalesDashboard from './components/pages/SalesDashboard';

// // Protected Route component with role-based access
// // Protected Route component with role-based access
// import type { ReactNode } from 'react';
// import { roleMiddleware } from './middleware/roleMiddleware';
// import HomePage from './components/pages/Homepage';

// interface ProtectedRouteProps {
//   children: ReactNode;
//   allowedRoles?: string[];
// }

// const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
//   const { isAuthenticated, user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div style={{
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center'
//       }}>
//         <div>Loading...</div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   // Check role-based access
//   if (allowedRoles.length > 0 && !roleMiddleware(user?.role, allowedRoles)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return children;
// };

// // Dashboard Router - routes users to appropriate dashboard based on role
// const DashboardRouter = () => {
//   const { user } = useAuth();

//   switch(user?.role) {
//     case 'user':
//       return <Navigate to="/user-dashboard" replace />;
//     case 'sales':
//       return <Navigate to="/sales-dashboard" replace />;
//     default:
//       return <Navigate to="/login" replace />;
//   }
// };

// // Unauthorized component
// const Unauthorized = () => (
//   <div style={{
//     minHeight: '100vh',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'column'
//   }}>
//     <h2>Unauthorized Access</h2>
//     <p>You don't have permission to access this page.</p>
//     <button onClick={() => window.history.back()}>Go Back</button>
//   </div>
// );

// function AppRoutes() {
//   return (
//     <Router>
//       <Routes>
//         {/* Public Routes */}
//         <Route path="/" element={<HomePage />} />
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/unauthorized" element={<Unauthorized />} />

//         {/* Dashboard Router - redirects based on role */}
//         <Route
//           path="/dashboard"

//           element={
//             <ProtectedRoute>
//               <DashboardRouter />
//             </ProtectedRoute>
//           }
//         />

//         {/* Role-specific Dashboard Routes */}
//         <Route
//           path="/user-dashboard"
//           element={
//             <ProtectedRoute allowedRoles={['user']}>
//               <UserDashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/sales-dashboard"
//           element={
//             <ProtectedRoute allowedRoles={['sales']}>
//               <SalesDashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* Catch all route */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// function App() {
//   return (
//     <AuthProvider>
//       <div className="App">
//         <AppRoutes />
//       </div>
//     </AuthProvider>
//   );
// }

// export default App;

// App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/auth/Login";
// import HomePage from "./components/pages/Homepage";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import SalesDashboard from "./components/pages/Dashboard";
import { LeadsProvider } from "./context/LeadContext";

import { Toaster } from "react-hot-toast";
import { AssignProvider } from "./context/TodoContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-emerald-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-emerald-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SalesDashboard />
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
        <AssignProvider>
        <div className="App">
          <AppRoutes />
          {/* Add the Toaster component here */}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: '',
              style: {
                border: '1px solid #713200',
                padding: '16px',
                color: '#713200',

              },
              // Customize Tailwind classes
              success: {
                className: 'border border-green-500 bg-green-100 text-green-700',
              },
              error: {
                className: 'border border-red-500 bg-red-100 text-red-700',
              },
            }}
          />
        </div>
        </AssignProvider>
      </LeadsProvider>
    </AuthProvider>
  );
}

export default App;
