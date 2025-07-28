// src/middleware/roleMiddleware.ts

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
type Role = 'user' | 'sales' | 'inspector' | 'project_manager' | 'accountUser' | 'admin';
type Resource =
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
  | 'billing';
type Action = 'read' | 'create' | 'update' | 'delete';

const permissions: Record<Role, Record<Resource, Action[]>> = {
  user: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create'],
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
    billing: []
  },
  sales: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create', 'update'],
    customers: ['read', 'create', 'update'],
    reports: ['read'],
    users: [],
    settings: ['read'],
    projects: ['read'],
    tasks: ['read'],
    timeline: ['read'],
    invoices: ['read'],
    payments: ['read'],
    financial_reports: ['read'],
    billing: ['read']
  },
  inspector: {
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
    billing: []
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
    billing: ['read', 'create', 'update']
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
    billing: ['read']
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
    billing: ['read', 'create', 'update', 'delete']
  }
};

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
  sales: 2,
  inspector: 2, // Same level as sales but with different permissions
  accountUser: 2, // Same level as sales and inspector but with financial permissions
  project_manager: 3, // Higher level with project management capabilities
  admin: 4
};

export const hasRoleLevel = (userRole: Role, requiredLevel: Role): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredLevel];
};

// Check if user can access a route based on role hierarchy
export const canAccessRoute = (userRole: string, requiredRoles: string[]): boolean => {
  if (!userRole || requiredRoles.length === 0) {
    return false;
  }

  return requiredRoles.some(role => {
    if (role === userRole) return true;
    
    // Check hierarchy for admin access (highest level)
    if (userRole === 'admin' && ['user', 'sales', 'inspector', 'accountUser', 'project_manager'].includes(role)) {
      return true;
    }
    
    // Check hierarchy for project_manager access
    if (userRole === 'project_manager' && ['user', 'sales', 'inspector', 'accountUser'].includes(role)) {
      return true;
    }
    
    // Check hierarchy for sales access to user routes
    if (userRole === 'sales' && role === 'user') {
      return true;
    }
    
    // Check hierarchy for inspector access to user routes
    if (userRole === 'inspector' && role === 'user') {
      return true;
    }
    
    // Check hierarchy for accountUser access to user routes
    if (userRole === 'accountUser' && role === 'user') {
      return true;
    }
    
    return false;
  });
};

// Utility functions for project manager specific permissions
export const canManageProjects = (userRole: Role): boolean => {
  return hasPermission(userRole, 'projects', 'update') || hasPermission(userRole, 'projects', 'delete');
};

export const canManageTasks = (userRole: Role): boolean => {
  return hasPermission(userRole, 'tasks', 'update') || hasPermission(userRole, 'tasks', 'delete');
};

export const canViewTimeline = (userRole: Role): boolean => {
  return hasPermission(userRole, 'timeline', 'read');
};

// Utility functions for accountUser specific permissions
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