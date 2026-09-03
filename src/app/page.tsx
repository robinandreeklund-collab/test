'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackClient } from '@/lib/analytics';

export default function Landing() {
  return (
    <div className="site">
      <Header />
      <main>
        <Hero />
        <WhatWeDo />
        <Waitlist />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="logo">
        <span className="logo-mark">G</span>
        <span className="logo-word">GiGi</span>
      </div>
      <nav className="site-nav">
        <a href="#what">What we do</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div className="spacer" />
      <a href="#waitlist" className="btn btn-black btn-sm" style={{ padding: '10px 18px' }}>
        Join the waitlist →
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section className="container hero">
      <div>
        <span className="hero-eyebrow">GiGi — your proactive chief of staff for household admin</span>
        <h1>Mental load<br /><em>lifted.</em></h1>
        <p className="hero-lead">
          One note every morning with what actually needs managing — bills, kids&apos;
          schedules, family logistics. Tell GiGi what she can take off your plate, and
          she&apos;ll handle it on your behalf, with your approval.
        </p>
        <div className="hero-cta-row">
          <a href="#waitlist" className="btn btn-black btn-wide" style={{ width: 'auto' }}>
            Join the waitlist →
          </a>
          <Link href="/onboarding" className="link" style={{ fontSize: 15 }}>
            or try the demo
          </Link>
        </div>
        <div className="hero-cta-row" style={{ marginTop: 20 }}>
          <div className="avatars">
            <span style={{ background: '#3c5a47' }}>SL</span>
            <span style={{ background: '#9a6b3f' }}>MF</span>
            <span style={{ background: '#5b6cc4' }}>JK</span>
            <span style={{ background: '#8a4a2a' }}>AW</span>
          </div>
          <span className="small muted">Joined by early households already using GiGi</span>
        </div>
      </div>

      <PhoneMock />
    </section>
  );
}

// Static, non-interactive replica of the digest — the hero product shot.
function PhoneMock() {
  return (
    <div className="mock">
      <div className="mock-float tl">
        <div className="eyebrow">This week</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>£168</div>
        <div className="muted" style={{ fontSize: 11 }}>saved on broadband</div>
      </div>
      <div className="mock-float bl">
        <div className="eyebrow">Reminder</div>
        <div style={{ fontWeight: 700 }}>Book babysitter</div>
        <div className="muted" style={{ fontSize: 11 }}>Thu 7pm</div>
      </div>

      <div className="mock-phone">
        <div className="mock-screen">
          <div className="eyebrow" style={{ fontSize: 9 }}>GiGi · Thursday</div>
          <div className="wordmark" style={{ fontSize: 19, margin: '2px 0' }}>Good morning, Sarah</div>
          <div className="muted" style={{ fontSize: 11, marginBottom: 12 }}>3 things today</div>

          <div className="mockrow" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '8px 12px', marginBottom: 12 }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--brand)', display: 'inline-grid', placeItems: 'center', color: '#fff', fontSize: 9 }}>◉</span>
            <span className="muted" style={{ fontSize: 11 }}>What can I help with today?</span>
          </div>

          <div className="banner ok" style={{ fontSize: 10, padding: '8px 10px', marginBottom: 12 }}>
            ● GiGi is running. Bills, school &amp; travel monitored around the clock.
          </div>

          <div className="mockrow between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <b style={{ fontSize: 11 }}>Your impact</b>
            <span className="muted" style={{ fontSize: 9 }}>since you joined</span>
          </div>
          <div className="mockrow" style={{ marginBottom: 14 }}>
            <div className="mock-stat"><b>£412</b><span>money saved</span></div>
            <div className="mock-stat"><b>18 hrs</b><span>time saved</span></div>
            <div className="mock-stat"><b>47</b><span>tasks managed</span></div>
          </div>

          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>Today</div>
          <MockItem dot="today" label="Ella's trip consent due today" badge="DUE" badgeBg="#f6ded6" badgeColor="#c4573b" />
          <MockItem dot="upcoming" label="Broadband deal — save £168/yr" badge="READY" badgeBg="var(--brand-soft)" badgeColor="var(--brand-ink)" />
          <MockItem dot="soon" label="Book a babysitter — Thu 7pm" badge="BOOK" badgeBg="#e6e9f7" badgeColor="#5b6cc4" />

          <div className="btn btn-primary" style={{ marginTop: 12, padding: '11px', fontSize: 12 }}>
            Approve broadband switch →
          </div>
        </div>
      </div>
    </div>
  );
}

function MockItem({ dot, label, badge, badgeBg, badgeColor }: { dot: string; label: string; badge: string; badgeBg: string; badgeColor: string }) {
  return (
    <div className="mockrow" style={{ justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
      <div className="mockrow" style={{ gap: 7 }}>
        <span className={`dot ${dot}`} style={{ width: 6, height: 6 }} />
        <span style={{ fontSize: 11 }}>{label}</span>
      </div>
      <span className="mock-badge" style={{ background: badgeBg, color: badgeColor }}>{badge}</span>
    </div>
  );
}

function WhatWeDo() {
  return (
    <section id="what" className="section">
      <div className="container">
        <span className="hero-eyebrow">What we do</span>
        <h2>Three quiet jobs, handled every day.</h2>
        <div className="grid-3">
          <Feature glyph="💷" title="Bills, watched" body="GiGi tracks every renewal and finds a better deal before the price creeps up. One tap and the switch is done for you." />
          <Feature glyph="🎒" title="School, never missed" body="Forms, kit days, payments and trips — surfaced the morning they matter, pulled straight from the emails you forward." />
          <Feature glyph="🌿" title="You always decide" body="GiGi proposes; nothing happens without your tap. Read-only by default — she can never send, delete or change a thing." />
        </div>
      </div>
    </section>
  );
}

function Feature({ glyph, title, body }: { glyph: string; title: string; body: string }) {
  return (
    <div className="feature-card">
      <div className="glyph">{glyph}</div>
      <h3>{title}</h3>
      <p style={{ margin: 0 }}>{body}</p>
    </div>
  );
}

function Waitlist() {
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
    <section id="waitlist" className="section section-alt">
      <div className="container waitlist-wrap">
        <span className="hero-eyebrow">Private beta</span>
        <h2>Join the waitlist.</h2>
        <p>50 households, personally onboarded. We&apos;ll invite you as spots open.</p>

        <div className="waitlist-card">
          {done ? (
            <div className="center stack">
              <div style={{ fontSize: 34 }}>✓</div>
              <h3>You&apos;re on the list</h3>
              <p className="small" style={{ margin: 0 }}>
                {segment === 'company'
                  ? "We'll be in touch about the employer benefit."
                  : "We'll invite you as beta spots open."}
              </p>
              <Link href="/onboarding" className="btn btn-black" style={{ marginTop: 8 }}>
                Meanwhile, try the demo →
              </Link>
            </div>
          ) : (
            <div className="stack">
              <label className="field" style={{ marginBottom: 0 }}>
                <span>Email</span>
                <input type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
              </label>
              <div>
                <span className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>This is for…</span>
                <div className="choices">
                  <button className={`choice ${segment === 'household' ? 'selected' : ''}`} onClick={() => setSegment('household')}>My household</button>
                  <button className={`choice ${segment === 'company' ? 'selected' : ''}`} onClick={() => setSegment('company')}>My company (benefit)</button>
                </div>
              </div>
              {error && <p className="small" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
              <button className="btn btn-black" disabled={!email || !segment || busy} onClick={join}>
                {busy ? 'Joining…' : 'Request an invite →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    ['Do you read my whole inbox?', 'No. GiGi never connects to your email account. You forward the senders you want watched to a private GiGi address — she can only ever see what you send her, and nothing else.'],
    ['Does GiGi change things without asking?', 'Never. Every external action waits for an explicit tap. Read-only by default: GiGi can propose a switch, but she cannot send, delete or modify anything on her own.'],
    ['Where does my data live?', 'In the EU/UK only, and no email content is written to logs. One tap deletes everything, completed within 30 days and confirmed by email.'],
    ['What does it cost?', 'The beta is free. When GiGi executes a bill switch that saves you money, a small success fee applies on broadband, energy and mobile only — never on insurance.'],
  ];
  return (
    <section id="faq" className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <span className="hero-eyebrow">FAQ</span>
        <h2>The questions everyone asks first.</h2>
        <div style={{ marginTop: 20 }}>
          {items.map(([q, a]) => (
            <div className="faq-item" key={q}>
              <h3>{q}</h3>
              <p style={{ margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container row between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="logo">
          <span className="logo-mark" style={{ width: 28, height: 28, fontSize: 15 }}>G</span>
          <span className="logo-word" style={{ fontSize: 18 }}>GiGi</span>
        </div>
        <span className="small">Coming soon: clean groceries · supplements · beauty</span>
        <span className="small">
          <Link href="/privacy" className="link">Privacy</Link> · UK &amp; EU data only
        </span>
      </div>
    </footer>
  );
}
