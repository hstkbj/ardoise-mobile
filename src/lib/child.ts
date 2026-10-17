import type { Child, FeeInstallment } from './types';

/** Calculs partagés par les écrans à partir du résumé d'un enfant. */
export const remainingDue = (child: Child) => child.payments.filter((p) => p.status !== 'paid').reduce((a, p) => a + Number(p.remaining), 0);
export const overdue = (child: Child) => child.payments.filter((p) => p.status === 'overdue');
export const todoHomework = (child: Child) => child.homework.filter((h) => !h.done);
export const unjustified = (child: Child) => child.attendance.filter((a) => !a.justified);
export const latestReportCard = (child: Child) => [...child.report_cards].reverse().find((r) => r.status !== 'upcoming') ?? null;
export const isPayable = (p: FeeInstallment) => p.status !== 'paid' && Number(p.remaining) > 0;
