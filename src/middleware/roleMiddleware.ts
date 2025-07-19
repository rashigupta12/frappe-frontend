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
type Role = 'user' | 'sales' | 'inspector' | 'project_manager' | 'admin';
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
  | 'timeline';
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
    timeline: []
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
    timeline: ['read']
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
    timeline: ['read']
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
    timeline: ['read', 'create', 'update']
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
    timeline: ['read', 'create', 'update', 'delete']
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
    if (userRole === 'admin' && ['user', 'sales', 'inspector', 'project_manager'].includes(role)) {
      return true;
    }
    
    // Check hierarchy for project_manager access
    if (userRole === 'project_manager' && ['user', 'sales', 'inspector'].includes(role)) {
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