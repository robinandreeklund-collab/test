'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackClient } from '@/lib/analytics';
import { formatMoney } from '@/lib/money';
import type { Bill, Currency, Digest, Household } from '@/lib/types';

export default function Home() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [value, setValue] = useState<{ savedAnnual: number; handled: number } | null>(null);

  async function load() {
    const [h, b, d, v] = await Promise.all([
      fetch('/api/household').then((r) => r.json()),
      fetch('/api/bills').then((r) => r.json()),
      fetch('/api/digest').then((r) => r.json()),
      fetch('/api/value').then((r) => r.json()).catch(() => null),
    ]);
    setHousehold(h.household);
    setBills(b.bills);
    setCurrency(b.currency);
    setMonthlyTotal(b.monthlyTotal);
    setDigest(d.digest);
    if (v) setValue(v);
  }

  useEffect(() => { load(); trackClient('home_viewed'); }, []);

  if (!household) return <div className="screen"><p className="muted">Loading…</p></div>;

  const nextRenewal = bills
    .filter((b) => b.confirmed && b.renewalDate)
    .sort((a, b) => (a.renewalDate! < b.renewalDate! ? -1 : 1))[0];

  const openToday = digest?.items.filter((i) => i.status === 'open').length ?? 0;

  return (
    <div className="screen">
      <div className="row between" style={{ marginBottom: 16 }}>
        <span className="wordmark" style={{ fontSize: 20 }}>GiGi</span>
        <span className="pill brand">● Running</span>
      </div>

      <div className="card" style={{ background: 'linear-gradient(160deg,#3f6152,#2c4539)', color: '#fff', border: 'none' }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>GiGi has handled</p>
        <div className="value-hero" style={{ color: '#fff' }}>
          {formatMoney(value?.savedAnnual ?? 0, currency)}<span style={{ fontSize: 16, fontWeight: 400 }}> saved/yr</span>
        </div>
        <p className="small" style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>
          {value?.handled ?? 0} task{(value?.handled ?? 0) === 1 ? '' : 's'} taken off your plate
        </p>
      </div>

      <Link href="/app/digest" className="card row between" style={{ marginTop: 12, textDecoration: 'none' }}>
        <div>
          <h3 style={{ marginBottom: 2 }}>Today&apos;s digest</h3>
          <span className="small muted">
            {openToday > 0 ? `${openToday} thing${openToday > 1 ? 's' : ''} waiting` : 'All caught up'}
          </span>
        </div>
        <span className="pill">Open →</span>
      </Link>

      <div className="row" style={{ gap: 12, marginTop: 12 }}>
        <div className="card grow">
          <p className="eyebrow" style={{ marginBottom: 6 }}>Monthly bills</p>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{formatMoney(monthlyTotal, currency)}</div>
          <span className="tiny muted">{bills.filter((b) => b.confirmed).length} tracked</span>
        </div>
        <div className="card grow">
          <p className="eyebrow" style={{ marginBottom: 6 }}>Next renewal</p>
          {nextRenewal ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{nextRenewal.provider}</div>
              <span className="tiny muted">{nextRenewal.renewalDate}</span>
            </>
          ) : (
            <span className="small muted">None tracked</span>
          )}
        </div>
      </div>

      <div className="divider" />

      <button
        className="btn btn-ghost"
        onClick={async () => {
          await fetch('/api/digest/generate', { method: 'POST' });
          trackClient('nightly_run_simulated', { where: 'home' });
          load();
        }}
      >
        ↻ Simulate tonight&apos;s 2am run
      </button>
      <p className="tiny muted center" style={{ marginTop: 8 }}>
        Demo control — reruns the nightly digest job for your household.
      </p>

      <Link href="/app/data" className="card row between" style={{ marginTop: 18, textDecoration: 'none' }}>
        <div>
          <h3 style={{ marginBottom: 2 }}>🔒 Your data, fully transparent</h3>
          <span className="small muted">See exactly what GiGi did with your data</span>
        </div>
        <span className="pill">Open →</span>
      </Link>

      <p className="tiny muted center" style={{ marginTop: 18 }}>
        <Link href="/app/metrics" className="link">Founder metrics</Link>
      </p>
    </div>
  );
}
