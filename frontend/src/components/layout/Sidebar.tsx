"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Inbox,
  Building2,
  Tag,
  Brain,
  Quote,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/search', icon: Search },
  // { label: 'Inbox', href: '/inbox', icon: Inbox },
];

const metricsNavItems: NavItem[] = [
  { label: 'Industry', href: '/metrics/industry', icon: Building2 },
  { label: 'Topic', href: '/metrics/topic', icon: Tag },
  { label: 'Model', href: '/metrics/model', icon: Brain },
  { label: 'Citation', href: '/metrics/citation', icon: Quote },
  { label: 'Improve', href: '/metrics/improve', icon: TrendingUp },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  const NavLink = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    
    return (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'focus-ring',
          isActive 
            ? 'bg-accent/10 text-accent' 
            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
          isChild && 'pl-10',
          collapsed && !isChild && 'justify-center px-2'
        )}
      >
        <Icon className={cn(
          'w-5 h-5 flex-shrink-0 transition-transform duration-200',
          isActive && 'text-accent',
          'group-hover:scale-105'
        )} />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-sm font-medium whitespace-nowrap',
                isActive && 'text-accent'
              )}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {isActive && !collapsed && (
          <motion.div
            layoutId="activeIndicator"
            className="ml-auto w-1 h-1 rounded-full bg-accent"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'bg-sidebar-background border-r border-sidebar-border',
        'flex flex-col',
        className
      )}
    >
      <div className={cn(
        'flex items-center gap-3 px-4 py-4 border-b border-sidebar-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <span className="font-semibold text-sidebar-foreground tracking-tight">Visitrack</span>
              <span className="ml-1 text-xs text-muted-foreground">AI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2"
            >
              Main
            </motion.p>
          )}
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2"
            >
              Metrics
            </motion.p>
          )}
          {metricsNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
            'transition-colors duration-200 focus-ring',
            collapsed && 'justify-center px-2'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
