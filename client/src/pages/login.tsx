/**
 * Login Page
 *
 * User authentication with email/password.
 * Features random wallpaper backgrounds and modern UI.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';

// Available wallpapers
const WALLPAPERS = [
  '/wallpapers/background1.png',
  '/wallpapers/background2.png',
  '/wallpapers/background3.jpeg',
  '/wallpapers/background4.jpeg',
  '/wallpapers/background5.jpeg',
  '/wallpapers/Background6.jpeg',
  '/wallpapers/Background7.jpeg',
  '/wallpapers/background8.avif',
  '/wallpapers/background9.jpg',
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, loading: authLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Select a random wallpaper on mount
  const randomWallpaper = useMemo(() => {
    const index = Math.floor(Math.random() * WALLPAPERS.length);
    return WALLPAPERS[index];
  }, []);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = randomWallpaper;
    img.onload = () => setImageLoaded(true);
  }, [randomWallpaper]);

  // Check for session expired flag (set by useSessionTimeout on auto-logout)
  useEffect(() => {
    if (sessionStorage.getItem('nexxus_session_expired') === 'true') {
      setSessionExpired(true);
      sessionStorage.removeItem('nexxus_session_expired');
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setLocation('/');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      // Redirect handled by useEffect
    } catch (err) {
      // Error handled by AuthContext
      console.error('Login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="text-white/60">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background wallpaper */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${randomWallpaper})` }}
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Login container */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Login card with glass effect - includes branding */}
        <div
          className="rounded-2xl px-6 py-8 sm:px-10 sm:py-12 shadow-2xl relative"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.6),
              0 0 40px rgba(100, 180, 255, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
          }}
        >
          {/* Beta Label */}
          <div
            className="absolute top-4 right-4 text-sm font-medium"
            style={{ color: '#F87171' }}
            data-testid="label-beta"
          >
            Beta
          </div>

          {/* Branding */}
          <div className="text-center mb-8">
            <h1
              className="text-6xl font-bold tracking-tight mb-2"
              style={{
                color: 'white',
                textShadow: `
                  0 0 20px rgba(100, 180, 255, 0.8),
                  0 0 40px rgba(100, 180, 255, 0.6),
                  0 0 60px rgba(100, 180, 255, 0.4),
                  0 4px 8px rgba(0, 0, 0, 0.4)
                `,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              Nexxus
            </h1>
            <p
              className="text-xl font-light tracking-wide"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              Customer portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {sessionExpired && (
              <Alert
                className="bg-amber-500/20 border-amber-500/40 text-amber-200"
                data-testid="alert-session-expired"
              >
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your session has expired. Please sign in again.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/40 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSessionExpired(false); }}
                disabled={isSubmitting}
                required
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400/60 focus:ring-blue-400/30 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setSessionExpired(false); }}
                disabled={isSubmitting}
                required
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400/60 focus:ring-blue-400/30 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-lg mt-2"
              disabled={isSubmitting || !email || !password}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <div className="text-center mt-4">
              <Link href="/forgot-password" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              By <span style={{ fontFamily: 'Arial, sans-serif', textTransform: 'lowercase' as const }}>huminic</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
