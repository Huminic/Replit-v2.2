/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email.
 * Features random wallpaper backgrounds and modern UI matching login page.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

// Available wallpapers (same as login page)
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

async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send reset email');
  }

  return response.json();
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    mutation.mutate(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background wallpaper */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${randomWallpaper})` }}
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Container */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Card with glass effect */}
        <div
          className="rounded-2xl px-10 py-12 shadow-2xl relative"
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
          {/* Back to login link */}
          <Link href="/login">
            <a className="absolute top-4 left-4 flex items-center gap-1 text-white/60 hover:text-white/90 transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </a>
          </Link>

          {/* Branding */}
          <div className="text-center mb-8">
            <h1
              className="text-5xl font-bold tracking-tight mb-2"
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
              className="text-lg font-light tracking-wide"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              Reset your password
            </p>
          </div>

          {mutation.isSuccess ? (
            /* Success state */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                  }}
                >
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
                <p className="text-white/70 text-sm">
                  If an account exists for <span className="text-white font-medium">{email}</span>,
                  you will receive password reset instructions.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Return to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-6">
              {mutation.isError && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/40 text-red-200">
                  <AlertDescription>
                    {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-white/70 text-sm text-center">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mutation.isPending}
                  required
                  autoFocus
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400/60 focus:ring-blue-400/30 rounded-lg"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-lg mt-2"
                disabled={mutation.isPending || !email}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  boxShadow: mutation.isPending ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset instructions'
                )}
              </Button>
            </form>
          )}

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
