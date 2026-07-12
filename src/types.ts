export interface Department {
  id: string;
  name: string;
  code: string;
  headEmployeeId: string | null;
  parentDepartmentId: string | null;
  status: 'Active' | 'Inactive';
}

export interface CustomFieldConfig {
  name: string;
  type: 'text' | 'number' | 'date';
  required: boolean;
}

export interface AssetCategory {
  id: string;
  name: string;
  customFields: CustomFieldConfig[];
  status: 'Active' | 'Inactive';
}

export type EmployeeRole = 'Employee' | 'Department Head' | 'Asset Manager' | 'Admin';

export interface Employee {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role: EmployeeRole;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';
export type AssetStatus = 'Available' | 'Allocated' | 'Reserved' | 'Under Maintenance' | 'Lost' | 'Retired' | 'Disposed';

export interface Asset {
  id: string;
  name: string;
  categoryId: string;
  assetTag: string; // AF-XXXX
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: AssetCondition;
  location: string;
  photoUrls: string[];
  documentUrls: string[];
  isBookable: boolean;
  status: AssetStatus;
  customFieldValues?: Record<string, string | number>; // For custom fields like warrantyPeriod
}

export interface PastAllocationRecord {
  holderId: string; // Employee ID or Department ID
  holderType: 'Employee' | 'Department';
  allocatedDate: string;
  returnDate: string;
  conditionCheckInNotes?: string;
}

export interface Allocation {
  id: string;
  assetId: string;
  employeeId: string | null;
  departmentId: string | null;
  allocatedDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: 'Active' | 'Returned' | 'Overdue';
  conditionCheckInNotes: string | null;
  history: PastAllocationRecord[];
}

export interface TransferRequest {
  id: string;
  assetId: string;
  fromHolderId: string; // Employee or Department ID
  toHolderId: string;   // Employee or Department ID
  requestedBy: string;  // Employee ID
  status: 'Requested' | 'Approved' | 'Rejected' | 'Re-allocated';
  approvedBy: string | null;
  timestamp: string;
}

export interface ResourceBooking {
  id: string;
  resourceAssetId: string;
  bookedBy: string; // Employee ID
  departmentId: string | null;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  raisedBy: string; // Employee ID
  issueDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  photoUrl: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Technician Assigned' | 'In Progress' | 'Resolved';
  technicianName?: string;
  resolvedAt?: string;
}

export interface AuditCycle {
  id: string;
  scopeDepartmentId: string | null;
  scopeLocation: string | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  auditorIds: string[];
  status: 'Open' | 'Closed';
}

export interface AuditItem {
  id: string;
  auditCycleId: string;
  assetId: string;
  verdict: 'Verified' | 'Missing' | 'Damaged';
  notes: string;
}

export interface Notification {
  id: string;
  recipientEmployeeId: string;
  type: 'Asset Assigned' | 'Maintenance Status' | 'Booking Status' | 'Transfer Status' | 'Overdue Alert' | 'Audit Discrepancy' | 'System';
  message: string;
  relatedEntityId: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: 'Asset' | 'Allocation' | 'Transfer' | 'Booking' | 'Maintenance' | 'Audit' | 'Department' | 'Category' | 'Employee';
  entityId: string;
  timestamp: string;
  details: string;
}
