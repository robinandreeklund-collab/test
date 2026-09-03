// In-memory data store for the GiGi beta test build.
//
// Why in-memory: the goal is "deploy on Render and try it" with zero external
// setup. Render runs a single long-lived Node process, so a module-level
// singleton is shared across all requests (unlike Vercel serverless). Data
// resets on redeploy/restart — acceptable for a test build. The API layer only
// ever touches this module, so swapping it for the Postgres schema in
// db/schema.sql is a localized change.

import type {
  ActionLog,
  AnalyticsEvent,
  Bill,
  Digest,
  Feedback,
  Household,
  WaitlistEntry,
} from './types';
import { buildDigest } from './digest';

interface DB {
  households: Household[];
  bills: Bill[];
  digests: Digest[];
  actions: ActionLog[];
  events: AnalyticsEvent[];
  feedback: Feedback[];
  waitlist: WaitlistEntry[];
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
    bills,
    digests: [],
    actions: [],
    events: [],
    feedback: [],
    waitlist: [],
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

  return db;
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

  db.digests.push(buildDigest(household, listBills(hid), []));
  db.events.push({ id: id('evt'), householdId: hid, name: 'household_created', props: {}, createdAt: iso() });
  return household;
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
