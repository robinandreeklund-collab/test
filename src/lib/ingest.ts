import type { Bill, Household } from './types';
import { addBill, regenerateDigest, track } from './store';
import { extractBill, RawEmail } from './extraction';

// Turn one forwarded email into an unconfirmed bill for a household, then
// refresh the digest. Shared by the inbound webhook and the in-app tester.
export async function ingestEmail(
  household: Household,
  email: RawEmail,
): Promise<{ engine: string; extracted: unknown; bill: Bill }> {
  const { result, engine } = await extractBill(email);

  const bill = addBill({
    householdId: household.id,
    provider: result.provider ?? 'Unknown sender',
    type: result.type ?? 'other',
    amount: result.amount,
    currency: result.currency ?? household.currency,
    renewalDate: result.renewalDate,
    priceIncreaseFlag: result.priceIncreaseFlag,
    source: 'extracted',
    confirmed: false, // user confirms before monitoring — matches "null over guessing"
  });

  regenerateDigest(household.id);
  track('email_forwarded', household.id, {
    engine,
    type: bill.type,
    hasAmount: result.amount !== null,
    hasDate: result.renewalDate !== null,
  });

  return { engine, extracted: result, bill };
}
