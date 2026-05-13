// ========================================
// CRYSTAL TS — MY TIME TYPE DEFINITIONS
// ========================================

export type UserRole = 'employee' | 'manager' | 'admin';

export type ProjectRole = 'IC' | 'MS' | 'TPM' | 'PM' | 'QA' | 'BA';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  designation: string;
  department: string;
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
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dob: string;
  designationId: string;
  joiningDate: string;
  generatedPassword: string;
  reportingManagerId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on-hold';
  assignedEmployees: string[];
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

export interface TimesheetRow {
  id: string;
  projectId: string;
  milestoneId: string;
  taskDescription: string;
  billable: boolean;
  hours: Record<string, number>; // { 'mon': 8, 'tue': 7, ... }
}

export interface TimesheetWeek {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  rows: TimesheetRow[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
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
}
