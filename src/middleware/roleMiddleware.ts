export const roleMiddleware = (userRole: string, allowedRoles: string | string[]) => {
  if (!userRole || !allowedRoles.length) {
    return false;
  }
  
  return allowedRoles.includes(userRole);
};

// Enhanced middleware with permission checking
type Role = 'user' | 'sales' | 'admin';
type Resource =
  | 'dashboard'
  | 'profile'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'users';
type Action = 'read' | 'create' | 'update' | 'delete';

const permissions: Record<Role, Record<Resource, Action[]>> = {
  user: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create'],
    customers: [],
    reports: [],
    users: []
  },
  sales: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create', 'update'],
    customers: ['read', 'create', 'update'],
    reports: ['read'],
    users: []
  },
  admin: {
    dashboard: ['read'],
    profile: ['read', 'update'],
    orders: ['read', 'create', 'update', 'delete'],
    customers: ['read', 'create', 'update', 'delete'],
    reports: ['read', 'create'],
    users: ['read', 'create', 'update', 'delete']
  }
};

export const hasPermission = (
  userRole: Role,
  resource: Resource,
  action: Action
) => {
  const userPermissions = permissions[userRole];
  if (!userPermissions || !userPermissions[resource]) {
    return false;
  }

  return userPermissions[resource].includes(action);
};