// ========================================
// CRYSTAL TS — MY TIME TYPE DEFINITIONS
// ========================================

export type UserRole = 'employee' | 'admin';

export type ProjectRole = 'IC' | 'TC' | 'MS' | 'TPM' | 'PM' | 'QA' | 'BA';

export type EntryStatus = 'draft' | 'submitted' | 'resubmitted' | 'recalled' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isManager: boolean; // dynamic — true if has direct reports
  phone: string;
  designation: string;
  dob: string;
  avatar?: string;
  joinDate: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
}

export interface Designation {
  id: string;
  name: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dob: string;
  designationId: string;
  joiningDate: string;
  generatedPassword: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Project {
  id: string;
  projectId?: string;
  name: string;
  code: string;
  color: string;
  description?: string;
  partnerProjectId?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on-hold';
  assignedEmployees: string[];
  teamCount?: number;
  milestones?: any[];
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  role: ProjectRole;
}

export interface ProjectAssignment {
  id: string;
  employeeId: string;
  projectId: string;
  role: ProjectRole;
  assignedAt: string;
}

/**
 * TimesheetRow now has its own status lifecycle.
 * Each row can be independently submitted, recalled, approved, rejected.
 */
export interface TimesheetRow {
  id: string;
  projectId: string;
  milestoneId: string;
  taskDescription: string;
  billable: boolean;
  hours: Record<string, number>;
  status: EntryStatus;
  submittedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewComments?: string;
  resubmissionCount?: number;
  rejectionHistory?: Array<{ rejectedAt: string; reviewerName: string; comments: string }>;
  // Populated from includes
  projectName?: string;
  projectCode?: string;
  projectColor?: string;
  milestoneName?: string;
}

/**
 * TimesheetWeek is now just a container/envelope.
 * Status lives at entry level, not here.
 */
export interface TimesheetWeek {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  rows: TimesheetRow[];
  totalHours: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  read: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
  department: string;
  avatar?: string;
  status: 'active' | 'inactive';
  hoursThisWeek: number;
  submissionStatus: 'submitted' | 'pending' | 'overdue';
}

/**
 * ApprovalEntry is per-entry, not per-timesheet.
 */
export interface ApprovalEntry {
  id: string;
  timesheetId: string;
  userId: string;
  userName: string;
  weekStartDate: string;
  weekEndDate: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  projectColor: string;
  milestoneName: string;
  taskDescription: string;
  billable: boolean;
  hours: Record<string, number>;
  totalHours: number;
  status: EntryStatus;
  submittedAt: string;
  resubmissionCount?: number;
  rejectionHistory?: Array<{ rejectedAt: string; reviewerName: string; comments: string }>;
}

// Legacy compatibility
export interface ApprovalItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  weekStartDate: string;
  weekEndDate: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  projects: string[];
  rows?: TimesheetRow[];
}

export interface WeeklySummary {
  hoursLogged: number;
  hoursExpected: number;
  submissionStatus: 'submitted' | 'pending' | 'overdue';
  projectsWorked: number;
  daysLogged: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  totalHoursLogged: number;
  billableHours: number;
  nonBillableHours: number;
  approvalRate: number;
  pendingApprovals: number;
  isPersonal?: boolean;
}

export interface ManagerApprovalSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  pendingCount: number;
  totalDirectReports: number;
}
