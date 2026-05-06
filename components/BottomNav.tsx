"use client";

import { Home, Ticket, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/cinemas', icon: MapPin, label: 'Cinemas' },
  { href: '/tickets', icon: Ticket, label: 'Tickets' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-blue-900/30 backdrop-blur-lg border border-white/20 rounded-2xl py-3 px-6 z-50 shadow-2xl">
      <ul className="flex justify-between items-center">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => {
                  if (href === '/') window.dispatchEvent(new Event('go-home'));
                }}
                className="flex flex-col items-center gap-1 group relative"
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                )}
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    active
                      ? 'text-cyan-300'
                      : 'text-white/60 group-hover:text-cyan-300'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? 'text-cyan-300' : 'text-white/60 group-hover:text-cyan-300'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}