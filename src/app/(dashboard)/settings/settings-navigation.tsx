'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function SettingsNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      title: 'Account',
      href: '/settings/account',
      icon: <User className="h-5 w-5 mr-2" />,
    },
    {
      title: 'Preferences',
      href: '/settings/preferences',
      icon: <Palette className="h-5 w-5 mr-2" />,
    },
    {
      title: 'Notifications',
      href: '/settings/notifications',
      icon: <Bell className="h-5 w-5 mr-2" />,
    },
    {
      title: 'Security',
      href: '/settings/security',
      icon: <Shield className="h-5 w-5 mr-2" />,
    },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-md",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 