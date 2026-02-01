'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { Github, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface SignInFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

export function SignInForm({ onToggleMode, onSuccess }: SignInFormProps) {
  const { signInWithGoogle, signInWithGithub, signInWithEmail, signInAsGuest, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error('Google sign in failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading('github');
    try {
      await signInWithGithub();
      onSuccess?.();
    } catch (error) {
      console.error('GitHub sign in failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    if (!email || !password) {
      setEmailError('Please fill in all fields');
      return;
    }

    setLoading('email');
    try {
      await signInWithEmail(email, password);
      onSuccess?.();
    } catch (error: any) {
      setEmailError(error.message || 'Failed to sign in');
    } finally {
      setLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading('guest');
    try {
      await signInAsGuest();
      onSuccess?.();
    } catch (error) {
      console.error('Guest sign in failed:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your HackMate AI account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading === 'google'}
          >
            <Mail className="mr-2 h-4 w-4" />
            {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGithubSignIn}
            disabled={loading === 'github'}
          >
            <Github className="mr-2 h-4 w-4" />
            {loading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading === 'email'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading === 'email'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {(emailError || error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {emailError || error}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading === 'email'}
          >
            {loading === 'email' ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            onClick={onToggleMode}
            className="text-sm"
          >
            Don't have an account? Sign up
          </Button>
        </div>

        <Separator />

        <Button
          variant="ghost"
          className="w-full"
          onClick={handleGuestSignIn}
          disabled={loading === 'guest'}
        >
          {loading === 'guest' ? 'Signing in...' : 'Continue as Guest'}
        </Button>
      </CardContent>
    </Card>
  );
}