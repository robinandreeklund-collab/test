'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PhoneFrame from '@/components/PhoneFrame';
import { trackClient } from '@/lib/analytics';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Could not create your account.');
      return;
    }
    trackClient('signup_success');
    // New account → straight into onboarding.
    router.push('/onboarding');
  }

  return (
    <PhoneFrame>
      <div className="screen">
        <div className="center" style={{ marginBottom: 24, marginTop: 12 }}>
          <span className="logo-mark" style={{ display: 'inline-grid', width: 44, height: 44, fontSize: 22 }}>G</span>
          <h1 style={{ marginTop: 14 }}>Create your account</h1>
          <p className="small" style={{ margin: 0 }}>Two weeks free. No card needed.</p>
        </div>

        <div className="card stack">
          <label className="field" style={{ marginBottom: 0 }}>
            <span>First name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kerstin" />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Password <span className="muted tiny">— at least 6 characters</span></span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
          </label>
          {error && <p className="small" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <button className="btn btn-primary" disabled={!name || !email || password.length < 6 || busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create account →'}
          </button>
        </div>

        <p className="small center" style={{ marginTop: 16 }}>
          Already have an account? <Link href="/login" className="link">Log in</Link>
        </p>
        <p className="tiny muted center" style={{ marginTop: 14 }}>
          By continuing you agree to our <Link href="/privacy" className="link">privacy policy</Link>. UK &amp; EU data only.
        </p>
      </div>
    </PhoneFrame>
  );
}
