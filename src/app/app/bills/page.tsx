'use client';

import { useEffect, useState } from 'react';
import { trackClient } from '@/lib/analytics';
import { formatMoney } from '@/lib/money';
import { AddBill } from '@/components/AddBill';
import type { Bill, Currency } from '@/lib/types';

export default function BillsRegister() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [adding, setAdding] = useState(false);

  async function load() {
    const j = await fetch('/api/bills').then((r) => r.json());
    setBills(j.bills);
    setCurrency(j.currency);
    setMonthlyTotal(j.monthlyTotal);
  }

  useEffect(() => { load(); trackClient('bills_register_viewed'); }, []);

  async function remove(id: string) {
    await fetch(`/api/bills/${id}`, { method: 'DELETE' });
    trackClient('bill_deleted', { id });
    load();
  }

  return (
    <div className="screen">
      <h1>Your bills</h1>
      <div className="card row between" style={{ marginBottom: 14 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Monthly total</p>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatMoney(monthlyTotal, currency)}</div>
        </div>
        <span className="pill">{bills.length} bills</span>
      </div>

      <div className="stack">
        {bills.map((b) => (
          <div className="card" key={b.id}>
            <div className="row between">
              <div>
                <h3 style={{ marginBottom: 2 }}>{b.provider}</h3>
                <span className="badge-cat">{b.type}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{formatMoney(b.amount, currency)}<span className="tiny muted">/mo</span></div>
                {b.renewalDate && <span className="tiny muted">renews {b.renewalDate}</span>}
              </div>
            </div>
            <div className="row between" style={{ marginTop: 10 }}>
              <div className="row" style={{ gap: 6 }}>
                {b.priceIncreaseFlag && <span className="pill accent">↑ rising</span>}
                {!b.confirmed && <span className="pill accent">unconfirmed</span>}
                <span className="pill">{b.source}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => remove(b.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <AddBill currency={currency} where="register" onDone={() => { setAdding(false); load(); }} onCancel={() => setAdding(false)} />
      ) : (
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => { setAdding(true); trackClient('add_bill_opened', { where: 'register' }); }}>
          + Add a bill
        </button>
      )}
    </div>
  );
}
