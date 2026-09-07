'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { trackClient } from '@/lib/analytics';

export default function Voice() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SR = (typeof window !== 'undefined') && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.lang = 'en-GB';
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((res: any) => res[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) { ask(t); }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    trackClient('voice_viewed');
    return () => { try { r.stop(); } catch {} speechSynthesis?.cancel?.(); };
  }, []);

  function toggle() {
    const r = recogRef.current;
    if (!r) return;
    if (listening) { r.stop(); setListening(false); return; }
    setReply(''); setTranscript('');
    try { r.start(); setListening(true); trackClient('voice_listen'); } catch {}
  }

  async function ask(message: string) {
    if (!message.trim()) return;
    setBusy(true); setReply('');
    const res = await fetch('/api/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    const text = j.reply ?? 'Sorry, something went wrong.';
    setReply(text);
    speak(text);
  }

  function speak(text: string) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      const v = speechSynthesis.getVoices().find((x) => /en-GB/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch {}
  }

  return (
    <div className="screen center">
      <div className="row between" style={{ marginBottom: 6, width: '100%' }}>
        <h1 style={{ margin: 0 }}>Talk to GiGi</h1>
        <Link href="/app" className="pill">← Home</Link>
      </div>
      <p className="small muted">Ask what&apos;s on today, what renews soon, or how much you&apos;ve saved. GiGi answers out loud — and never acts without your tap.</p>

      {supported ? (
        <>
          <button
            onClick={toggle}
            aria-label={listening ? 'Stop listening' : 'Start talking'}
            style={{
              width: 132, height: 132, borderRadius: '50%', border: 'none', cursor: 'pointer',
              margin: '30px auto 10px', display: 'grid', placeItems: 'center',
              background: listening ? 'var(--today)' : 'var(--brand)', color: '#fff',
              fontSize: 44, boxShadow: 'var(--shadow)',
              transform: listening ? 'scale(1.05)' : 'none', transition: 'transform .15s ease, background .2s ease',
            }}
          >
            🎙
          </button>
          <p className="small" style={{ fontWeight: 600 }}>{listening ? 'Listening… tap to stop' : 'Tap to talk'}</p>
        </>
      ) : (
        <div className="card" style={{ marginTop: 16, textAlign: 'left' }}>
          <p className="small" style={{ margin: 0 }}>
            Your browser doesn&apos;t support voice input (works best in Chrome). You can still type below.
          </p>
        </div>
      )}

      {transcript && (
        <div className="card" style={{ marginTop: 10, textAlign: 'left' }}>
          <p className="tiny muted" style={{ margin: 0 }}>You</p>
          <p style={{ margin: '4px 0 0' }}>{transcript}</p>
        </div>
      )}

      {(busy || reply) && (
        <div className="card" style={{ marginTop: 10, textAlign: 'left', borderColor: 'var(--brand)' }}>
          <p className="tiny muted" style={{ margin: 0 }}>GiGi</p>
          <p style={{ margin: '4px 0 0' }}>{busy ? '…' : reply}</p>
        </div>
      )}

      <div className="row" style={{ gap: 8, marginTop: 16, width: '100%' }}>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="…or type a question"
          onKeyDown={(e) => { if (e.key === 'Enter' && typed.trim()) { ask(typed); setTranscript(typed); setTyped(''); } }} />
        <button className="btn btn-primary btn-sm" disabled={!typed.trim() || busy} onClick={() => { ask(typed); setTranscript(typed); setTyped(''); }}>Ask</button>
      </div>

      <p className="tiny muted" style={{ marginTop: 16 }}>
        Voice questions are answered by GiGi&apos;s AI in the EU — and recorded in your <Link href="/app/data" className="link">data log</Link>.
      </p>
    </div>
  );
}
