import { Badge } from '@/components/ui/badge';

type StatusType = 'draft' | 'submitted' | 'resubmitted' | 'recalled' | 'approved' | 'rejected' | 'pending' | 'overdue' | 'active' | 'inactive' | 'completed' | 'on-hold' | 'in-progress';

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'secondary' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  resubmitted: { label: 'Re-Submitted', variant: 'warning' },
  recalled: { label: 'Recalled', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  pending: { label: 'Pending', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'danger' },
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'success' },
  'on-hold': { label: 'On Hold', variant: 'warning' },
  'in-progress': { label: 'In Progress', variant: 'default' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return (
    <Badge variant={config.variant} className={className}>
      <span className="relative flex h-1.5 w-1.5 mr-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
          config.variant === 'success' ? 'bg-accent-500 animate-ping' :
          config.variant === 'danger' ? 'bg-danger-500' :
          config.variant === 'warning' ? 'bg-warning-500' :
          config.variant === 'default' ? 'bg-brand-500' :
          'bg-surface-400'
        }`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
          config.variant === 'success' ? 'bg-accent-500' :
          config.variant === 'danger' ? 'bg-danger-500' :
          config.variant === 'warning' ? 'bg-warning-500' :
          config.variant === 'default' ? 'bg-brand-500' :
          'bg-surface-400'
        }`} />
      </span>
      {config.label}
    </Badge>
  );
}
