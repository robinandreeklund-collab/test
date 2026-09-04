// In-memory data store for the GiGi beta test build.
//
// Why in-memory: the goal is "deploy on Render and try it" with zero external
// setup. Render runs a single long-lived Node process, so a module-level
// singleton is shared across all requests (unlike Vercel serverless). Data
// resets on redeploy/restart — acceptable for a test build. The API layer only
// ever touches this module, so swapping it for the Postgres schema in
// db/schema.sql is a localized change.

import { createHash } from 'crypto';
import type {
  ActionLog,
  AnalyticsEvent,
  Bill,
  Child,
  Digest,
  Feedback,
  Household,
  Member,
  MemberRole,
  ProcessingAction,
  ProcessingActor,
  ProcessingEvent,
  WaitlistEntry,
} from './types';
import { buildDigest } from './digest';

interface DB {
  households: Household[];
  members: Member[];
  children: Child[];
  bills: Bill[];
  digests: Digest[];
  actions: ActionLog[];
  events: AnalyticsEvent[];
  feedback: Feedback[];
  waitlist: WaitlistEntry[];
  processing: ProcessingEvent[];
}

// Persist across Next.js hot reloads in dev by hanging off globalThis.
const g = globalThis as unknown as { __gigiDB?: DB };

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function iso(daysFromNow = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

function isoDate(daysFromNow = 0): string {
  return iso(daysFromNow).slice(0, 10);
}

function seed(): DB {
  const householdId = 'hh_demo';
  const household: Household = {
    id: householdId,
    ownerName: 'Kerstin',
    email: 'demo@getgigiapp.com',
    market: 'uk',
    currency: 'GBP',
    timezone: 'Europe/London',
    adults: '2',
    children: '1-2',
    postcode: 'SW1A 1AA',
    forwardingAddress: 'kerstin.demo@in.getgigiapp.com',
    connectionStatus: 'active',
    digestTime: '07:00',
    digestPaused: false,
    createdAt: iso(-40),
  };

  const bills: Bill[] = [
    {
      id: 'bill_broadband',
      householdId,
      provider: 'Virgin Media',
      type: 'broadband',
      amount: 62,
      currency: 'GBP',
      renewalDate: isoDate(12),
      priceIncreaseFlag: true,
      source: 'seed',
      confirmed: true,
      createdAt: iso(-40),
    },
    {
      id: 'bill_energy',
      householdId,
      provider: 'Octopus Energy',
      type: 'energy',
      amount: 184,
      currency: 'GBP',
      renewalDate: isoDate(48),
      priceIncreaseFlag: false,
      source: 'seed',
      confirmed: true,
      createdAt: iso(-40),
    },
    {
      id: 'bill_mobile',
      householdId,
      provider: 'Vodafone',
      type: 'mobile',
      amount: 28,
      currency: 'GBP',
      renewalDate: isoDate(70),
      priceIncreaseFlag: false,
      source: 'seed',
      confirmed: true,
      createdAt: iso(-40),
    },
    {
      id: 'bill_insurance',
      householdId,
      provider: 'Aviva',
      type: 'insurance',
      amount: 41,
      currency: 'GBP',
      renewalDate: isoDate(26),
      priceIncreaseFlag: true,
      source: 'seed',
      confirmed: true,
      createdAt: iso(-40),
    },
    {
      // A deliberately-degraded bill: extraction returned null over guessing.
      id: 'bill_tv',
      householdId,
      provider: 'Sky',
      type: 'tv',
      amount: null,
      currency: 'GBP',
      renewalDate: null,
      priceIncreaseFlag: false,
      source: 'extracted',
      confirmed: false,
      createdAt: iso(-3),
    },
  ];

  const db: DB = {
    households: [household],
    members: [
      {
        id: 'mem_demo',
        householdId,
        name: 'Kerstin',
        email: 'demo@getgigiapp.com',
        role: 'owner',
        status: 'active',
        createdAt: iso(-40),
      },
    ],
    children: [
      { id: 'child_demo', householdId, name: 'Ella', yearGroup: 'Year 4', passportExpiry: isoDate(300), createdAt: iso(-40) },
    ],
    bills,
    digests: [],
    actions: [],
    events: [],
    feedback: [],
    waitlist: [],
    processing: [],
  };

  // Generate today's digest for the demo household so the app has something live.
  db.digests.push(buildDigest(household, bills, db.actions));
  db.events.push({
    id: id('evt'),
    householdId,
    name: 'seed_loaded',
    props: {},
    createdAt: iso(),
  });

  // Seed a short, realistic trust-log history so the "Your data" screen isn't
  // empty in the demo. Uses the same append-only hashing as live events.
  seedProcessing(db, householdId);

  return db;
}

// Deterministic canonical string for the hash chain (order matters).
function processingDigest(prevHash: string, e: Omit<ProcessingEvent, 'id' | 'hash' | 'prevHash'>): string {
  const canonical = [e.at, e.action, e.category, e.actor, e.region, e.purpose, e.legalBasis, e.detail].join('|');
  return createHash('sha256').update(`${prevHash}|${canonical}`).digest('hex');
}

function pushProcessing(db: DB, input: Omit<ProcessingEvent, 'id' | 'hash' | 'prevHash'>): ProcessingEvent {
  const prior = db.processing.filter((p) => p.householdId === input.householdId);
  const prevHash = prior.length ? prior[prior.length - 1].hash : 'genesis';
  const base = { ...input };
  const hash = processingDigest(prevHash, base);
  const entry: ProcessingEvent = { ...base, id: id('proc'), prevHash, hash };
  db.processing.push(entry);
  return entry;
}

function seedProcessing(db: DB, householdId: string) {
  const mk = (
    minutesAgo: number,
    action: ProcessingAction,
    category: ProcessingEvent['category'],
    actor: ProcessingActor,
    detail: string,
    purpose: string,
    legalBasis: string,
    region: string,
    durationMs?: number,
  ) => {
    const at = new Date(Date.now() - minutesAgo * 60_000).toISOString();
    pushProcessing(db, { householdId, at, action, category, actor, detail, purpose, legalBasis, region, durationMs });
  };
  // Oldest first so the chain reads chronologically.
  mk(60 * 26, 'account_created', 'account', 'you', 'You created your household', 'Set up your account', 'Contract (providing the service)', 'EU (London)');
  mk(60 * 24, 'email_received', 'bill', 'email_service', 'A broadband email you forwarded arrived', 'You asked GiGi to watch this sender', 'Consent', 'EU (London)');
  mk(60 * 24 - 1, 'analyzed_on_server', 'bill', 'gigi_server', 'GiGi read it on our server (no AI, nothing left the server)', 'Find the provider, price and renewal date', 'Consent', 'EU (London)', 40);
  mk(60 * 24 - 1, 'stored', 'bill', 'gigi_server', 'A broadband bill was saved to your register', 'Track your renewal', 'Consent', 'EU (London)');
  mk(60 * 2, 'digest_generated', 'digest', 'gigi_server', "Tonight's digest was prepared", 'Show you what needs attention', 'Contract (providing the service)', 'EU (London)', 12);
}

function getDB(): DB {
  if (!g.__gigiDB) g.__gigiDB = seed();
  return g.__gigiDB;
}

// --- Households ---------------------------------------------------------------

export function getHousehold(id: string): Household | undefined {
  return getDB().households.find((h) => h.id === id);
}

export function getDefaultHousehold(): Household {
  // The test build always has the demo household available.
  return getDB().households[0];
}

export function getHouseholdById(id: string): Household | undefined {
  return getDB().households.find((h) => h.id === id);
}

export function findHouseholdByEmail(email: string): Household | undefined {
  const e = email.trim().toLowerCase();
  return getDB().households.find((h) => h.email.toLowerCase() === e);
}

// Route an inbound (forwarded) email to a household. Best-effort so the forward
// feature "just works" for a single tester without fiddly plus-addressing:
//   1) recipient contains the household's forwarding local-part or its id
//   2) sender matches a household's own email (they forwarded from their inbox)
//   3) exactly one real (non-demo) household exists → use it
//   4) fall back to the demo household
export function resolveInboundHousehold(recipient?: string, sender?: string): Household {
  const db = getDB();
  const rcpt = (recipient ?? '').toLowerCase();
  if (rcpt) {
    const byAddr = db.households.find((h) => {
      const local = h.forwardingAddress.split('@')[0].toLowerCase();
      return rcpt.includes(local) || rcpt.includes(h.id.toLowerCase());
    });
    if (byAddr) return byAddr;
  }
  if (sender) {
    const bySender = findHouseholdByEmail(sender.replace(/.*</, '').replace(/>.*/, '').trim());
    if (bySender) return bySender;
  }
  const real = db.households.filter((h) => h.id !== 'hh_demo');
  if (real.length === 1) return real[0];
  return getDefaultHousehold();
}

// Create a brand-new household on sign-up. Seeds a couple of "found" (extracted,
// unconfirmed) example bills so the bills-found onboarding screen has something
// to confirm, plus today's digest.
export function createHousehold(input: {
  ownerName: string;
  email: string;
  passwordHash: string;
}): Household {
  const db = getDB();
  const hid = id('hh');
  const localPart = input.email.split('@')[0].replace(/[^a-z0-9]/gi, '.').toLowerCase();
  const household: Household = {
    id: hid,
    ownerName: input.ownerName || 'there',
    email: input.email.trim(),
    passwordHash: input.passwordHash,
    market: 'uk',
    currency: 'GBP',
    timezone: 'Europe/London',
    adults: '2',
    children: '1-2',
    postcode: '',
    forwardingAddress: `${localPart}@in.getgigiapp.com`,
    connectionStatus: 'pending',
    digestTime: '07:00',
    digestPaused: false,
    createdAt: iso(),
  };
  db.households.push(household);

  // A couple of example "found" bills to make onboarding feel alive.
  db.bills.push(
    {
      id: id('bill'),
      householdId: hid,
      provider: 'Virgin Media',
      type: 'broadband',
      amount: 59,
      currency: 'GBP',
      renewalDate: isoDate(18),
      priceIncreaseFlag: true,
      source: 'extracted',
      confirmed: false,
      createdAt: iso(),
    },
    {
      id: id('bill'),
      householdId: hid,
      provider: 'British Gas',
      type: 'energy',
      amount: null, // null over guessing — user confirms
      currency: 'GBP',
      renewalDate: isoDate(40),
      priceIncreaseFlag: false,
      source: 'extracted',
      confirmed: false,
      createdAt: iso(),
    },
  );

  // The owner is the first family member. Auth lives on the Member.
  db.members.push({
    id: id('mem'),
    householdId: hid,
    name: household.ownerName,
    email: household.email,
    role: 'owner',
    status: 'active',
    passwordHash: input.passwordHash,
    createdAt: iso(),
  });

  db.digests.push(buildDigest(household, listBills(hid), []));
  db.events.push({ id: id('evt'), householdId: hid, name: 'household_created', props: {}, createdAt: iso() });
  logProcessing(
    hid, 'account_created', 'account', 'you',
    'You created your household',
    'Set up your account',
    'Contract (providing the service)',
  );
  return household;
}

// --- Members (family accounts) -----------------------------------------------

export function listMembers(householdId: string): Member[] {
  return getDB().members.filter((m) => m.householdId === householdId);
}

export function getMemberById(memberId: string): Member | undefined {
  return getDB().members.find((m) => m.id === memberId);
}

export function findMemberByEmail(email: string): Member | undefined {
  const e = email.trim().toLowerCase();
  return getDB().members.find((m) => m.email.toLowerCase() === e && m.status === 'active');
}

export function ownerMember(householdId: string): Member | undefined {
  return getDB().members.find((m) => m.householdId === householdId && m.role === 'owner');
}

// Invite a family member (adult co-parent or teen). Returns the invite token.
export function inviteMember(householdId: string, name: string, email: string, role: MemberRole): Member {
  const member: Member = {
    id: id('mem'),
    householdId,
    name,
    email: email.trim(),
    role: role === 'owner' ? 'adult' : role, // never invite a second owner
    status: 'invited',
    inviteToken: id('inv') + id('tok'),
    createdAt: iso(),
  };
  getDB().members.push(member);
  logProcessing(
    householdId, 'member_invited', 'account', 'you',
    `You invited ${name} to your household as ${member.role}`,
    'Add a family member',
    'Consent',
  );
  return member;
}

export function getMemberByInvite(token: string): Member | undefined {
  return getDB().members.find((m) => m.inviteToken === token && m.status === 'invited');
}

// Accept an invite: set name/password and activate.
export function activateMember(token: string, name: string, passwordHash: string): Member | undefined {
  const m = getMemberByInvite(token);
  if (!m) return undefined;
  m.name = name || m.name;
  m.passwordHash = passwordHash;
  m.status = 'active';
  delete m.inviteToken;
  logProcessing(
    m.householdId, 'member_joined', 'account', 'you',
    `${m.name} joined your household`,
    'A family member accepted their invite',
    'Consent',
  );
  return m;
}

export function removeMember(householdId: string, memberId: string): boolean {
  const db = getDB();
  const m = db.members.find((x) => x.id === memberId && x.householdId === householdId);
  if (!m || m.role === 'owner') return false; // never remove the owner
  db.members = db.members.filter((x) => x.id !== memberId);
  logProcessing(
    householdId, 'member_removed', 'account', 'you',
    `You removed ${m.name} from your household`,
    'Manage who can access your household',
    'Consent',
  );
  return true;
}

// --- Children (profiles, no login) -------------------------------------------

export function listChildren(householdId: string): Child[] {
  return getDB().children.filter((c) => c.householdId === householdId);
}

export function addChild(householdId: string, input: { name: string; yearGroup?: string; passportExpiry?: string }): Child {
  const child: Child = { id: id('child'), householdId, name: input.name, yearGroup: input.yearGroup, passportExpiry: input.passportExpiry, createdAt: iso() };
  getDB().children.push(child);
  logProcessing(
    householdId, 'child_added', 'account', 'you',
    `You added a child profile (${child.name})`,
    'Associate school and travel items with your child',
    'Consent (special-category data, minimised)',
  );
  return child;
}

export function removeChild(householdId: string, childId: string): boolean {
  const db = getDB();
  const c = db.children.find((x) => x.id === childId && x.householdId === householdId);
  if (!c) return false;
  db.children = db.children.filter((x) => x.id !== childId);
  logProcessing(householdId, 'child_removed', 'account', 'you', `You removed a child profile (${c.name})`, 'Remove a child profile', 'Consent');
  return true;
}

export function updateHousehold(id: string, patch: Partial<Household>): Household | undefined {
  const db = getDB();
  const h = db.households.find((x) => x.id === id);
  if (!h) return undefined;
  Object.assign(h, patch);
  return h;
}

// --- Bills --------------------------------------------------------------------

export function listBills(householdId: string): Bill[] {
  return getDB().bills.filter((b) => b.householdId === householdId);
}

export function getBill(id: string): Bill | undefined {
  return getDB().bills.find((b) => b.id === id);
}

export function addBill(
  input: Omit<Bill, 'id' | 'createdAt'>,
): Bill {
  const bill: Bill = { ...input, id: id('bill'), createdAt: iso() };
  getDB().bills.push(bill);
  return bill;
}

export function updateBill(id: string, patch: Partial<Bill>): Bill | undefined {
  const b = getBill(id);
  if (!b) return undefined;
  Object.assign(b, patch);
  return b;
}

export function deleteBill(id: string): boolean {
  const db = getDB();
  const i = db.bills.findIndex((b) => b.id === id);
  if (i === -1) return false;
  db.bills.splice(i, 1);
  return true;
}

// --- Digests ------------------------------------------------------------------

export function getTodayDigest(householdId: string): Digest | undefined {
  const today = isoDate();
  return getDB()
    .digests.filter((d) => d.householdId === householdId)
    .find((d) => d.date === today);
}

export function listDigests(householdId: string): Digest[] {
  return getDB()
    .digests.filter((d) => d.householdId === householdId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Simulates the 02:00 nightly Inngest run for one household.
export function regenerateDigest(householdId: string): Digest | undefined {
  const db = getDB();
  const household = getHousehold(householdId);
  if (!household) return undefined;
  const bills = listBills(householdId);
  const actions = db.actions.filter((a) => a.householdId === householdId);
  const fresh = buildDigest(household, bills, actions);
  const today = isoDate();
  const existingIdx = db.digests.findIndex(
    (d) => d.householdId === householdId && d.date === today,
  );
  if (existingIdx >= 0) db.digests[existingIdx] = fresh;
  else db.digests.push(fresh);
  return fresh;
}

export function markDigestOpened(householdId: string): void {
  const d = getTodayDigest(householdId);
  if (d && !d.openedAt) d.openedAt = iso();
}

// --- Actions ------------------------------------------------------------------

export function logAction(input: Omit<ActionLog, 'id' | 'createdAt'>): ActionLog {
  const a: ActionLog = { ...input, id: id('act'), createdAt: iso() };
  getDB().actions.push(a);
  return a;
}

export function listActions(householdId: string): ActionLog[] {
  return getDB().actions.filter((a) => a.householdId === householdId);
}

// Value tracker: total saved + tasks handled.
export function valueSummary(householdId: string): { savedAnnual: number; handled: number; currency: string } {
  const acts = listActions(householdId);
  const savedAnnual = acts
    .filter((a) => a.action === 'approve')
    .reduce((sum, a) => sum + (a.savingAnnual ?? 0), 0);
  const handled = acts.filter((a) => a.action === 'approve' || a.action === 'done').length;
  const hh = getHousehold(householdId);
  return { savedAnnual, handled, currency: hh?.currency ?? 'GBP' };
}

// --- Events (instrumentation) -------------------------------------------------

export function track(name: string, householdId: string | null, props: Record<string, unknown> = {}): void {
  getDB().events.push({ id: id('evt'), householdId, name, props, createdAt: iso() });
}

export function listEvents(): AnalyticsEvent[] {
  return [...getDB().events].reverse();
}

// --- Feedback -----------------------------------------------------------------

export function addFeedback(input: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
  const f: Feedback = { ...input, id: id('fb'), createdAt: iso() };
  getDB().feedback.push(f);
  return f;
}

export function listFeedback(): Feedback[] {
  return [...getDB().feedback].reverse();
}

// --- Waitlist -----------------------------------------------------------------

export function addWaitlist(email: string, segment: 'household' | 'company', source: string): WaitlistEntry {
  const entry: WaitlistEntry = {
    id: id('wl'),
    email,
    segment,
    source,
    createdAt: iso(),
  };
  getDB().waitlist.push(entry);
  return entry;
}

export function listWaitlist(): WaitlistEntry[] {
  return [...getDB().waitlist].reverse();
}

// --- Trust log (user-facing processing lineage) ------------------------------

// Append one processing event to a household's tamper-evident log. `detail`
// must be metadata only (a provider or category is fine; never amounts or the
// email body).
export function logProcessing(
  householdId: string,
  action: ProcessingAction,
  category: ProcessingEvent['category'],
  actor: ProcessingActor,
  detail: string,
  purpose: string,
  legalBasis: string,
  region = 'EU (London)',
  durationMs?: number,
): ProcessingEvent {
  return pushProcessing(getDB(), {
    householdId,
    at: iso(),
    action,
    category,
    actor,
    detail,
    purpose,
    legalBasis,
    region,
    durationMs,
  });
}

export function listProcessing(householdId: string): ProcessingEvent[] {
  return getDB().processing.filter((p) => p.householdId === householdId);
}

// Recompute the hash chain to prove the log has not been altered or reordered.
export function verifyProcessingChain(householdId: string): { ok: boolean; count: number } {
  const chain = listProcessing(householdId);
  let prev = 'genesis';
  for (const e of chain) {
    if (e.prevHash !== prev) return { ok: false, count: chain.length };
    const expected = processingDigest(prev, e);
    if (expected !== e.hash) return { ok: false, count: chain.length };
    prev = e.hash;
  }
  return { ok: true, count: chain.length };
}

// Right to erasure. Clears the household's content-bearing data and records a
// final, verifiable deletion entry in the trust log (metadata only — the record
// that deletion happened is itself a trust signal).
export function deleteHouseholdData(householdId: string): void {
  const db = getDB();
  db.bills = db.bills.filter((b) => b.householdId !== householdId);
  db.digests = db.digests.filter((d) => d.householdId !== householdId);
  db.actions = db.actions.filter((a) => a.householdId !== householdId);
  db.feedback = db.feedback.filter((f) => f.householdId !== householdId);
  db.children = db.children.filter((c) => c.householdId !== householdId);
  // Remove invited/co-parent/teen members; keep the owner so their session
  // survives into an empty account.
  db.members = db.members.filter((m) => m.householdId !== householdId || m.role === 'owner');
  logProcessing(
    householdId,
    'data_deleted',
    'account',
    'you',
    'You deleted all your data — bills, digests and history were erased',
    'Your right to erasure',
    'Legal obligation (GDPR Art. 17)',
  );
}
