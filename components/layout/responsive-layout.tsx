'use client';

import { useState, useEffect } from 'react';
import { MobileNavigation } from '@/components/mobile/mobile-navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  headerActions?: React.ReactNode;
  mobileProjectTabs?: boolean;
  className?: string;
}

export function ResponsiveLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backUrl = '/dashboard',
  headerActions,
  mobileProjectTabs = false,
  className = ''
}: ResponsiveLayoutProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Mobile Header */}
      <header className="md:hidden border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <MobileNavigation projectTabs={mobileProjectTabs} />
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push(backUrl)}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="font-semibold text-sm truncate">{title}</h1>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.push(backUrl)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                {title && <h1 className="text-xl font-bold">{title}</h1>}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-4">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${isMobile ? 'p-4' : 'container mx-auto px-4 py-6'}`}>
        {children}
      </main>
    </div>
  );
}

// Hook for responsive breakpoints
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    breakpoint
  };
}

// Mobile-optimized card component
export function MobileCard({ 
  children, 
  className = '',
  padding = 'p-4'
}: { 
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`bg-card border rounded-lg ${padding} ${className} md:shadow-sm`}>
      {children}
    </div>
  );
}

// Mobile-optimized grid
export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'gap-4',
  className = ''
}: {
  children: React.ReactNode;
  cols?: { mobile: number; tablet: number; desktop: number };
  gap?: string;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop} ${gap} ${className}`}>
      {children}
    </div>
  );
}

// Mobile-optimized tabs
export function MobileTabs({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  return (
    <div className={`md:hidden ${className}`}>
      <div className="flex overflow-x-auto scrollbar-hide border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}