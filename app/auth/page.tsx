'use client';

import { useRouter } from 'next/navigation';
import { AuthPage } from '@/components/auth/auth-page';

export default function AuthRoute() {
  const router = useRouter();

  const handleAuthComplete = () => {
    router.push('/dashboard');
  };

  return <AuthPage onComplete={handleAuthComplete} />;
}