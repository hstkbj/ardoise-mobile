/** Types de l'API parents — voir resources/openapi/parent.yaml dans le dépôt Laravel. */

export type Feature = 'grades' | 'attendance' | 'parent_portal' | 'homework' | 'timetable' | 'finance' | 'online_payment' | 'sms' | 'documents' | (string & {});

export interface Me {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  parent_id: number;
  tenant: { id: number; name: string; code: string; domain?: string } | null;
  features: Feature[];
  online_payment: boolean;
}

export interface Grade {
  id: number;
  subject: string;
  title: string;
  date: string;
  score: number | null;
  max: number;
  coefficient: number;
  class_average: number | null;
  comment: string | null;
}

export interface AttendanceRecord {
  id: number;
  date: string;
  slot: string;
  type: 'absent' | 'late';
  minutes: number | null;
  justified: boolean;
  reason: string | null;
}

export interface Homework {
  id: number;
  subject: string | null;
  title: string;
  instructions: string | null;
  due: string;
  done: boolean;
}

export interface FeeInstallment {
  id: number;
  reference: string;
  fee_name: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  method: string;
  paid_at: string | null;
  due_date: string | null;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
}

export interface ReportCardEntry {
  id: number;
  term_id: number;
  term: string;
  /** withheld : publié mais retenu par la règle des impayés de l'école */
  status: 'upcoming' | 'published' | 'withheld';
  published_at: string | null;
}

export interface FinanceNotice {
  mode: 'warn' | 'block';
  blocked: boolean;
  late_amount: number;
}

export interface Child {
  id: number;
  first_name: string;
  full_name: string;
  matricule: string;
  class_id: number | null;
  class_name: string | null;
  school_name: string | null;
  head_teacher: string | null;
  general_average: number | null;
  rank: number | null;
  class_size: number;
  term: string | null;
  absences: number;
  late: number;
  evolution: { label: string; value: number }[];
  grades: Grade[];
  subjects: { name: string; average: number | null }[];
  attendance: AttendanceRecord[];
  homework: Homework[];
  payments: FeeInstallment[];
  finance_notice: FinanceNotice | null;
  report_cards: ReportCardEntry[];
}

export interface ReportCard {
  id?: number;
  school: string;
  academic_year: string;
  term: string;
  term_id: number;
  status: string;
  student: { id: number; full_name: string; matricule: string; class_name: string | null };
  show_rank: boolean;
  subjects: { name: string; teacher: string | null; coefficient: number; average: number | null; class_average: number | null; appreciation: string | null }[];
  general_average: number | null;
  class_average: number | null;
  rank: number | null;
  class_size: number;
  absences: number;
  late: number;
  head_teacher_comment: string | null;
  council_decision: string | null;
}

export interface TimetableEntry {
  id: number;
  day: number;
  start: string;
  end: string;
  subject: string | null;
  teacher: string;
  room: string | null;
  class_name: string | null;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  audience: string;
  author: string;
  published_at: string | null;
}

export interface SchoolDocument {
  id: number;
  name: string;
  category: string;
  owner: string;
  student_id: number | null;
  size: string;
  mime: string;
  uploaded_at: string;
  download_url: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  created_at: string;
  read: boolean;
}

export interface CheckoutResult {
  status: 'redirect' | 'pending' | string;
  provider?: string;
  redirect_url: string | null;
  payment_id: number;
  reference: string;
  message?: string;
}

export interface PaymentCheck {
  reference: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount: number;
}
