// ========================================
// CENTRALIZED PROJECT ROLE CONSTANTS
// Single source of truth — used everywhere
// ========================================

export type ProjectRoleKey = 'IC' | 'TC' | 'TPM' | 'MS' | 'QA' | 'BA' | 'PM';

export const PROJECT_ROLES: Record<ProjectRoleKey, string> = {
  IC:  'Implementation Consultant',
  TC:  'Technical Consultant',
  TPM: 'Technical Project Manager',
  MS:  'Managed Services',
  QA:  'Quality Analyst',
  BA:  'Business Analyst',
  PM:  'Project Manager',
};

export const PROJECT_ROLE_KEYS: ProjectRoleKey[] = (Object.keys(PROJECT_ROLES) as ProjectRoleKey[]).sort(
  (a, b) => PROJECT_ROLES[a].localeCompare(PROJECT_ROLES[b])
);

export function getRoleLabel(key: string): string {
  return PROJECT_ROLES[key as ProjectRoleKey] || key;
}
