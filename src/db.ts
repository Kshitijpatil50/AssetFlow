import { 
  Department, AssetCategory, Employee, Asset, Allocation, 
  TransferRequest, ResourceBooking, MaintenanceRequest, AuditCycle, 
  AuditItem, Notification, ActivityLog, PastAllocationRecord, EmployeeRole,
  CustomFieldConfig
} from './types';
import { 
  SEED_DEPARTMENTS, SEED_CATEGORIES, SEED_EMPLOYEES, 
  SEED_ASSETS, SEED_ALLOCATIONS, SEED_BOOKINGS, SEED_MAINTENANCE, 
  SEED_AUDITS, SEED_AUDIT_ITEMS 
} from './seedData';
import { collection, doc, setDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let subscribers: (() => void)[] = [];

export function subscribe(callback: () => void) {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(s => s !== callback);
  };
}

function notifySubscribers() {
  subscribers.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error("Subscriber callback failed:", e);
    }
  });
}

export async function saveDoc(collectionName: string, data: any) {
  if (!data || !data.id) return;
  try {
    await setDoc(doc(db, collectionName, data.id), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${data.id}`);
  }
}

// Keys for local storage
const KEYS = {
  DEPARTMENTS: 'assetflow_departments',
  CATEGORIES: 'assetflow_categories',
  EMPLOYEES: 'assetflow_employees',
  ASSETS: 'assetflow_assets',
  ALLOCATIONS: 'assetflow_allocations',
  TRANSFERS: 'assetflow_transfers',
  BOOKINGS: 'assetflow_bookings',
  MAINTENANCE: 'assetflow_maintenance',
  AUDITS: 'assetflow_audits',
  AUDIT_ITEMS: 'assetflow_audit_items',
  NOTIFICATIONS: 'assetflow_notifications',
  LOGS: 'assetflow_logs',
  CURRENT_USER_ID: 'assetflow_current_user_id',
};

// Helper to load or initialize from seed data
function getStorageItem<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
}

function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Initial state load
export let departments: Department[] = getStorageItem(KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
export let categories: AssetCategory[] = getStorageItem(KEYS.CATEGORIES, SEED_CATEGORIES);
export let employees: Employee[] = getStorageItem(KEYS.EMPLOYEES, SEED_EMPLOYEES);
export let assets: Asset[] = getStorageItem(KEYS.ASSETS, SEED_ASSETS);
export let allocations: Allocation[] = getStorageItem(KEYS.ALLOCATIONS, SEED_ALLOCATIONS);
export let transfers: TransferRequest[] = getStorageItem(KEYS.TRANSFERS, []);
export let bookings: ResourceBooking[] = getStorageItem(KEYS.BOOKINGS, SEED_BOOKINGS);
export let maintenance: MaintenanceRequest[] = getStorageItem(KEYS.MAINTENANCE, SEED_MAINTENANCE);
export let audits: AuditCycle[] = getStorageItem(KEYS.AUDITS, SEED_AUDITS);
export let auditItems: AuditItem[] = getStorageItem(KEYS.AUDIT_ITEMS, SEED_AUDIT_ITEMS);
export let notifications: Notification[] = getStorageItem(KEYS.NOTIFICATIONS, [
  {
    id: 'notif-1',
    recipientEmployeeId: 'emp-jane',
    type: 'Asset Assigned',
    message: 'MacBook Pro 16" M3 Max has been allocated to you. Expected return date: 2026-08-05.',
    relatedEntityId: 'asset-1',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    recipientEmployeeId: 'emp-marcus',
    type: 'Overdue Alert',
    message: 'The Herman Miller Aeron Chair allocated to you is OVERDUE for return.',
    relatedEntityId: 'asset-7',
    read: false,
    createdAt: new Date().toISOString(),
  }
]);
export let logs: ActivityLog[] = getStorageItem(KEYS.LOGS, [
  {
    id: 'log-1',
    actorId: 'emp-sarah',
    actorName: 'Kshitij Patil',
    action: 'System Seeded',
    entityType: 'Asset',
    entityId: 'asset-1',
    timestamp: new Date().toISOString(),
    details: 'Initial system seed data loaded successfully.'
  }
]);

// Auto-migrate from old names if they exist in localStorage to avoid stale storage issues
const hasOldNames = employees.some(e => e.name.includes("Sarah Connor") || e.name.includes("Jack Malone") || e.name.includes("Jane Doe"));
if (hasOldNames) {
  // Clear all relevant keys to force re-seeding with Indian names
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  // Reload variables with clean seeds
  departments = SEED_DEPARTMENTS;
  categories = SEED_CATEGORIES;
  employees = SEED_EMPLOYEES;
  assets = SEED_ASSETS;
  allocations = SEED_ALLOCATIONS;
  bookings = SEED_BOOKINGS;
  maintenance = SEED_MAINTENANCE;
  audits = SEED_AUDITS;
  auditItems = SEED_AUDIT_ITEMS;
  
  // Re-save fresh data
  setStorageItem(KEYS.DEPARTMENTS, departments);
  setStorageItem(KEYS.CATEGORIES, categories);
  setStorageItem(KEYS.EMPLOYEES, employees);
  setStorageItem(KEYS.ASSETS, assets);
  setStorageItem(KEYS.ALLOCATIONS, allocations);
  setStorageItem(KEYS.TRANSFERS, []);
  setStorageItem(KEYS.BOOKINGS, bookings);
  setStorageItem(KEYS.MAINTENANCE, maintenance);
  setStorageItem(KEYS.AUDITS, audits);
  setStorageItem(KEYS.AUDIT_ITEMS, auditItems);
}

export let currentUserId: string | null = localStorage.getItem(KEYS.CURRENT_USER_ID) || 'emp-sarah'; // Default to Admin for testing

// Save functions
const saveState = {
  departments: () => {
    setStorageItem(KEYS.DEPARTMENTS, departments);
    departments.forEach(item => saveDoc('departments', item));
  },
  categories: () => {
    setStorageItem(KEYS.CATEGORIES, categories);
    categories.forEach(item => saveDoc('categories', item));
  },
  employees: () => {
    setStorageItem(KEYS.EMPLOYEES, employees);
    employees.forEach(item => saveDoc('employees', item));
  },
  assets: () => {
    setStorageItem(KEYS.ASSETS, assets);
    assets.forEach(item => saveDoc('assets', item));
  },
  allocations: () => {
    setStorageItem(KEYS.ALLOCATIONS, allocations);
    allocations.forEach(item => saveDoc('allocations', item));
  },
  transfers: () => {
    setStorageItem(KEYS.TRANSFERS, transfers);
    transfers.forEach(item => saveDoc('transfers', item));
  },
  bookings: () => {
    setStorageItem(KEYS.BOOKINGS, bookings);
    bookings.forEach(item => saveDoc('bookings', item));
  },
  maintenance: () => {
    setStorageItem(KEYS.MAINTENANCE, maintenance);
    maintenance.forEach(item => saveDoc('maintenance', item));
  },
  audits: () => {
    setStorageItem(KEYS.AUDITS, audits);
    audits.forEach(item => saveDoc('audits', item));
  },
  auditItems: () => {
    setStorageItem(KEYS.AUDIT_ITEMS, auditItems);
    auditItems.forEach(item => saveDoc('auditItems', item));
  },
  notifications: () => {
    setStorageItem(KEYS.NOTIFICATIONS, notifications);
    notifications.forEach(item => saveDoc('notifications', item));
  },
  logs: () => {
    setStorageItem(KEYS.LOGS, logs);
    logs.forEach(item => saveDoc('logs', item));
  },
};

export function logActivity(actorId: string, actorName: string, action: string, entityType: ActivityLog['entityType'], entityId: string, details: string) {
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    actorId,
    actorName,
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    details,
  };
  logs = [newLog, ...logs];
  saveState.logs();
}

export function createNotification(recipientEmployeeId: string, type: Notification['type'], message: string, relatedEntityId: string) {
  const newNotif: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    recipientEmployeeId,
    type,
    message,
    relatedEntityId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications = [newNotif, ...notifications];
  saveState.notifications();
}

// Check and update overdue allocations automatically on load/intervals
export function checkOverdueAllocations() {
  const nowStr = new Date().toISOString().split('T')[0];
  let changed = false;

  allocations = allocations.map(alloc => {
    if (alloc.status === 'Active' && alloc.expectedReturnDate && alloc.expectedReturnDate < nowStr) {
      changed = true;
      // Get asset name
      const asset = assets.find(a => a.id === alloc.assetId);
      const assetName = asset ? asset.name : 'Unknown Asset';
      
      // Update status
      const updatedAlloc: Allocation = { ...alloc, status: 'Overdue' };

      // Trigger notifications for employee or department
      if (alloc.employeeId) {
        createNotification(
          alloc.employeeId,
          'Overdue Alert',
          `The allocated asset "${assetName}" is overdue! Expected return was ${alloc.expectedReturnDate}.`,
          alloc.assetId
        );
      } else if (alloc.departmentId) {
        // Find department head
        const dept = departments.find(d => d.id === alloc.departmentId);
        if (dept && dept.headEmployeeId) {
          createNotification(
            dept.headEmployeeId,
            'Overdue Alert',
            `The department-allocated asset "${assetName}" (Dept: ${dept.name}) is overdue! Expected return was ${alloc.expectedReturnDate}.`,
            alloc.assetId
          );
        }
      }
      return updatedAlloc;
    }
    return alloc;
  });

  if (changed) {
    saveState.allocations();
  }
}

// Call check immediately to populate overdue fields
checkOverdueAllocations();

// Authentication API
export function getCurrentUser(): Employee | null {
  if (!currentUserId) return null;
  return employees.find(e => e.id === currentUserId && e.status === 'Active') || null;
}

export function login(email: string): { success: boolean; error?: string; user?: Employee } {
  const user = employees.find(e => e.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return { success: false, error: 'User not found.' };
  }
  if (user.status === 'Inactive') {
    return { success: false, error: 'Account is inactive. Please contact your Admin.' };
  }
  currentUserId = user.id;
  localStorage.setItem(KEYS.CURRENT_USER_ID, currentUserId);
  logActivity(user.id, user.name, 'Logged In', 'Employee', user.id, `User logged in with email: ${email}`);
  return { success: true, user };
}

export function signup(name: string, email: string, departmentId: string | null): { success: boolean; error?: string; user?: Employee } {
  const exists = employees.some(e => e.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return { success: false, error: 'Email already registered.' };
  }

  const newEmployee: Employee = {
    id: `emp-${Date.now()}`,
    name,
    email: email.trim(),
    departmentId,
    role: 'Employee', // Strict rule: signup is always Employee
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  employees = [...employees, newEmployee];
  saveState.employees();

  currentUserId = newEmployee.id;
  localStorage.setItem(KEYS.CURRENT_USER_ID, currentUserId);
  logActivity(newEmployee.id, newEmployee.name, 'Signed Up', 'Employee', newEmployee.id, `New employee registration: ${name}`);
  createNotification(newEmployee.id, 'System', 'Welcome to AssetFlow! Explore your workspace and assets.', newEmployee.id);

  return { success: true, user: newEmployee };
}

export function logout() {
  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Logged Out', 'Employee', user.id, 'User logged out.');
  }
  currentUserId = null;
  localStorage.removeItem(KEYS.CURRENT_USER_ID);
}

// Switch user for easy demoing of multiple RBAC roles
export function demoSwitchUser(userId: string): Employee | null {
  const user = employees.find(e => e.id === userId);
  if (user) {
    currentUserId = user.id;
    localStorage.setItem(KEYS.CURRENT_USER_ID, currentUserId);
    logActivity(user.id, user.name, 'Switched Session (Demo)', 'Employee', user.id, `Switched session to ${user.name}`);
    return user;
  }
  return null;
}

// ----------------------
// BUSINESS OPERATIONS
// ----------------------

// 1. Departments Management (Admin)
export function addDepartment(name: string, code: string, headEmployeeId: string | null, parentDepartmentId: string | null): Department {
  const newDept: Department = {
    id: `dept-${Date.now()}`,
    name,
    code: code.toUpperCase(),
    headEmployeeId,
    parentDepartmentId,
    status: 'Active',
  };
  departments = [...departments, newDept];
  saveState.departments();
  
  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Created Department', 'Department', newDept.id, `Created department "${name}" with code ${code}.`);
  }
  return newDept;
}

export function updateDepartment(id: string, name: string, code: string, headEmployeeId: string | null, parentDepartmentId: string | null, status: 'Active' | 'Inactive') {
  departments = departments.map(d => {
    if (d.id === id) {
      return { ...d, name, code: code.toUpperCase(), headEmployeeId, parentDepartmentId, status };
    }
    return d;
  });
  saveState.departments();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Updated Department', 'Department', id, `Updated department "${name}". Status: ${status}`);
  }
}

// 2. Categories Management (Admin)
export function addCategory(name: string, customFields: CustomFieldConfig[]): AssetCategory {
  const newCat: AssetCategory = {
    id: `cat-${Date.now()}`,
    name,
    customFields,
    status: 'Active',
  };
  categories = [...categories, newCat];
  saveState.categories();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Created Category', 'Category', newCat.id, `Created asset category "${name}" with ${customFields.length} custom fields.`);
  }
  return newCat;
}

export function updateCategory(id: string, name: string, customFields: CustomFieldConfig[], status: 'Active' | 'Inactive') {
  categories = categories.map(c => {
    if (c.id === id) {
      return { ...c, name, customFields, status };
    }
    return c;
  });
  saveState.categories();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Updated Category', 'Category', id, `Updated category "${name}". Status: ${status}`);
  }
}

// 3. Employee Management (Admin)
export function updateEmployeeRole(employeeId: string, role: EmployeeRole, departmentId: string | null, status: 'Active' | 'Inactive') {
  employees = employees.map(e => {
    if (e.id === employeeId) {
      return { ...e, role, departmentId, status };
    }
    return e;
  });
  saveState.employees();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Updated Employee Role', 'Employee', employeeId, `Promoted/Updated employee ID ${employeeId} to role: ${role}. Status: ${status}`);
  }

  // Notify employee
  createNotification(
    employeeId,
    'System',
    `Your system profile has been updated. Role: ${role}. Status: ${status}.`,
    employeeId
  );
}

// 4. Asset Management (Asset Manager / Admin)
export function registerAsset(
  name: string, categoryId: string, serialNumber: string, acquisitionDate: string,
  acquisitionCost: number, condition: Asset['condition'], location: string,
  isBookable: boolean, customFieldValues: Record<string, string | number>,
  photoUrls: string[] = [],
  id?: string
): Asset {
  // Auto-generate Asset Tag e.g. AF-XXXX
  const nextNum = assets.length + 1;
  const assetTag = `AF-${String(nextNum).padStart(4, '0')}`;

  const newAsset: Asset = {
    id: id || `asset-${Date.now()}`,
    name,
    categoryId,
    assetTag,
    serialNumber,
    acquisitionDate,
    acquisitionCost,
    condition,
    location,
    photoUrls,
    documentUrls: [],
    isBookable,
    status: 'Available',
    customFieldValues,
  };

  assets = [...assets, newAsset];
  saveState.assets();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Registered Asset', 'Asset', newAsset.id, `Registered new asset ${name} (${assetTag}) in category ${categoryId}.`);
  }
  return newAsset;
}

export function updateAsset(
  id: string, name: string, categoryId: string, serialNumber: string, acquisitionDate: string,
  acquisitionCost: number, condition: Asset['condition'], location: string,
  isBookable: boolean, status: Asset['status'], customFieldValues: Record<string, string | number>,
  photoUrls?: string[]
) {
  assets = assets.map(a => {
    if (a.id === id) {
      return { 
        ...a, name, categoryId, serialNumber, acquisitionDate, acquisitionCost, 
        condition, location, isBookable, status, customFieldValues,
        photoUrls: photoUrls !== undefined ? photoUrls : a.photoUrls
      };
    }
    return a;
  });
  saveState.assets();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Updated Asset', 'Asset', id, `Updated asset details for "${name}" (Status: ${status}).`);
  }
}

// 5. Allocations & Transfers (Asset Manager / Admin / Employee)
export function allocateAsset(
  assetId: string, holderId: string, holderType: 'Employee' | 'Department', 
  expectedReturnDate: string | null
): { success: boolean; error?: string; allocation?: Allocation } {
  // Check if asset is already allocated
  const asset = assets.find(a => a.id === assetId);
  if (!asset) {
    return { success: false, error: 'Asset not found.' };
  }

  // Strict Business Rule 2: An asset cannot be allocated to two holders simultaneously.
  if (asset.status !== 'Available' && asset.status !== 'Reserved') {
    // Find current active allocation holder info
    const currentAlloc = allocations.find(al => al.assetId === assetId && al.status === 'Active');
    let holderName = 'another entity';
    if (currentAlloc) {
      if (currentAlloc.employeeId) {
        const emp = employees.find(e => e.id === currentAlloc.employeeId);
        if (emp) holderName = emp.name;
      } else if (currentAlloc.departmentId) {
        const dept = departments.find(d => d.id === currentAlloc.departmentId);
        if (dept) holderName = `Department: ${dept.name}`;
      }
    }
    return { 
      success: false, 
      error: `Asset is already allocated. Currently held by ${holderName}. You must request a transfer instead.` 
    };
  }

  // Create new allocation
  const employeeId = holderType === 'Employee' ? holderId : null;
  const departmentId = holderType === 'Department' ? holderId : null;

  const newAlloc: Allocation = {
    id: `alloc-${Date.now()}`,
    assetId,
    employeeId,
    departmentId,
    allocatedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate,
    actualReturnDate: null,
    status: 'Active',
    conditionCheckInNotes: null,
    history: [],
  };

  allocations = [...allocations, newAlloc];
  saveState.allocations();

  // Update Asset Status to Allocated
  assets = assets.map(a => {
    if (a.id === assetId) {
      return { ...a, status: 'Allocated' };
    }
    return a;
  });
  saveState.assets();

  const user = getCurrentUser();
  const actorId = user ? user.id : 'system';
  const actorName = user ? user.name : 'System';

  logActivity(actorId, actorName, 'Allocated Asset', 'Allocation', newAlloc.id, `Allocated asset ${asset.name} to ${holderType} (ID: ${holderId}).`);
  
  // Create notifications
  if (employeeId) {
    createNotification(employeeId, 'Asset Assigned', `Asset "${asset.name}" (${asset.assetTag}) has been allocated to you. Expected return: ${expectedReturnDate || 'N/A'}.`, assetId);
  } else if (departmentId) {
    const dept = departments.find(d => d.id === departmentId);
    if (dept && dept.headEmployeeId) {
      createNotification(dept.headEmployeeId, 'Asset Assigned', `Asset "${asset.name}" (${asset.assetTag}) has been allocated to your department: ${dept.name}.`, assetId);
    }
  }

  return { success: true, allocation: newAlloc };
}

export function returnAsset(allocationId: string, checkInNotes: string, condition: Asset['condition']) {
  const alloc = allocations.find(al => al.id === allocationId);
  if (!alloc) return;

  const asset = assets.find(a => a.id === alloc.assetId);
  const assetName = asset ? asset.name : 'Asset';

  // Record past history
  const pastRecord: PastAllocationRecord = {
    holderId: (alloc.employeeId || alloc.departmentId)!,
    holderType: alloc.employeeId ? 'Employee' : 'Department',
    allocatedDate: alloc.allocatedDate,
    returnDate: new Date().toISOString().split('T')[0],
    conditionCheckInNotes: checkInNotes,
  };

  allocations = allocations.map(al => {
    if (al.id === allocationId) {
      return {
        ...al,
        actualReturnDate: new Date().toISOString().split('T')[0],
        status: 'Returned' as const,
        conditionCheckInNotes: checkInNotes,
        history: [...al.history, pastRecord]
      };
    }
    return al;
  });
  saveState.allocations();

  // Revert Asset status to Available, update condition
  assets = assets.map(a => {
    if (a.id === alloc.assetId) {
      return { ...a, status: 'Available' as const, condition };
    }
    return a;
  });
  saveState.assets();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Returned Asset', 'Allocation', allocationId, `Asset "${assetName}" returned. Check-in condition: ${condition}.`);
    
    // Notify holder of successful check-in
    if (alloc.employeeId) {
      createNotification(alloc.employeeId, 'System', `Your return of "${assetName}" has been received and verified by Asset Manager.`, alloc.assetId);
    }
  }
}

// 6. Transfer Requests (Strict Business Rule 2 Workflow)
export function initiateTransfer(assetId: string, toHolderId: string): { success: boolean; error?: string; transfer?: TransferRequest } {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return { success: false, error: 'Asset not found.' };

  // Find current allocation
  const currentAlloc = allocations.find(al => al.assetId === assetId && al.status === 'Active');
  if (!currentAlloc) {
    return { success: false, error: 'Asset does not have an active allocation to transfer from.' };
  }

  const fromHolderId = (currentAlloc.employeeId || currentAlloc.departmentId)!;
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'No active session.' };

  const newTransfer: TransferRequest = {
    id: `transfer-${Date.now()}`,
    assetId,
    fromHolderId,
    toHolderId,
    requestedBy: user.id,
    status: 'Requested',
    approvedBy: null,
    timestamp: new Date().toISOString(),
  };

  transfers = [...transfers, newTransfer];
  saveState.transfers();

  logActivity(user.id, user.name, 'Initiated Transfer', 'Transfer', newTransfer.id, `Requested asset transfer for "${asset.name}" to holder ${toHolderId}.`);

  // Notify Asset Manager (and the original holder if employee)
  // Let's find asset manager(s) to send notification
  const managers = employees.filter(e => e.role === 'Asset Manager' || e.role === 'Admin');
  managers.forEach(m => {
    createNotification(m.id, 'Transfer Status', `New Transfer Request for "${asset.name}" from ${user.name}.`, newTransfer.id);
  });

  if (currentAlloc.employeeId && currentAlloc.employeeId !== user.id) {
    createNotification(currentAlloc.employeeId, 'Transfer Status', `A transfer has been requested for your allocated asset "${asset.name}".`, newTransfer.id);
  }

  return { success: true, transfer: newTransfer };
}

export function approveTransfer(transferId: string, approve: boolean): { success: boolean; error?: string } {
  const trans = transfers.find(t => t.id === transferId);
  if (!trans) return { success: false, error: 'Transfer request not found.' };

  if (trans.status !== 'Requested') {
    return { success: false, error: 'Transfer request has already been processed.' };
  }

  const asset = assets.find(a => a.id === trans.assetId);
  if (!asset) return { success: false, error: 'Asset not found.' };

  const user = getCurrentUser();
  if (!user) return { success: false, error: 'No active session.' };

  const approvedBy = user.id;
  const status = approve ? 'Approved' : 'Rejected';

  transfers = transfers.map(t => {
    if (t.id === transferId) {
      return { ...t, status, approvedBy };
    }
    return t;
  });
  saveState.transfers();

  logActivity(user.id, user.name, `${status} Transfer`, 'Transfer', transferId, `Transfer of "${asset.name}" ${status.toLowerCase()} by ${user.name}.`);

  if (!approve) {
    createNotification(trans.requestedBy, 'Transfer Status', `Your transfer request for "${asset.name}" was rejected.`, trans.id);
    return { success: true };
  }

  // Approved! Perform Re-allocation:
  // 1. Terminate current allocation
  const currentAlloc = allocations.find(al => al.assetId === trans.assetId && al.status === 'Active');
  if (currentAlloc) {
    const pastRecord: PastAllocationRecord = {
      holderId: (currentAlloc.employeeId || currentAlloc.departmentId)!,
      holderType: currentAlloc.employeeId ? 'Employee' : 'Department',
      allocatedDate: currentAlloc.allocatedDate,
      returnDate: new Date().toISOString().split('T')[0],
      conditionCheckInNotes: `Transferred via request ID ${transferId}`,
    };

    allocations = allocations.map(al => {
      if (al.id === currentAlloc.id) {
        return {
          ...al,
          actualReturnDate: new Date().toISOString().split('T')[0],
          status: 'Returned' as const,
          conditionCheckInNotes: `Transferred directly to user ${trans.toHolderId}`,
          history: [...al.history, pastRecord],
        };
      }
      return al;
    });
  }

  // 2. Create new allocation for toHolder
  const toEmployee = employees.find(e => e.id === trans.toHolderId);
  const employeeId = toEmployee ? trans.toHolderId : null;
  const departmentId = !toEmployee ? trans.toHolderId : null;

  const newAlloc: Allocation = {
    id: `alloc-${Date.now()}`,
    assetId: trans.assetId,
    employeeId,
    departmentId,
    allocatedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: null,
    actualReturnDate: null,
    status: 'Active',
    conditionCheckInNotes: null,
    history: currentAlloc ? [...currentAlloc.history, {
      holderId: (currentAlloc.employeeId || currentAlloc.departmentId)!,
      holderType: currentAlloc.employeeId ? 'Employee' : 'Department',
      allocatedDate: currentAlloc.allocatedDate,
      returnDate: new Date().toISOString().split('T')[0],
    }] : [],
  };

  allocations = [...allocations, newAlloc];
  saveState.allocations();

  // 3. Mark transfer as Re-allocated
  transfers = transfers.map(t => {
    if (t.id === transferId) {
      return { ...t, status: 'Re-allocated' as const };
    }
    return t;
  });
  saveState.transfers();

  // 4. Update asset status
  assets = assets.map(a => {
    if (a.id === trans.assetId) {
      return { ...a, status: 'Allocated' as const };
    }
    return a;
  });
  saveState.assets();

  // Notifications
  createNotification(trans.requestedBy, 'Transfer Status', `Your transfer request for "${asset.name}" has been completed!`, trans.id);
  if (employeeId) {
    createNotification(employeeId, 'Asset Assigned', `Asset "${asset.name}" was transferred and assigned to you.`, trans.assetId);
  } else if (departmentId) {
    const dept = departments.find(d => d.id === departmentId);
    if (dept && dept.headEmployeeId) {
      createNotification(dept.headEmployeeId, 'Asset Assigned', `Asset "${asset.name}" was transferred and assigned to department ${dept.name}.`, trans.assetId);
    }
  }

  logActivity('system', 'System', 'Completed Re-allocation', 'Allocation', newAlloc.id, `Asset "${asset.name}" re-allocated to holder ${trans.toHolderId} via transfer.`);

  return { success: true };
}

// 7. Shared Resource Booking (Strict Business Rule 3 Overlap)
export function addBooking(
  resourceAssetId: string, bookedBy: string, departmentId: string | null, 
  startTime: string, endTime: string
): { success: boolean; error?: string; booking?: ResourceBooking } {
  
  // Parse inputs
  const requestStart = new Date(startTime).getTime();
  const requestEnd = new Date(endTime).getTime();

  if (requestStart >= requestEnd) {
    return { success: false, error: 'Start time must be before end time.' };
  }

  // Fetch resource asset
  const asset = assets.find(a => a.id === resourceAssetId);
  if (!asset) {
    return { success: false, error: 'Shared Resource asset not found.' };
  }
  if (!asset.isBookable) {
    return { success: false, error: 'This asset is not marked as a shared, bookable resource.' };
  }

  // Strict Business Rule 3: Reject overlapping bookings
  // A booking starting exactly when another ends is valid (not an overlap)
  const activeBookings = bookings.filter(b => b.resourceAssetId === resourceAssetId && b.status !== 'Cancelled');
  const conflict = activeBookings.find(b => {
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    
    // Overlap if: requestStart < bEnd && bStart < requestEnd
    return requestStart < bEnd && bStart < requestEnd;
  });

  if (conflict) {
    const conflictEmployee = employees.find(e => e.id === conflict.bookedBy);
    const holderName = conflictEmployee ? conflictEmployee.name : 'another team';
    const startStr = new Date(conflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endStr = new Date(conflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return { 
      success: false, 
      error: `Booking Conflict: Overlaps with booking by ${holderName} from ${startStr} to ${endStr}. Adjacent slots are fine.` 
    };
  }

  // Add the booking
  const newBooking: ResourceBooking = {
    id: `book-${Date.now()}`,
    resourceAssetId,
    bookedBy,
    departmentId,
    startTime,
    endTime,
    status: 'Upcoming',
  };

  bookings = [...bookings, newBooking];
  saveState.bookings();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Booked Resource', 'Booking', newBooking.id, `Booked "${asset.name}" from ${startTime} to ${endTime}.`);
  }

  createNotification(bookedBy, 'Booking Status', `Your booking for "${asset.name}" has been confirmed!`, newBooking.id);

  return { success: true, booking: newBooking };
}

export function cancelBooking(bookingId: string) {
  bookings = bookings.map(b => {
    if (b.id === bookingId) {
      // Notify
      createNotification(b.bookedBy, 'Booking Status', `Your resource booking has been cancelled.`, b.id);
      return { ...b, status: 'Cancelled' as const };
    }
    return b;
  });
  saveState.bookings();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Cancelled Booking', 'Booking', bookingId, `Cancelled booking ID: ${bookingId}`);
  }
}

// 8. Maintenance Management (Strict Business Rule 4 status cascade)
export function raiseMaintenanceRequest(
  assetId: string, 
  issueDescription: string, 
  priority: MaintenanceRequest['priority'],
  photoUrl: string | null = null,
  id?: string
): MaintenanceRequest {
  const user = getCurrentUser()!;
  
  const newReq: MaintenanceRequest = {
    id: id || `maint-${Date.now()}`,
    assetId,
    raisedBy: user.id,
    issueDescription,
    priority,
    photoUrl,
    status: 'Pending',
  };

  maintenance = [...maintenance, newReq];
  saveState.maintenance();

  logActivity(user.id, user.name, 'Raised Maintenance', 'Maintenance', newReq.id, `Raised maintenance ticket for asset ID ${assetId} with priority: ${priority}`);

  // Notify asset managers
  const managers = employees.filter(e => e.role === 'Asset Manager' || e.role === 'Admin');
  managers.forEach(m => {
    createNotification(m.id, 'Maintenance Status', `New maintenance request raised for asset. Priority: ${priority}.`, newReq.id);
  });

  return newReq;
}

export function updateMaintenanceStatus(
  requestId: string, 
  status: MaintenanceRequest['status'], 
  technicianName?: string
) {
  const req = maintenance.find(r => r.id === requestId);
  if (!req) return;

  const asset = assets.find(a => a.id === req.assetId);
  const assetName = asset ? asset.name : 'Asset';

  maintenance = maintenance.map(r => {
    if (r.id === requestId) {
      return { 
        ...r, 
        status, 
        technicianName: technicianName || r.technicianName,
        resolvedAt: status === 'Resolved' ? new Date().toISOString() : r.resolvedAt
      };
    }
    return r;
  });
  saveState.maintenance();

  // Apply strict status cascade rules!
  if (status === 'Approved' || status === 'Technician Assigned' || status === 'In Progress') {
    // Approving a request auto-sets the asset status to Under Maintenance
    assets = assets.map(a => {
      if (a.id === req.assetId) {
        return { ...a, status: 'Under Maintenance' as const };
      }
      return a;
    });
    saveState.assets();
  } else if (status === 'Resolved') {
    // Resolving a request auto-reverts the asset status to Available
    assets = assets.map(a => {
      if (a.id === req.assetId) {
        return { ...a, status: 'Available' as const, condition: 'Good' }; // Reset condition to Good after repair
      }
      return a;
    });
    saveState.assets();
  } else if (status === 'Rejected') {
    // Revert asset status if it was locked
    assets = assets.map(a => {
      if (a.id === req.assetId && a.status === 'Under Maintenance') {
        return { ...a, status: 'Available' as const };
      }
      return a;
    });
    saveState.assets();
  }

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Updated Maintenance', 'Maintenance', requestId, `Status updated to: ${status} for asset "${assetName}"`);
    
    // Notify reporter
    createNotification(req.raisedBy, 'Maintenance Status', `Your maintenance request for "${assetName}" status updated to: ${status}.`, requestId);
  }
}

// 9. Asset Audit Cycles (Strict Business Rule 5 report-first)
export function createAuditCycle(scopeDepartmentId: string | null, scopeLocation: string | null, dateRangeStart: string, dateRangeEnd: string, auditorIds: string[]): AuditCycle {
  const newCycle: AuditCycle = {
    id: `audit-${Date.now()}`,
    scopeDepartmentId,
    scopeLocation,
    dateRangeStart,
    dateRangeEnd,
    auditorIds,
    status: 'Open',
  };

  audits = [...audits, newCycle];
  saveState.audits();

  // Seed default audit items for this cycle's assets
  const inScopeAssets = assets.filter(a => {
    if (scopeDepartmentId) {
      // Find current active allocations for department or department employees
      const activeAlloc = allocations.find(al => al.assetId === a.id && al.status === 'Active');
      if (!activeAlloc) return false;
      if (activeAlloc.departmentId === scopeDepartmentId) return true;
      if (activeAlloc.employeeId) {
        const emp = employees.find(e => e.id === activeAlloc.employeeId);
        return emp?.departmentId === scopeDepartmentId;
      }
      return false;
    }
    if (scopeLocation) {
      return a.location.toLowerCase().includes(scopeLocation.toLowerCase());
    }
    return true; // All assets if no scope specified
  });

  // Create default un-verified audit items
  const items = inScopeAssets.map(a => ({
    id: `audit-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    auditCycleId: newCycle.id,
    assetId: a.id,
    verdict: 'Verified' as const, // default to Verified so auditor can tweak
    notes: 'Awaiting inspection.',
  }));

  auditItems = [...auditItems, ...items];
  saveState.auditItems();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Created Audit Cycle', 'Audit', newCycle.id, `Created audit cycle spanning ${dateRangeStart} to ${dateRangeEnd}.`);
  }

  // Notify auditors
  auditorIds.forEach(audId => {
    createNotification(audId, 'System', 'You have been assigned as an auditor for a new Audit Cycle.', newCycle.id);
  });

  return newCycle;
}

export function saveAuditItemVerdict(id: string, verdict: AuditItem['verdict'], notes: string) {
  auditItems = auditItems.map(item => {
    if (item.id === id) {
      return { ...item, verdict, notes };
    }
    return item;
  });
  saveState.auditItems();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Recorded Audit Verdict', 'Audit', id, `Verdict set to ${verdict} for audit item.`);
  }
}

export function closeAuditCycle(cycleId: string): { success: boolean; discrepancyCount: number } {
  const cycle = audits.find(a => a.id === cycleId);
  if (!cycle || cycle.status === 'Closed') {
    return { success: false, discrepancyCount: 0 };
  }

  const items = auditItems.filter(item => item.auditCycleId === cycleId);
  const discrepancies = items.filter(i => i.verdict === 'Missing' || i.verdict === 'Damaged');

  // Cascade status updates: e.g., missing -> Lost
  items.forEach(item => {
    if (item.verdict === 'Missing') {
      assets = assets.map(a => {
        if (a.id === item.assetId) {
          return { ...a, status: 'Lost' as const };
        }
        return a;
      });
    } else if (item.verdict === 'Damaged') {
      assets = assets.map(a => {
        if (a.id === item.assetId) {
          return { ...a, condition: 'Broken' as const };
        }
        return a;
      });
    }
  });
  saveState.assets();

  // Close the cycle
  audits = audits.map(a => {
    if (a.id === cycleId) {
      return { ...a, status: 'Closed' as const };
    }
    return a;
  });
  saveState.audits();

  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.name, 'Closed Audit Cycle', 'Audit', cycleId, `Closed audit cycle ID ${cycleId}. Discrepancies processed: ${discrepancies.length}.`);
    
    // Notify managers of discrepancy report
    if (discrepancies.length > 0) {
      const managers = employees.filter(e => e.role === 'Asset Manager' || e.role === 'Admin');
      managers.forEach(m => {
        createNotification(
          m.id, 
          'Audit Discrepancy', 
          `Audit cycle closed with ${discrepancies.length} discrepancy reports generated. Inspect discrepancy logs.`, 
          cycleId
        );
      });
    }
  }

  return { success: true, discrepancyCount: discrepancies.length };
}

// Helper to check read state on notifications
export function markNotificationAsRead(id: string) {
  notifications = notifications.map(n => {
    if (n.id === id) {
      return { ...n, read: true };
    }
    return n;
  });
  saveState.notifications();
}

export function markAllNotificationsAsRead(recipientId: string) {
  notifications = notifications.map(n => {
    if (n.recipientEmployeeId === recipientId) {
      return { ...n, read: true };
    }
    return n;
  });
  saveState.notifications();
}

let isInitialized = false;
export async function initFirebaseSync() {
  if (isInitialized) return;
  isInitialized = true;

  let snapshot;
  try {
    const employeesRef = collection(db, 'employees');
    snapshot = await getDocs(employeesRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'employees');
    return;
  }
  
  try {
    if (snapshot.empty) {
      console.log("Firestore is empty, seeding organization database...");
      
      for (const item of SEED_DEPARTMENTS) {
        await setDoc(doc(db, 'departments', item.id), item);
      }
      for (const item of SEED_CATEGORIES) {
        await setDoc(doc(db, 'categories', item.id), item);
      }
      for (const item of SEED_EMPLOYEES) {
        await setDoc(doc(db, 'employees', item.id), item);
      }
      for (const item of SEED_ASSETS) {
        await setDoc(doc(db, 'assets', item.id), item);
      }
      for (const item of SEED_ALLOCATIONS) {
        await setDoc(doc(db, 'allocations', item.id), item);
      }
      for (const item of SEED_BOOKINGS) {
        await setDoc(doc(db, 'bookings', item.id), item);
      }
      for (const item of SEED_MAINTENANCE) {
        await setDoc(doc(db, 'maintenance', item.id), item);
      }
      for (const item of SEED_AUDITS) {
        await setDoc(doc(db, 'audits', item.id), item);
      }
      for (const item of SEED_AUDIT_ITEMS) {
        await setDoc(doc(db, 'auditItems', item.id), item);
      }
      
      const initialNotifs: Notification[] = [
        {
          id: 'notif-1',
          recipientEmployeeId: 'emp-jane',
          type: 'Asset Assigned',
          message: 'MacBook Pro 16" M3 Max has been allocated to you. Expected return date: 2026-08-05.',
          relatedEntityId: 'asset-1',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          recipientEmployeeId: 'emp-marcus',
          type: 'Overdue Alert',
          message: 'The Herman Miller Aeron Chair allocated to you is OVERDUE for return.',
          relatedEntityId: 'asset-7',
          read: false,
          createdAt: new Date().toISOString(),
        }
      ];
      for (const item of initialNotifs) {
        await setDoc(doc(db, 'notifications', item.id), item);
      }

      const initialLogs: ActivityLog[] = [
        {
          id: 'log-1',
          actorId: 'emp-sarah',
          actorName: 'Kshitij Patil',
          action: 'System Seeded',
          entityType: 'Asset',
          entityId: 'asset-1',
          timestamp: new Date().toISOString(),
          details: 'Initial system seed data loaded successfully.'
        }
      ];
      for (const item of initialLogs) {
        await setDoc(doc(db, 'logs', item.id), item);
      }
      console.log("Firestore seeding done!");
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seeding');
  }

  // Set up real-time listener for all collections to keep in-memory sync'ed
  onSnapshot(collection(db, 'departments'), (snap) => {
    departments = snap.docs.map(d => d.data() as Department);
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(departments));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'departments');
  });
  
  onSnapshot(collection(db, 'categories'), (snap) => {
    categories = snap.docs.map(d => d.data() as AssetCategory);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'categories');
  });

  onSnapshot(collection(db, 'employees'), (snap) => {
    employees = snap.docs.map(d => d.data() as Employee);
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'employees');
  });

  onSnapshot(collection(db, 'assets'), (snap) => {
    assets = snap.docs.map(d => d.data() as Asset);
    localStorage.setItem(KEYS.ASSETS, JSON.stringify(assets));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'assets');
  });

  onSnapshot(collection(db, 'allocations'), (snap) => {
    allocations = snap.docs.map(d => d.data() as Allocation);
    localStorage.setItem(KEYS.ALLOCATIONS, JSON.stringify(allocations));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'allocations');
  });

  onSnapshot(collection(db, 'transfers'), (snap) => {
    transfers = snap.docs.map(d => d.data() as TransferRequest);
    localStorage.setItem(KEYS.TRANSFERS, JSON.stringify(transfers));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'transfers');
  });

  onSnapshot(collection(db, 'bookings'), (snap) => {
    bookings = snap.docs.map(d => d.data() as ResourceBooking);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'bookings');
  });

  onSnapshot(collection(db, 'maintenance'), (snap) => {
    maintenance = snap.docs.map(d => d.data() as MaintenanceRequest);
    localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(maintenance));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'maintenance');
  });

  onSnapshot(collection(db, 'audits'), (snap) => {
    audits = snap.docs.map(d => d.data() as AuditCycle);
    localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'audits');
  });

  onSnapshot(collection(db, 'auditItems'), (snap) => {
    auditItems = snap.docs.map(d => d.data() as AuditItem);
    localStorage.setItem(KEYS.AUDIT_ITEMS, JSON.stringify(auditItems));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'auditItems');
  });

  onSnapshot(collection(db, 'notifications'), (snap) => {
    notifications = snap.docs.map(d => d.data() as Notification);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'notifications');
  });

  onSnapshot(collection(db, 'logs'), (snap) => {
    logs = snap.docs.map(d => d.data() as ActivityLog);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    notifySubscribers();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'logs');
  });
}

// Call immediately
initFirebaseSync().catch(err => console.error("Firebase sync initialization failed:", err));
