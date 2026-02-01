'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthPage } from './auth-page';
import { UserTypeSelection } from './user-type-selection';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireUserType?: boolean;
}

export function ProtectedRoute({ children, requireUserType = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, show auth page
  if (!user) {
    return <AuthPage />;
  }

  // If user exists but no user type selected and it's required, show user type selection
  if (requireUserType && !user.userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <UserTypeSelection />
      </div>
    );
  }

  // User is authenticated and has required data, show protected content
  return <>{children}</>;
}