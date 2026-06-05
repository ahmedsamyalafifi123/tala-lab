export enum UserRole {
  // Manager Role (platform-wide access)
  MANAGER = "manager",

  // Lab Roles
  LAB_ADMIN = "lab_admin",
  LAB_STAFF = "lab_staff",
  LAB_VIEWER = "lab_viewer",
}

export interface RolePermissions {
  // Dashboard & Analytics
  viewDashboard: boolean;
  viewAnalytics: boolean;
  viewCrossLabAnalytics: boolean;

  // Client Management
  addClient: boolean;
  editClient: boolean;
  deleteClient: boolean;
  exportClients: boolean;
  importClients: boolean;

  // Category Management
  manageCategories: boolean;

  // User Management
  manageUsers: boolean;
  deleteUser: boolean;

  // Lab Management
  createLab: boolean;
  editLab: boolean;
  deleteLab: boolean;
  assignLabAdmins: boolean;
  impersonateUser: boolean;

  // Other
  manageSettings: boolean;
  viewAuditLog: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.MANAGER]: {
    viewDashboard: true,
    viewAnalytics: true,
    viewCrossLabAnalytics: true,
    addClient: true,
    editClient: true,
    deleteClient: true,
    exportClients: true,
    importClients: true,
    manageCategories: true,
    manageUsers: true,
    deleteUser: true,
    createLab: true,
    editLab: true,
    deleteLab: true,
    assignLabAdmins: true,
    impersonateUser: true,
    manageSettings: true,
    viewAuditLog: true,
  },
  [UserRole.LAB_ADMIN]: {
    viewDashboard: true,
    viewAnalytics: true,
    viewCrossLabAnalytics: false,
    addClient: true,
    editClient: true,
    deleteClient: true,
    exportClients: true,
    importClients: true,
    manageCategories: true,
    manageUsers: true,
    deleteUser: true,
    createLab: false,
    editLab: false,
    deleteLab: false,
    assignLabAdmins: false,
    impersonateUser: false,
    manageSettings: true,
    viewAuditLog: true,
  },
  [UserRole.LAB_STAFF]: {
    viewDashboard: true,
    viewAnalytics: true,
    viewCrossLabAnalytics: false,
    addClient: true,
    editClient: true,
    deleteClient: false,
    exportClients: true,
    importClients: false,
    manageCategories: false,
    manageUsers: false,
    deleteUser: false,
    createLab: false,
    editLab: false,
    deleteLab: false,
    assignLabAdmins: false,
    impersonateUser: false,
    manageSettings: false,
    viewAuditLog: false,
  },
  [UserRole.LAB_VIEWER]: {
    viewDashboard: true,
    viewAnalytics: true,
    viewCrossLabAnalytics: false,
    addClient: false,
    editClient: false,
    deleteClient: false,
    exportClients: true,
    importClients: false,
    manageCategories: false,
    manageUsers: false,
    deleteUser: false,
    createLab: false,
    editLab: false,
    deleteLab: false,
    assignLabAdmins: false,
    impersonateUser: false,
    manageSettings: false,
    viewAuditLog: false,
  },
};

export function getUserPermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[UserRole.LAB_VIEWER];
}
