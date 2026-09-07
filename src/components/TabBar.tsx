'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const ALL_TABS = [
  { href: '/app/digest', label: 'Digest', glyph: '📋', cap: null },
  { href: '/app/kids', label: 'Kids & Travel', glyph: '🎒', cap: null },
  { href: '/app/bills', label: 'Bills', glyph: '💷', cap: 'viewFinances' as const },
  { href: '/app/handover', label: 'Hand over', glyph: '🤝', cap: 'viewFinances' as const },
];

export default function TabBar() {
  const path = usePathname();
  const [caps, setCaps] = useState<string[] | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((j) => setCaps(j.capabilities ?? [])).catch(() => setCaps([]));
  }, []);

  const tabs = ALL_TABS.filter((t) => !t.cap || caps === null || caps.includes(t.cap));

  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const active = path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={active ? 'active' : ''}>
            <span className="glyph">{t.glyph}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
