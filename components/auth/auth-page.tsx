'use client';

import { useState, useEffect } from 'react';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { UserTypeSelection } from './user-type-selection';
import { useAuth } from '@/lib/auth-context';

type AuthMode = 'signin' | 'signup' | 'user-type-selection';

interface AuthPageProps {
  onComplete?: () => void;
}

export function AuthPage({ onComplete }: AuthPageProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');

  // Use useEffect to call onComplete after render is complete
  useEffect(() => {
    if (user && user.userType) {
      onComplete?.();
    }
  }, [user, onComplete]);

  // If user is authenticated but hasn't selected user type, show user type selection
  if (user && !user.userType) {
    return <UserTypeSelection onComplete={onComplete} />;
  }

  // If user is fully set up, return null (onComplete will be called in useEffect)
  if (user && user.userType) {
    return null;
  }

  const handleAuthSuccess = () => {
    // After successful auth, the useAuth hook will handle the user type selection flow
    // or call onComplete if user is fully set up
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {mode === 'signin' && (
          <SignInForm
            onToggleMode={() => setMode('signup')}
            onSuccess={handleAuthSuccess}
          />
        )}
        {mode === 'signup' && (
          <SignUpForm
            onToggleMode={() => setMode('signin')}
            onSuccess={handleAuthSuccess}
          />
        )}
        {mode === 'user-type-selection' && (
          <UserTypeSelection onComplete={onComplete} />
        )}
      </div>
    </div>
  );
}