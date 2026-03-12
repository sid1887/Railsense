/**
 * Global Navbar Component
 * Sticky navigation with breadcrumbs and page indicator
 */
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Generate breadcrumbs based on current path
  useEffect(() => {
    const segments = pathname.split('/').filter((s) => s);
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    segments.forEach((segment, i) => {
      currentPath += `/${segment}`;
      let label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Special case for train numbers
      if (segment === 'train' && segments[i + 1]) {
        label = `Train ${segments[i + 1]}`;
      }

      if (i !== segments.length - 1 || segment !== 'train') {
        crumbs.push({ label, href: currentPath });
      }
    });

    setBreadcrumbs(crumbs);
  }, [pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-dark-bg/80 backdrop-blur-xl border-b border-accent-blue/20'
          : 'bg-transparent'
      }`}
    >
      {/* Gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent-blue to-transparent opacity-20" />

      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-cyan hover:opacity-80 transition-opacity"
          >
            RailSense
          </Link>

          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                {i > 0 && <span className="text-text-secondary">/</span>}
                <Link
                  href={crumb.href}
                  className={`transition-colors ${
                    pathname === crumb.href
                      ? 'text-accent-blue font-semibold'
                      : 'text-text-secondary hover:text-accent-blue'
                  }`}
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </Link>
            <button className="p-2 rounded-lg hover:bg-dark-card transition-colors">
              <svg className="w-5 h-5 text-text-secondary hover:text-accent-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m6.364 1.636l-.707-.707M21 12h-1m1.364 6.364l-.707-.707M12 21v1m-6.364-1.636l.707.707M3 12h1M4.636 4.636l.707.707" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
