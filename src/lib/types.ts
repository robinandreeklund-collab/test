// Domain types for the GiGi beta test build.
// These mirror db/schema.sql so the in-memory store can be swapped for Postgres
// without touching the API layer.

export type Market = 'uk' | 'se';
export type Currency = 'GBP' | 'SEK';

export type BillType =
  | 'broadband'
  | 'energy'
  | 'mobile'
  | 'tv'
  | 'insurance'
  | 'other';

// Which verticals GiGi will actually execute a switch for in the beta.
// Insurance is intentionally excluded — regulated activity (see docs/DECISIONS.md §3).
export const EXECUTABLE_BILL_TYPES: BillType[] = ['broadband', 'energy', 'mobile'];

export type UrgencyBand = 'today' | 'soon' | 'upcoming';

export type DigestItemCategory = 'bill' | 'school' | 'travel' | 'system';

// Connection state for the forward-to-GiGi mechanism (no OAuth in beta).
export type ConnectionStatus = 'pending' | 'active' | 'degraded';

export interface Household {
  id: string;
  ownerName: string;
  email: string;
  // "salt:scryptHex". Absent on the seeded demo household (which has no password).
  passwordHash?: string;
  market: Market;
  currency: Currency;
  // IANA timezone, e.g. "Europe/London" or "Europe/Stockholm".
  // The 02:00 nightly / 07:00 digest jobs need this per-household.
  timezone: string;
  adults: '1' | '2' | '3+';
  children: 'none' | '1-2' | '3+';
  postcode: string;
  // Address emails get forwarded to (the "Connect" replacement for OAuth).
  forwardingAddress: string;
  connectionStatus: ConnectionStatus;
  digestTime: string; // "07:00"
  digestPaused: boolean;
  createdAt: string;
}

export interface Bill {
  id: string;
  householdId: string;
  provider: string;
  type: BillType;
  amount: number | null; // null over guessing
  currency: Currency;
  renewalDate: string | null; // ISO date, null over guessing
  priceIncreaseFlag: boolean;
  // How the bill entered the register — matters for the accuracy story.
  source: 'extracted' | 'manual' | 'seed';
  confirmed: boolean;
  createdAt: string;
}

export interface DigestItem {
  id: string;
  category: DigestItemCategory;
  urgency: UrgencyBand;
  // <=10 word action line
  line: string;
  detail?: string;
  executable: boolean;
  // For saving proposals
  savingAnnual?: number;
  currentPrice?: number;
  newPrice?: number;
  relatedBillId?: string;
  status: 'open' | 'approved' | 'done' | 'dismissed';
  // Carry-forward bookkeeping
  firstSurfacedAt: string;
  carryForwardCount: number;
}

export interface Digest {
  id: string;
  householdId: string;
  date: string; // ISO date the digest is for
  // The <=4 items shown up top.
  items: DigestItem[];
  // Overflow surface: everything that couldn't fit the 4 but must not vanish.
  overflow: DigestItem[];
  // Minimum-mode line when nothing needs attention.
  quietLine?: string;
  delivered: boolean;
  openedAt?: string;
  createdAt: string;
}

export interface ActionLog {
  id: string;
  householdId: string;
  itemId: string;
  action: 'approve' | 'done' | 'dismiss';
  outcome: string;
  savingAnnual?: number;
  createdAt: string;
}

// Instrumentation — every metric in §7 of the MVP doc needs this from day one.
export interface AnalyticsEvent {
  id: string;
  householdId: string | null;
  name: string;
  props: Record<string, unknown>;
  createdAt: string;
}

export interface Feedback {
  id: string;
  householdId: string | null;
  kind: 'wrong_extraction' | 'general';
  message: string;
  relatedBillId?: string;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  segment: 'household' | 'company';
  source: string;
  createdAt: string;
}

// --- Trust log (user-facing data-processing lineage) -------------------------
// Distinct from AnalyticsEvent (which is for the founder). This is what the
// USER sees: exactly what happened with their data, in plain language. It
// records the data FLOW, never the data itself — no email bodies, no amounts.

export type ProcessingActor =
  | 'you' // the user's own action
  | 'gigi_server' // stores + analyses on our EU server
  | 'gigi_ai' // Anthropic, EU region — only when AI extraction is enabled
  | 'email_service' // inbound email provider
  | 'concierge'; // founder-assisted execution / the provider a switch goes to

export type ProcessingAction =
  | 'account_created'
  | 'email_received'
  | 'analyzed_on_server'
  | 'sent_to_ai'
  | 'ai_returned'
  | 'stored'
  | 'digest_generated'
  | 'shared_for_execution'
  | 'connection_changed'
  | 'data_deleted';

export interface ProcessingEvent {
  id: string;
  householdId: string;
  at: string; // ISO timestamp
  action: ProcessingAction;
  category: 'bill' | 'digest' | 'account' | 'system';
  actor: ProcessingActor;
  // Plain-language, metadata only (may name a provider/category — never amounts
  // or email content).
  detail: string;
  purpose: string; // why it happened
  legalBasis: string; // GDPR basis in plain words
  region: string; // where it happened, e.g. "EU (London)"
  durationMs?: number;
  // Tamper-evidence: each entry hashes the previous one, so the log is
  // verifiably append-only.
  prevHash: string;
  hash: string;
}
