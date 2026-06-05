import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, XCircle, Clock, Briefcase, Tag, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { timesheetAPI } from '@/services/api';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface RejectionRecord {
  id: string;
  entry_id: string;
  project_id: string;
  milestone_id: string | null;
  task_description: string | null;
  billable: boolean;
  hours_mon: number;
  hours_tue: number;
  hours_wed: number;
  hours_thu: number;
  hours_fri: number;
  hours_sat: number;
  hours_sun: number;
  total_hours: number;
  rejected_by: string;
  rejected_at: string;
  rejection_reason: string;
  week_start_date: string;
  week_end_date: string;
  rejectedByUser?: { id: string; first_name: string; last_name: string };
  project?: { id: string; name: string };
  milestone?: { id: string; name: string };
}

interface RejectionHistoryModalProps {
  entryId: string | null;
  onClose: () => void;
  entryLabel?: string;
}

export function RejectionHistoryModal({ entryId, onClose, entryLabel }: RejectionHistoryModalProps) {
  const [records, setRecords] = useState<RejectionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entryId) { setRecords([]); return; }
    setLoading(true);
    timesheetAPI.getRejectionHistory(entryId)
      .then((res) => setRecords(res.data.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [entryId]);

  const getHourValue = (rec: RejectionRecord, day: string) => {
    const val = parseFloat(String((rec as any)[`hours_${day}`] || 0));
    return isNaN(val) ? 0 : val;
  };

  return (
    <Dialog open={!!entryId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-200/50 dark:border-red-800/30">
              <History className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-lg">Rejection History</span>
              {entryLabel && (
                <p className="text-xs font-normal text-[var(--text-tertiary)] mt-0.5">{entryLabel}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-sm text-[var(--text-tertiary)]">Loading history…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && records.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)]">
                <History className="w-10 h-10 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">No rejection history</p>
              <p className="text-xs text-[var(--text-tertiary)]">This entry has not been rejected before.</p>
            </div>
          )}

          {/* Timeline */}
          {!loading && records.length > 0 && (
            <div className="relative pb-4">
              {/* Timeline line */}
              <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-red-400 via-red-300 to-red-200 dark:from-red-600 dark:via-red-700 dark:to-red-800 rounded-full" />

              <AnimatePresence>
                {records.map((rec, idx) => {
                  const total = parseFloat(String(rec.total_hours || 0));
                  const reviewerName = rec.rejectedByUser
                    ? `${rec.rejectedByUser.first_name} ${rec.rejectedByUser.last_name}`
                    : 'Manager';
                  const rejectedDate = rec.rejected_at
                    ? new Date(rec.rejected_at)
                    : null;

                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.3 }}
                      className="relative pl-10 mb-5 last:mb-0"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-2.5 top-3 w-3.5 h-3.5 rounded-full border-[2.5px] border-red-400 dark:border-red-500 bg-[var(--card-bg)] z-10 shadow-sm" />

                      {/* Card */}
                      <div className="rounded-xl border border-[var(--border-secondary)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
                        {/* Header bar */}
                        <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50/50 dark:from-red-900/15 dark:to-orange-900/10 border-b border-red-100 dark:border-red-800/20">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                              <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                                Rejected by {reviewerName}
                              </span>
                            </div>
                            {rejectedDate && (
                              <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
                                <Clock className="w-3.5 h-3.5" />
                                {rejectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' · '}
                                {rejectedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-3.5">
                          {/* Rejection reason */}
                          <div className="flex gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-red-500 dark:text-red-400 mb-1">Reason</p>
                              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                                {rec.rejection_reason || 'No reason provided'}
                              </p>
                            </div>
                          </div>

                          {/* Project & Milestone */}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                              <span className="text-[var(--text-secondary)] font-medium">{rec.project?.name || '—'}</span>
                            </div>
                            {rec.milestone && (
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                                <span className="text-[var(--text-secondary)]">{rec.milestone.name}</span>
                              </div>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              rec.billable
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {rec.billable ? 'Billable' : 'Non-Billable'}
                            </span>
                          </div>

                          {/* Hours grid */}
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-2">Hours at time of rejection</p>
                            <div className="grid grid-cols-8 gap-1.5">
                              {DAY_KEYS.map((day, i) => {
                                const val = getHourValue(rec, day);
                                const isWeekend = day === 'sat' || day === 'sun';
                                return (
                                  <div
                                    key={day}
                                    className={`text-center py-2 px-1 rounded-lg border transition-all ${
                                      val > 0
                                        ? 'bg-brand-50 dark:bg-brand-900/15 border-brand-200 dark:border-brand-700/30'
                                        : isWeekend
                                          ? 'bg-[var(--bg-tertiary)] border-transparent opacity-50'
                                          : 'bg-[var(--bg-tertiary)] border-transparent'
                                    }`}
                                  >
                                    <p className="text-[9px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">{DAY_LABELS[i]}</p>
                                    <p className={`text-sm font-bold mt-0.5 ${
                                      val > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-tertiary)]'
                                    }`}>
                                      {val || '—'}
                                    </p>
                                  </div>
                                );
                              })}
                              {/* Total */}
                              <div className="text-center py-2 px-1 rounded-lg bg-gradient-to-b from-brand-50 to-brand-100/50 dark:from-brand-900/20 dark:to-brand-900/10 border border-brand-200 dark:border-brand-700/30">
                                <p className="text-[9px] uppercase tracking-wide text-brand-500 font-bold">Total</p>
                                <p className="text-sm font-black text-brand-600 dark:text-brand-400 mt-0.5">
                                  {total}h
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
