/**
 * Reset Password Page
 *
 * Allows users to set a new password using a reset token.
 * Features random wallpaper backgrounds and modern UI matching login page.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearch } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff, Clock } from 'lucide-react';

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

interface ResetPasswordRequest {
  token: string;
  password: string;
}

async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to reset password');
  }

  return response.json();
}

export default function ResetPasswordPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds

  // 15-minute token expiration countdown (AC 11.1.3)
  useEffect(() => {
    if (!token || tokenExpired) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTokenExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [token, tokenExpired]);

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    mutationFn: resetPassword,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!token) {
      setValidationError('Invalid or missing reset token');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setValidationError('Password must contain at least 1 uppercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setValidationError('Password must contain at least 1 number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setValidationError('Password must contain at least 1 special character');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    mutation.mutate({ token, password });
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Overall password strength: count how many criteria are met (out of 4 core rules)
  const strengthScore = [passwordLongEnough, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel = strengthScore === 0 ? '' : strengthScore <= 1 ? 'Weak' : strengthScore <= 2 ? 'Fair' : strengthScore <= 3 ? 'Good' : 'Strong';
  const strengthColor = strengthScore <= 1 ? 'bg-red-500' : strengthScore <= 2 ? 'bg-orange-500' : strengthScore <= 3 ? 'bg-yellow-500' : 'bg-green-500';

  // Check if token is missing or invalid
  const noToken = !token;

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
              Set new password
            </p>
          </div>

          {noToken || tokenExpired ? (
            /* Invalid/missing/expired token state */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}
                >
                  {tokenExpired ? (
                    <Clock className="h-8 w-8 text-red-400" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-400" />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {tokenExpired ? 'Reset link expired' : 'Invalid reset link'}
                </h2>
                <p className="text-white/70 text-sm">
                  {tokenExpired
                    ? 'This password reset link has expired (15 minute limit). Please request a new one.'
                    : 'This password reset link is invalid or has expired. Please request a new password reset.'}
                </p>
              </div>
              <div className="pt-4">
                <Link href="/forgot-password">
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                  >
                    Request new reset link
                  </Button>
                </Link>
              </div>
            </div>
          ) : mutation.isSuccess ? (
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
                <h2 className="text-xl font-semibold text-white mb-2">Password updated</h2>
                <p className="text-white/70 text-sm">
                  Your password has been successfully reset.
                  You can now sign in with your new password.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/login">
                  <Button
                    className="w-full h-12 text-base font-semibold rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 15-minute token expiration countdown */}
              <div className={`flex items-center justify-center gap-2 text-sm ${timeRemaining <= 120 ? 'text-red-400' : timeRemaining <= 300 ? 'text-yellow-400' : 'text-white/60'}`}>
                <Clock className="h-4 w-4" />
                <span>Link expires in {formatTimeRemaining(timeRemaining)}</span>
              </div>

              {(mutation.isError || validationError) && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/40 text-red-200">
                  <AlertDescription>
                    {validationError || (mutation.error instanceof Error ? mutation.error.message : 'An error occurred')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={mutation.isPending}
                    required
                    autoFocus
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400/60 focus:ring-blue-400/30 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80 text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={mutation.isPending}
                    required
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400/60 focus:ring-blue-400/30 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Password strength</span>
                    <span className={`text-xs font-medium ${strengthScore <= 1 ? 'text-red-400' : strengthScore <= 2 ? 'text-orange-400' : strengthScore <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strengthScore ? strengthColor : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Password requirements checklist */}
              <div className="space-y-1.5 text-sm">
                <div className={`flex items-center gap-2 ${passwordLongEnough ? 'text-green-400' : 'text-white/50'}`}>
                  {passwordLongEnough ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current" />
                  )}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-400' : 'text-white/50'}`}>
                  {hasUppercase ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current" />
                  )}
                  <span>1 uppercase letter</span>
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-400' : 'text-white/50'}`}>
                  {hasNumber ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current" />
                  )}
                  <span>1 number</span>
                </div>
                <div className={`flex items-center gap-2 ${hasSpecial ? 'text-green-400' : 'text-white/50'}`}>
                  {hasSpecial ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current" />
                  )}
                  <span>1 special character</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-green-400' : 'text-white/50'}`}>
                  {passwordsMatch ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current" />
                  )}
                  <span>Passwords match</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-lg mt-2"
                disabled={mutation.isPending || !password || !confirmPassword}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  boxShadow: mutation.isPending ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  'Reset password'
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
