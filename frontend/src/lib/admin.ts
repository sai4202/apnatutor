/**
 * Types and helpers for the admin console — M5-06.
 *
 * The shapes here mirror the backend's admin DTOs. They are written out rather than inferred
 * because these are the screens where being wrong is expensive: an admin acting on a mislabelled
 * field suspends the wrong account or refunds the wrong tutor.
 *
 * Nothing here fetches. The pages own their own loading and error states, because a shared
 * fetch helper that swallows failures is how an admin ends up looking at an empty queue that is
 * empty only because the request failed.
 */

export type UserRole = "STUDENT" | "TUTOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/* -------------------------------------------------------------------------- */
/* Users                                                                       */
/* -------------------------------------------------------------------------- */

export interface UserRow {
  id: number;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  phoneVerified: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export interface UserDetail {
  account: UserRow;
  suspendedBy: number | null;
  walletBalance: number | null;
  leadsHeld: number | null;
  disputesRaised: number | null;
  enquiriesPosted: number | null;
  enquiriesLive: number | null;
  enquiriesRemoved: number | null;
}

export interface SuspensionOutcome {
  user: UserDetail;
  enquiriesRemoved: number;
}

/* -------------------------------------------------------------------------- */
/* Requirements                                                                */
/* -------------------------------------------------------------------------- */

export type RequirementStatus =
  | "OPEN"
  | "CAPPED"
  | "HIRED"
  | "CLOSED"
  | "EXPIRED"
  | "REMOVED";

export interface ModerationView {
  id: number;
  studentId: number;
  studentPhone: string | null;
  subject: string | null;
  gradeLevel: string | null;
  board: string | null;
  location: string | null;
  mode: string;
  budgetAmountPaise: number | null;
  budgetUnit: string | null;
  description: string | null;
  status: RequirementStatus;
  unlockCostCredits: number;
  unlockCount: number;
  disputedByTutors: number;
  expiresAt: string;
  postedAt: string;
  removedAt: string | null;
  removalReason: string | null;
}

export interface RemovalOutcome {
  requirement: ModerationView;
  tutorsRefunded: number;
}

/* -------------------------------------------------------------------------- */
/* Verification, reviews, disputes                                             */
/* -------------------------------------------------------------------------- */

export interface VerificationView {
  id: number;
  userId: number;
  type: "EMAIL" | "ID" | "EDUCATION";
  status: ModerationStatus;
  /** A storage key, not a URL you can put in an img src — it needs the bearer token. */
  documentUrl: string | null;
  rejectionReason: string | null;
  reviewedBy: number | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ReviewAdminView {
  id: number;
  tutorId: number;
  studentId: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: ModerationStatus;
  rejectionReason: string | null;
  moderatedBy: number | null;
  moderatedAt: string | null;
  tutorReply: string | null;
  tutorReplyStatus: ModerationStatus | null;
  tutorReplyAt: string | null;
  tutorReplyModeratedBy: number | null;
  createdAt: string;
}

export interface DisputeEntry {
  id: number;
  unlockId: number;
  tutorId: number;
  requirementId: number;
  reason: string;
  details: string | null;
  credits: number;
  /** 0-1. The context that changes the decision. */
  tutorDisputeRate: number;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                     */
/* -------------------------------------------------------------------------- */

export interface PackageView {
  id: number;
  name: string;
  credits: number;
  pricePaise: number;
  pricePerCreditPaise: number;
  highlighted: boolean;
  active: boolean;
}

export interface SettingView {
  key: string;
  value: string;
  valueType: string;
  description: string | null;
  minValue: number | null;
  maxValue: number | null;
}

export interface BandView {
  id: number;
  minBudgetPaise: number;
  credits: number;
  label: string;
}

/* -------------------------------------------------------------------------- */
/* Metrics                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A count out of a total.
 *
 * The backend deliberately refuses to send a bare percentage: on a young platform "8%" hides
 * that it means two out of twenty-five, and an admin who cannot see the denominator cannot tell
 * a trend from a rounding artefact.
 */
export interface Ratio {
  of: number;
  total: number;
}

export interface Dashboard {
  windowDays: number;
  accounts: {
    students: number;
    tutors: number;
    suspended: number;
    published: Ratio;
    idVerified: Ratio;
    everPurchased: Ratio;
  };
  requirements: {
    posted: number;
    live: number;
    removed: number;
    answered: Ratio;
    filled: Ratio;
  };
  leads: {
    unlocks: number;
    creditsSpent: number;
    disputed: Ratio;
    disputesUpheld: Ratio;
  };
  revenue: {
    grossPaise: number;
    paidOrders: number;
    abandoned: Ratio;
    bonusCreditsGranted: number;
  };
  daily: {
    day: string;
    signups: number;
    requirements: number;
    unlocks: number;
    revenuePaise: number;
  }[];
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Paise to rupees.
 *
 * Money is stored and sent in paise as an integer (SOURCE_OF_TRUTH.md §5); the division happens
 * here, at the last possible moment, and nowhere else in the console.
 */
export function rupees(paise: number, withPaise = false): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: withPaise ? 2 : 0,
    maximumFractionDigits: withPaise ? 2 : 0,
  }).format(paise / 100);
}

/** A ratio as a percentage, or an em dash when there is no denominator to divide by. */
export function percent(ratio: Ratio): string {
  return ratio.total === 0 ? "—" : `${Math.round((ratio.of / ratio.total) * 100)}%`;
}

export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 days ago" — how long something has been sitting in a queue, which is the thing to notice. */
export function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/* -------------------------------------------------------------------------- */
/* Audit log                                                                   */
/* -------------------------------------------------------------------------- */

export type AuditOutcome = "SUCCEEDED" | "REFUSED" | "FAILED";

export interface AuditRow {
  id: number;
  actorId: number | null;
  actorRole: UserRole | null;
  action: string;
  targetType: string | null;
  targetId: number | null;
  summary: string | null;
  /** JSON text, partial by design — the fields the decision moved. */
  beforeState: string | null;
  afterState: string | null;
  outcome: AuditOutcome;
  httpMethod: string | null;
  path: string | null;
  httpStatus: number | null;
  correlationId: string | null;
  ipAddress: string | null;
  at: string;
}

/**
 * Formats a stored state blob for display.
 *
 * Re-parsed and re-stringified rather than printed raw: Postgres returns jsonb in its own
 * normalised form, which is compact and hard to scan. Returns the original text if it will not
 * parse — an audit entry that renders badly is still better than one that renders as nothing.
 */
export function formatState(json: string | null): string | null {
  if (!json) return null;
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

/* -------------------------------------------------------------------------- */
/* Abuse reports                                                               */
/* -------------------------------------------------------------------------- */

export type ReportSubjectType = "TUTOR" | "STUDENT" | "REVIEW" | "REQUIREMENT";
export type ReportStatus = "OPEN" | "UPHELD" | "DISMISSED";
export type ReportSource = "USER" | "SYSTEM";

export interface TriageView {
  id: number;
  source: ReportSource;
  reporterId: number | null;
  subjectType: ReportSubjectType;
  subjectId: number;
  reason: string;
  details: string | null;
  status: ReportStatus;
  /** How many different people reported this subject. One person filing repeatedly is one opinion. */
  distinctReporters: number;
  totalReports: number;
  filedAt: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  decisionNote: string | null;
}

/** Where in the console a moderator goes to actually do something about a report. */
export const ACTION_FOR_SUBJECT: Record<ReportSubjectType, { href: string; label: string }> = {
  TUTOR: { href: "/admin/users", label: "Find the account" },
  STUDENT: { href: "/admin/users", label: "Find the account" },
  REVIEW: { href: "/admin/reviews", label: "Review moderation" },
  REQUIREMENT: { href: "/admin/requirements", label: "Enquiry moderation" },
};

/** Turns SCREAMING_SNAKE into something readable, for reasons and subject types. */
export function humanise(code: string): string {
  const words = code.replaceAll("_", " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
