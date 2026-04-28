import type {
  User,
  Project,
  Milestone,
  TimesheetWeek,
  TimesheetRow,
  Notification,
  TeamMember,
  ApprovalItem,
  ActivityItem,
} from '@/types';

// ========================================
// USERS
// ========================================
export const USERS: User[] = [
  {
    id: 'u1',
    email: 'employee@crystalts.com',
    name: 'Alex Johnson',
    role: 'employee',
    phone: '+1 (555) 123-4567',
    designation: 'Software Engineer',
    department: 'Engineering',
    avatar: '',
    joinDate: '2024-03-15',
  },
  {
    id: 'u2',
    email: 'manager@crystalts.com',
    name: 'Sarah Williams',
    role: 'manager',
    phone: '+1 (555) 234-5678',
    designation: 'Engineering Manager',
    department: 'Engineering',
    avatar: '',
    joinDate: '2023-01-10',
  },
  {
    id: 'u3',
    email: 'admin@crystalts.com',
    name: 'Michael Chen',
    role: 'admin',
    phone: '+1 (555) 345-6789',
    designation: 'System Administrator',
    department: 'IT Operations',
    avatar: '',
    joinDate: '2022-06-01',
  },
];

// ========================================
// PROJECTS
// ========================================
export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Phoenix Platform',
    code: 'PHX',
    color: '#6366f1',
    status: 'active',
    assignedEmployees: ['u1', 'u2', 'u4', 'u11', 'u14'],
    milestones: [
      { id: 'm1', name: 'UI Redesign', projectId: 'p1', status: 'in-progress' },
      { id: 'm2', name: 'API Integration', projectId: 'p1', status: 'pending' },
      { id: 'm3', name: 'Testing & QA', projectId: 'p1', status: 'pending' },
    ],
  },
  {
    id: 'p2',
    name: 'Horizon Analytics',
    code: 'HRZ',
    color: '#10b981',
    status: 'active',
    assignedEmployees: ['u1', 'u5', 'u12', 'u13'],
    milestones: [
      { id: 'm4', name: 'Data Pipeline', projectId: 'p2', status: 'completed' },
      { id: 'm5', name: 'Dashboard Build', projectId: 'p2', status: 'in-progress' },
      { id: 'm6', name: 'Reporting Module', projectId: 'p2', status: 'pending' },
    ],
  },
  {
    id: 'p3',
    name: 'Aurora Mobile',
    code: 'AUR',
    color: '#f59e0b',
    status: 'active',
    assignedEmployees: ['u1', 'u2', 'u8', 'u15', 'u16'],
    milestones: [
      { id: 'm7', name: 'MVP Development', projectId: 'p3', status: 'in-progress' },
      { id: 'm8', name: 'Beta Release', projectId: 'p3', status: 'pending' },
    ],
  },
  {
    id: 'p4',
    name: 'Nebula Cloud',
    code: 'NBL',
    color: '#8b5cf6',
    status: 'on-hold',
    assignedEmployees: ['u2', 'u7', 'u11', 'u12'],
    milestones: [
      { id: 'm9', name: 'Infrastructure Setup', projectId: 'p4', status: 'completed' },
      { id: 'm10', name: 'Migration Plan', projectId: 'p4', status: 'pending' },
    ],
  },
  {
    id: 'p5',
    name: 'Titan ERP',
    code: 'TTN',
    color: '#ef4444',
    status: 'active',
    assignedEmployees: ['u1', 'u2', 'u3', 'u6', 'u10', 'u13'],
    milestones: [
      { id: 'm11', name: 'Module Development', projectId: 'p5', status: 'in-progress' },
      { id: 'm12', name: 'Integration Testing', projectId: 'p5', status: 'pending' },
    ],
  },
];

// ========================================
// CURRENT WEEK TIMESHEET
// ========================================
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const CURRENT_TIMESHEET: TimesheetWeek = {
  id: 'tw1',
  userId: 'u1',
  weekStartDate: '2026-04-20',
  weekEndDate: '2026-04-26',
  status: 'draft',
  totalHours: 36,
  rows: [
    {
      id: 'tr1',
      projectId: 'p1',
      milestoneId: 'm1',
      taskDescription: 'Component library development',
      billable: true,
      hours: { mon: 8, tue: 7, wed: 8, thu: 0, fri: 0, sat: 0, sun: 0 },
    },
    {
      id: 'tr2',
      projectId: 'p2',
      milestoneId: 'm5',
      taskDescription: 'Dashboard charts implementation',
      billable: false,
      hours: { mon: 0, tue: 1, wed: 0, thu: 8, fri: 4, sat: 0, sun: 0 },
    },
  ],
};

// ========================================
// PAST TIMESHEETS
// ========================================
export const PAST_TIMESHEETS: TimesheetWeek[] = [
  {
    id: 'tw2',
    userId: 'u1',
    weekStartDate: '2026-04-13',
    weekEndDate: '2026-04-19',
    status: 'approved',
    totalHours: 40,
    submittedAt: '2026-04-19T17:00:00Z',
    reviewedAt: '2026-04-20T09:00:00Z',
    reviewedBy: 'u2',
    rows: [
      {
        id: 'tr3',
        projectId: 'p1',
        milestoneId: 'm1',
        taskDescription: 'Design system setup',
        billable: true,
        hours: { mon: 8, tue: 8, wed: 4, thu: 0, fri: 0, sat: 0, sun: 0 },
      },
      {
        id: 'tr4',
        projectId: 'p3',
        milestoneId: 'm7',
        taskDescription: 'Mobile app prototype',
        billable: true,
        hours: { mon: 0, tue: 0, wed: 4, thu: 8, fri: 8, sat: 0, sun: 0 },
      },
    ],
  },
  {
    id: 'tw3',
    userId: 'u1',
    weekStartDate: '2026-04-06',
    weekEndDate: '2026-04-12',
    status: 'approved',
    totalHours: 38,
    submittedAt: '2026-04-12T16:30:00Z',
    reviewedAt: '2026-04-13T10:00:00Z',
    reviewedBy: 'u2',
    rows: [
      {
        id: 'tr5',
        projectId: 'p2',
        milestoneId: 'm4',
        taskDescription: 'Data pipeline optimization',
        billable: true,
        hours: { mon: 6, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
      },
    ],
  },
  {
    id: 'tw4',
    userId: 'u1',
    weekStartDate: '2026-03-30',
    weekEndDate: '2026-04-05',
    status: 'rejected',
    totalHours: 32,
    submittedAt: '2026-04-05T17:00:00Z',
    reviewedAt: '2026-04-06T11:00:00Z',
    reviewedBy: 'u2',
    comments: 'Hours seem incomplete for Thursday. Please review and resubmit.',
    rows: [
      {
        id: 'tr6',
        projectId: 'p1',
        milestoneId: 'm2',
        taskDescription: 'API endpoint development',
        billable: false,
        hours: { mon: 8, tue: 8, wed: 8, thu: 0, fri: 8, sat: 0, sun: 0 },
      },
    ],
  },
  {
    id: 'tw5',
    userId: 'u1',
    weekStartDate: '2026-03-23',
    weekEndDate: '2026-03-29',
    status: 'approved',
    totalHours: 40,
    submittedAt: '2026-03-29T17:00:00Z',
    reviewedAt: '2026-03-30T09:00:00Z',
    reviewedBy: 'u2',
    rows: [
      {
        id: 'tr7',
        projectId: 'p5',
        milestoneId: 'm11',
        taskDescription: 'ERP module scaffolding',
        billable: true,
        hours: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
      },
    ],
  },
];

// ========================================
// TEAM MEMBERS
// ========================================
export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'employee@crystalts.com',
    phone: '+1 (555) 101-2001',
    role: 'employee',
    designation: 'Software Engineer',
    department: 'Engineering',
    status: 'active',
    hoursThisWeek: 36,
    submissionStatus: 'pending',
  },
  {
    id: 'u4',
    name: 'Emily Davis',
    email: 'emily.davis@crystalts.com',
    phone: '+1 (555) 104-2004',
    role: 'employee',
    designation: 'Frontend Developer',
    department: 'Engineering',
    status: 'active',
    hoursThisWeek: 40,
    submissionStatus: 'submitted',
  },
  {
    id: 'u5',
    name: 'James Wilson',
    email: 'james.wilson@crystalts.com',
    phone: '+1 (555) 105-2005',
    role: 'employee',
    designation: 'Backend Developer',
    department: 'Engineering',
    status: 'active',
    hoursThisWeek: 38,
    submissionStatus: 'submitted',
  },
  {
    id: 'u6',
    name: 'Priya Sharma',
    email: 'priya.sharma@crystalts.com',
    phone: '+91 98765 43210',
    role: 'employee',
    designation: 'QA Engineer',
    department: 'Quality Assurance',
    status: 'active',
    hoursThisWeek: 35,
    submissionStatus: 'overdue',
  },
  {
    id: 'u7',
    name: 'David Kim',
    email: 'david.kim@crystalts.com',
    phone: '+1 (555) 107-2007',
    role: 'employee',
    designation: 'DevOps Engineer',
    department: 'IT Operations',
    status: 'active',
    hoursThisWeek: 42,
    submissionStatus: 'submitted',
  },
  {
    id: 'u8',
    name: 'Lisa Chen',
    email: 'lisa.chen@crystalts.com',
    phone: '+1 (555) 108-2008',
    role: 'employee',
    designation: 'UI/UX Designer',
    department: 'Design',
    status: 'active',
    hoursThisWeek: 37,
    submissionStatus: 'submitted',
  },
  {
    id: 'u9',
    name: 'Robert Taylor',
    email: 'robert.taylor@crystalts.com',
    phone: '+1 (555) 109-2009',
    role: 'employee',
    designation: 'Data Analyst',
    department: 'Analytics',
    status: 'inactive',
    hoursThisWeek: 0,
    submissionStatus: 'overdue',
  },
  {
    id: 'u10',
    name: 'Anika Patel',
    email: 'anika.patel@crystalts.com',
    phone: '+91 99887 76655',
    role: 'employee',
    designation: 'Product Manager',
    department: 'Product',
    status: 'active',
    hoursThisWeek: 40,
    submissionStatus: 'submitted',
  },
  {
    id: 'u11',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@crystalts.com',
    phone: '+1 (555) 111-3011',
    role: 'employee',
    designation: 'Full Stack Developer',
    department: 'Engineering',
    status: 'active',
    hoursThisWeek: 39,
    submissionStatus: 'submitted',
  },
  {
    id: 'u12',
    name: 'Marcus Rivera',
    email: 'marcus.rivera@crystalts.com',
    phone: '+1 (555) 112-3012',
    role: 'employee',
    designation: 'Cloud Architect',
    department: 'IT Operations',
    status: 'active',
    hoursThisWeek: 41,
    submissionStatus: 'submitted',
  },
  {
    id: 'u13',
    name: 'Fatima Al-Rashid',
    email: 'fatima.rashid@crystalts.com',
    phone: '+971 50 234 5678',
    role: 'employee',
    designation: 'Business Analyst',
    department: 'Analytics',
    status: 'active',
    hoursThisWeek: 38,
    submissionStatus: 'submitted',
  },
  {
    id: 'u14',
    name: 'Kenji Tanaka',
    email: 'kenji.tanaka@crystalts.com',
    phone: '+81 90 1234 5678',
    role: 'employee',
    designation: 'Security Engineer',
    department: 'Engineering',
    status: 'active',
    hoursThisWeek: 36,
    submissionStatus: 'pending',
  },
  {
    id: 'u15',
    name: 'Olivia Nguyen',
    email: 'olivia.nguyen@crystalts.com',
    phone: '+61 4 1234 5678',
    role: 'employee',
    designation: 'UX Researcher',
    department: 'Design',
    status: 'active',
    hoursThisWeek: 34,
    submissionStatus: 'pending',
  },
  {
    id: 'u16',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@crystalts.com',
    phone: '+52 55 1234 5678',
    role: 'employee',
    designation: 'Mobile Developer',
    department: 'Engineering',
    status: 'active',
    hoursThisWeek: 40,
    submissionStatus: 'submitted',
  },
];

// ========================================
// APPROVAL ITEMS
// ========================================
export const APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: 'a1',
    userId: 'u1',
    userName: 'Alex Johnson',
    weekStartDate: '2026-04-20',
    weekEndDate: '2026-04-26',
    totalHours: 40,
    status: 'pending',
    submittedAt: '2026-04-26T17:00:00Z',
    projects: ['Phoenix Platform', 'Horizon Analytics'],
  },
  {
    id: 'a2',
    userId: 'u4',
    userName: 'Emily Davis',
    weekStartDate: '2026-04-20',
    weekEndDate: '2026-04-26',
    totalHours: 40,
    status: 'pending',
    submittedAt: '2026-04-26T16:30:00Z',
    projects: ['Aurora Mobile'],
  },
  {
    id: 'a3',
    userId: 'u5',
    userName: 'James Wilson',
    weekStartDate: '2026-04-20',
    weekEndDate: '2026-04-26',
    totalHours: 38,
    status: 'pending',
    submittedAt: '2026-04-26T17:15:00Z',
    projects: ['Titan ERP', 'Phoenix Platform'],
  },
  {
    id: 'a4',
    userId: 'u7',
    userName: 'David Kim',
    weekStartDate: '2026-04-13',
    weekEndDate: '2026-04-19',
    totalHours: 42,
    status: 'approved',
    submittedAt: '2026-04-19T17:00:00Z',
    projects: ['Nebula Cloud'],
  },
  {
    id: 'a5',
    userId: 'u8',
    userName: 'Lisa Chen',
    weekStartDate: '2026-04-13',
    weekEndDate: '2026-04-19',
    totalHours: 37,
    status: 'rejected',
    submittedAt: '2026-04-19T16:45:00Z',
    projects: ['Phoenix Platform'],
  },
];

// ========================================
// NOTIFICATIONS
// ========================================
export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Timesheet Approved',
    message: 'Your timesheet for Apr 13-19 has been approved by Sarah Williams.',
    type: 'success',
    read: false,
    createdAt: '2026-04-20T09:00:00Z',
  },
  {
    id: 'n2',
    title: 'Submission Reminder',
    message: 'Don\'t forget to submit your timesheet for this week by Friday 5:00 PM.',
    type: 'warning',
    read: false,
    createdAt: '2026-04-24T08:00:00Z',
  },
  {
    id: 'n3',
    title: 'New Project Assignment',
    message: 'You have been assigned to Titan ERP project.',
    type: 'info',
    read: true,
    createdAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 'n4',
    title: 'Timesheet Rejected',
    message: 'Your timesheet for Mar 30 - Apr 5 was rejected. Please review comments.',
    type: 'error',
    read: true,
    createdAt: '2026-04-06T11:00:00Z',
  },
];

// ========================================
// RECENT ACTIVITY
// ========================================
export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: 'act1',
    action: 'Timesheet Submitted',
    description: 'Weekly timesheet for Apr 13-19 submitted',
    timestamp: '2026-04-19T17:00:00Z',
    icon: 'send',
  },
  {
    id: 'act2',
    action: 'Hours Logged',
    description: '8 hours logged on Phoenix Platform',
    timestamp: '2026-04-25T16:00:00Z',
    icon: 'clock',
  },
  {
    id: 'act3',
    action: 'Approval Received',
    description: 'Timesheet for Apr 13-19 approved',
    timestamp: '2026-04-20T09:00:00Z',
    icon: 'check-circle',
  },
  {
    id: 'act4',
    action: 'Project Assigned',
    description: 'Added to Titan ERP project',
    timestamp: '2026-04-15T10:00:00Z',
    icon: 'folder-plus',
  },
  {
    id: 'act5',
    action: 'Profile Updated',
    description: 'Profile information updated',
    timestamp: '2026-04-10T14:00:00Z',
    icon: 'user',
  },
];

// ========================================
// CHART DATA
// ========================================
export const HOURS_PER_PROJECT = [
  { name: 'Phoenix Platform', value: 45, color: '#6366f1' },
  { name: 'Horizon Analytics', value: 30, color: '#10b981' },
  { name: 'Aurora Mobile', value: 20, color: '#f59e0b' },
  { name: 'Titan ERP', value: 15, color: '#ef4444' },
];

export const WEEKLY_TREND = [
  { name: 'Week 1', hours: 40, expected: 40 },
  { name: 'Week 2', hours: 38, expected: 40 },
  { name: 'Week 3', hours: 32, expected: 40 },
  { name: 'Week 4', hours: 40, expected: 40 },
  { name: 'Week 5', hours: 36, expected: 40 },
];

export const WEEKLY_BILLABLE_TREND = [
  { name: 'Week 1', billable: 32, nonBillable: 8 },
  { name: 'Week 2', billable: 30, nonBillable: 8 },
  { name: 'Week 3', billable: 24, nonBillable: 8 },
  { name: 'Week 4', billable: 33, nonBillable: 7 },
  { name: 'Week 5', billable: 23, nonBillable: 13 },
];

export const BILLABLE_SUMMARY = {
  totalBillable: 142,
  totalNonBillable: 44,
  billablePercentage: 76,
};

export const MONTHLY_BILLABLE = [
  { name: 'Jan', billable: 136, nonBillable: 32 },
  { name: 'Feb', billable: 128, nonBillable: 32 },
  { name: 'Mar', billable: 140, nonBillable: 32 },
  { name: 'Apr', billable: 110, nonBillable: 36 },
];

export const TEAM_HOURS_DATA = [
  { name: 'Alex J.', hours: 36, status: 'pending' },
  { name: 'Emily D.', hours: 40, status: 'submitted' },
  { name: 'James W.', hours: 38, status: 'submitted' },
  { name: 'Priya S.', hours: 35, status: 'overdue' },
  { name: 'David K.', hours: 42, status: 'submitted' },
  { name: 'Lisa C.', hours: 37, status: 'submitted' },
  { name: 'Anika P.', hours: 40, status: 'submitted' },
];

export const MONTHLY_OVERVIEW = [
  { name: 'Jan', hours: 168, expected: 176, billable: 136, nonBillable: 32 },
  { name: 'Feb', hours: 160, expected: 160, billable: 128, nonBillable: 32 },
  { name: 'Mar', hours: 172, expected: 176, billable: 140, nonBillable: 32 },
  { name: 'Apr', hours: 146, expected: 176, billable: 110, nonBillable: 36 },
];
