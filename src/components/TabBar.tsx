'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const ALL_TABS = [
  { href: '/app/digest', label: 'Today', glyph: '◔', cap: null },
  { href: '/app/bills', label: 'Bills', glyph: '≡', cap: 'viewFinances' as const },
  { href: '/app', label: 'Home', glyph: '⌂', cap: null },
  { href: '/app/settings', label: 'Settings', glyph: '⚙', cap: null },
];

export default function TabBar() {
  const path = usePathname();
  const [caps, setCaps] = useState<string[] | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((j) => setCaps(j.capabilities ?? [])).catch(() => setCaps([]));
  }, []);

  // Until we know the role, show finance tabs (owner/adult are the common case);
  // once caps load, teens lose the Bills tab.
  const tabs = ALL_TABS.filter((t) => !t.cap || caps === null || caps.includes(t.cap));

  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const active = t.href === '/app' ? path === '/app' : path.startsWith(t.href);
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
