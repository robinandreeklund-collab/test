'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/app/digest', label: 'Today', glyph: '◔' },
  { href: '/app/bills', label: 'Bills', glyph: '≡' },
  { href: '/app', label: 'Home', glyph: '⌂' },
  { href: '/app/settings', label: 'Settings', glyph: '⚙' },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
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
