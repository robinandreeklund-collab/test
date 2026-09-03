'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackClient } from '@/lib/analytics';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState<'household' | 'company' | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    setError('');
    if (!segment) return;
    setBusy(true);
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, segment, source: 'landing' }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Something went wrong.');
      return;
    }
    trackClient('waitlist_joined_client', { segment });
    setDone(true);
  }

  return (
    <div className="screen pad-bottom-sm">
      <div className="row between" style={{ marginBottom: 28 }}>
        <span className="wordmark" style={{ fontSize: 22 }}>GiGi</span>
        <Link href="/onboarding" className="pill brand">Try the demo →</Link>
      </div>

      <p className="eyebrow" style={{ marginBottom: 10 }}>Your household chief of staff</p>
      <h1 style={{ fontSize: 30 }}>The mental load, quietly handled.</h1>
      <p style={{ fontSize: 16 }}>
        GiGi watches the admin so you don&apos;t have to. One 7am note, never more than
        four things, each a single tap to approve. No noise on the calm days.
      </p>

      <div className="card" style={{ marginTop: 20 }}>
        {done ? (
          <div className="center stack">
            <div style={{ fontSize: 34 }}>✓</div>
            <h3>You&apos;re on the list</h3>
            <p className="small" style={{ margin: 0 }}>
              {segment === 'company'
                ? 'We&apos;ll be in touch about the employer benefit.'
                : 'We&apos;ll invite you as beta spots open.'}
            </p>
            <Link href="/onboarding" className="btn btn-primary" style={{ marginTop: 8 }}>
              Meanwhile, try the demo
            </Link>
          </div>
        ) : (
          <div className="stack">
            <h3>Join the private beta</h3>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <div>
              <span className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                This is for…
              </span>
              <div className="choices">
                <button
                  className={`choice ${segment === 'household' ? 'selected' : ''}`}
                  onClick={() => setSegment('household')}
                >
                  My household
                </button>
                <button
                  className={`choice ${segment === 'company' ? 'selected' : ''}`}
                  onClick={() => setSegment('company')}
                >
                  My company (benefit)
                </button>
              </div>
            </div>
            {error && <p className="small" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
            <button className="btn btn-primary" disabled={!email || !segment || busy} onClick={join}>
              {busy ? 'Joining…' : 'Request an invite'}
            </button>
          </div>
        )}
      </div>

      <div className="stack" style={{ marginTop: 24 }}>
        <Feature title="Bills, watched" body="GiGi tracks renewals and finds you a better deal before the price creeps up." />
        <Feature title="School, never missed" body="Forms, kit days and payments surfaced the morning they matter." />
        <Feature title="You always decide" body="GiGi proposes; nothing happens without your tap. Read-only by default." />
      </div>

      <p className="tiny muted center" style={{ marginTop: 26 }}>
        Coming soon: clean groceries · supplements · beauty
      </p>
      <p className="tiny muted center">
        <Link href="/privacy" className="link">Privacy</Link> · UK &amp; EU data only
      </p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="dot upcoming" style={{ marginTop: 7 }} />
      <div>
        <h3 style={{ marginBottom: 2 }}>{title}</h3>
        <p className="small" style={{ margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}
