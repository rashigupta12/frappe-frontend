/* eslint-disable @typescript-eslint/no-explicit-any */
// src/middleware/roleMiddleware.ts

// Basic role middleware function
export const roleMiddleware = (userRole: string, allowedRoles: string | string[]) => {
  if (!userRole) {
    return false;
  }
  
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (rolesArray.length === 0) {
    return true; // If no specific roles required, allow access
  }
  
  return rolesArray.includes(userRole);
};

// Enhanced middleware with permission checking
export type Role = 'user' | 'EITS_Sale_Representative' | 'EITS_Site_Inspector' | 'project_manager' | 'accountUser' | 'admin';
export type Resource =
  | 'dashboard'
  | 'profile'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'users'
  | 'settings'
  | 'projects'
  | 'tasks'
  | 'timeline'
  | 'invoices'
  | 'payments'
  | 'financial_reports'
  | 'billing'
  | 'quotations'
  | 'leads'
  | 'opportunities'
  | 'sales_analytics'
  | 'inventory'
  | 'products';
  
export type Action = 'read' | 'create' | 'update' | 'delete' | 'export' | 'import';

// Comprehensive permissions matrix
const permissions: Record<Role, Record<Resource, Action[]>> = {
  user: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read'],
    customers: [],
    reports: [],
    users: [],
    settings: [],
    projects: [],
    tasks: [],
    timeline: [],
    invoices: [],
    payments: [],
    financial_reports: [],
    billing: [],
    quotations: [],
    leads: [],
    opportunities: [],
    sales_analytics: [],
    inventory: [],
    products: ['read']
  },
  EITS_Sale_Representative: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create', 'update'],
    customers: ['read', 'create', 'update'],
    reports: ['read'],
    users: ['read'],
    settings: ['read'],
    projects: ['read'],
    tasks: ['read'],
    timeline: ['read'],
    invoices: ['read'],
    payments: ['read'],
    financial_reports: ['read'],
    billing: ['read'],
    quotations: ['read', 'create', 'update'],
    leads: ['read', 'create', 'update'],
    opportunities: ['read', 'create', 'update'],
    sales_analytics: ['read'],
    inventory: ['read'],
    products: ['read', 'create', 'update']
  },
  EITS_Site_Inspector: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read'],
    customers: ['read'],
    reports: ['read', 'create'],
    users: ['read'],
    settings: ['read'],
    projects: ['read'],
    tasks: ['read', 'update'],
    timeline: ['read'],
    invoices: [],
    payments: [],
    financial_reports: [],
    billing: [],
    quotations: ['read'],
    leads: [],
    opportunities: [],
    sales_analytics: [],
    inventory: ['read'],
    products: ['read']
  },
  accountUser: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read'],
    customers: ['read'],
    reports: ['read'],
    users: [],
    settings: ['read'],
    projects: ['read'],
    tasks: ['read'],
    timeline: ['read'],
    invoices: ['read', 'create', 'update'],
    payments: ['read', 'create', 'update'],
    financial_reports: ['read', 'create'],
    billing: ['read', 'create', 'update'],
    quotations: ['read'],
    leads: [],
    opportunities: [],
    sales_analytics: ['read'],
    inventory: ['read'],
    products: ['read']
  },
  project_manager: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create', 'update'],
    customers: ['read', 'create', 'update'],
    reports: ['read', 'create', 'update'],
    users: ['read'],
    settings: ['read'],
    projects: ['read', 'create', 'update', 'delete'],
    tasks: ['read', 'create', 'update', 'delete'],
    timeline: ['read', 'create', 'update'],
    invoices: ['read'],
    payments: ['read'],
    financial_reports: ['read'],
    billing: ['read'],
    quotations: ['read', 'create', 'update'],
    leads: ['read'],
    opportunities: ['read'],
    sales_analytics: ['read'],
    inventory: ['read'],
    products: ['read']
  },
  admin: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create', 'update', 'delete'],
    customers: ['read', 'create', 'update', 'delete'],
    reports: ['read', 'create', 'update', 'delete'],
    users: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'create', 'update', 'delete'],
    projects: ['read', 'create', 'update', 'delete'],
    tasks: ['read', 'create', 'update', 'delete'],
    timeline: ['read', 'create', 'update', 'delete'],
    invoices: ['read', 'create', 'update', 'delete'],
    payments: ['read', 'create', 'update', 'delete'],
    financial_reports: ['read', 'create', 'update', 'delete'],
    billing: ['read', 'create', 'update', 'delete'],
    quotations: ['read', 'create', 'update', 'delete'],
    leads: ['read', 'create', 'update', 'delete'],
    opportunities: ['read', 'create', 'update', 'delete'],
    sales_analytics: ['read', 'create', 'update', 'delete'],
    inventory: ['read', 'create', 'update', 'delete'],
    products: ['read', 'create', 'update', 'delete']
  }
};

// Core permission checking function
export const hasPermission = (
  userRole: Role,
  resource: Resource,
  action: Action
): boolean => {
  const userPermissions = permissions[userRole];
  if (!userPermissions || !userPermissions[resource]) {
    return false;
  }

  return userPermissions[resource].includes(action);
};

// Role hierarchy helper
const roleHierarchy: Record<Role, number> = {
  user: 1,
  EITS_Sale_Representative: 2,
  EITS_Site_Inspector: 2, // Same level as sales but with different permissions
  accountUser: 2, // Same level as sales and inspector but with financial permissions
  project_manager: 3, // Higher level with project management capabilities
  admin: 4
};

export const hasRoleLevel = (userRole: Role, requiredLevel: Role): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredLevel];
};

// Enhanced route access checking
export const canAccessRoute = (userRole: string, requiredRoles: string[]): boolean => {
  if (!userRole || requiredRoles.length === 0) {
    return false;
  }

  // Direct role match
  if (requiredRoles.includes(userRole)) {
    return true;
  }

  // Hierarchy-based access
  const roleLevel = roleHierarchy[userRole as Role];
  if (!roleLevel) return false;

  return requiredRoles.some(role => {
    const requiredLevel = roleHierarchy[role as Role];
    return requiredLevel && roleLevel >= requiredLevel;
  });
};

// Sales Representative specific permissions
export const canCreateOrders = (userRole: Role): boolean => {
  return hasPermission(userRole, 'orders', 'create');
};

export const canManageCustomers = (userRole: Role): boolean => {
  return hasPermission(userRole, 'customers', 'create') || hasPermission(userRole, 'customers', 'update');
};

export const canCreateQuotations = (userRole: Role): boolean => {
  return hasPermission(userRole, 'quotations', 'create');
};

export const canManageLeads = (userRole: Role): boolean => {
  return hasPermission(userRole, 'leads', 'create') || hasPermission(userRole, 'leads', 'update');
};

export const canViewSalesAnalytics = (userRole: Role): boolean => {
  return hasPermission(userRole, 'sales_analytics', 'read');
};

// Project Manager specific permissions
export const canManageProjects = (userRole: Role): boolean => {
  return hasPermission(userRole, 'projects', 'update') || hasPermission(userRole, 'projects', 'delete');
};

export const canManageTasks = (userRole: Role): boolean => {
  return hasPermission(userRole, 'tasks', 'update') || hasPermission(userRole, 'tasks', 'delete');
};

export const canViewTimeline = (userRole: Role): boolean => {
  return hasPermission(userRole, 'timeline', 'read');
};

// Account User specific permissions
export const canManageInvoices = (userRole: Role): boolean => {
  return hasPermission(userRole, 'invoices', 'create') || hasPermission(userRole, 'invoices', 'update');
};

export const canManagePayments = (userRole: Role): boolean => {
  return hasPermission(userRole, 'payments', 'create') || hasPermission(userRole, 'payments', 'update');
};

export const canViewFinancialReports = (userRole: Role): boolean => {
  return hasPermission(userRole, 'financial_reports', 'read');
};

export const canManageBilling = (userRole: Role): boolean => {
  return hasPermission(userRole, 'billing', 'create') || hasPermission(userRole, 'billing', 'update');
};

// Inspector specific permissions
export const canCreateReports = (userRole: Role): boolean => {
  return hasPermission(userRole, 'reports', 'create');
};

export const canUpdateTasks = (userRole: Role): boolean => {
  return hasPermission(userRole, 'tasks', 'update');
};

// Admin specific permissions
export const canManageUsers = (userRole: Role): boolean => {
  return hasPermission(userRole, 'users', 'create') || 
         hasPermission(userRole, 'users', 'update') || 
         hasPermission(userRole, 'users', 'delete');
};

export const canManageSettings = (userRole: Role): boolean => {
  return hasPermission(userRole, 'settings', 'update') || hasPermission(userRole, 'settings', 'delete');
};

// Route protection helper
export const requireRole = (allowedRoles: Role[]) => {
  return (userRole: string | null): boolean => {
    if (!userRole) return false;
    return canAccessRoute(userRole, allowedRoles);
  };
};

// Component permission checker
export const usePermission = (resource: Resource, action: Action = 'read') => {
  return (userRole: Role | null): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, resource, action);
  };
};

// Bulk permission checker
export const checkMultiplePermissions = (
  userRole: Role,
  checks: Array<{ resource: Resource; action: Action }>
): boolean => {
  return checks.every(({ resource, action }) => hasPermission(userRole, resource, action));
};

// Get all permissions for a role
export const getRolePermissions = (userRole: Role): Record<Resource, Action[]> => {
  return permissions[userRole] || {};
};

// Get allowed actions for a resource
export const getAllowedActions = (userRole: Role, resource: Resource): Action[] => {
  const rolePermissions = permissions[userRole];
  if (!rolePermissions || !rolePermissions[resource]) {
    return [];
  }
  return rolePermissions[resource];
};

// Permission middleware for API routes
export const createPermissionMiddleware = (resource: Resource, action: Action) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role as Role;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized: No user role' });
    }
    
    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({ 
        error: `Forbidden: Insufficient permissions for ${action} on ${resource}` 
      });
    }
    
    next();
  };
};

// Route validation helper
export const validateRouteAccess = (userRole: string, routePath: string): boolean => {
  const routeRoleMap: Record<string, Role[]> = {
    '/dashboard': ['user', 'EITS_Sale_Representative', 'EITS_Site_Inspector', 'accountUser', 'project_manager', 'admin'],
    '/sales': ['EITS_Sale_Representative', 'admin'],
    '/sales/orders': ['EITS_Sale_Representative', 'admin'],
    '/sales/customers': ['EITS_Sale_Representative', 'admin'],
    '/sales/quotations': ['EITS_Sale_Representative', 'admin'],
    '/sales/leads': ['EITS_Sale_Representative', 'admin'],
    '/projects': ['project_manager', 'admin'],
    '/projects/tasks': ['project_manager', 'admin'],
    '/accounting': ['accountUser', 'admin'],
    '/accounting/invoices': ['accountUser', 'admin'],
    '/accounting/payments': ['accountUser', 'admin'],
    '/reports': ['EITS_Site_Inspector', 'EITS_Sale_Representative', 'accountUser', 'project_manager', 'admin'],
    '/admin': ['admin'],
    '/admin/users': ['admin'],
    '/admin/settings': ['admin']
  };
  
  const allowedRoles = routeRoleMap[routePath];
  if (!allowedRoles) return true; // Allow access to unprotected routes
  
  return canAccessRoute(userRole, allowedRoles);
};