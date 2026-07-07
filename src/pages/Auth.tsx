import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User as UserIcon, Loader2, CheckCircle2 } from 'lucide-react';
import heroImage from '@/assets/hero-town.jpg';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-sent';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Redirect when authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Clear errors when switching views
  useEffect(() => {
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
  }, [view]);

  // ─── Google OAuth Sign-In ───
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Forces account chooser
          },
        },
      });
      if (error) {
        toast.error('Google sign-in failed', {
          description: error.message,
        });
      }
    } catch (error: any) {
      toast.error('Could not connect to Google', {
        description: 'Please try again or use email sign-in.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Email/Password Sign-In ───
  const handleLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Email not confirmed', {
            description: 'Please check your inbox and click the confirmation link we sent you.',
            duration: 8000,
            action: {
              label: 'Resend',
              onClick: () => handleResendConfirmation(),
            },
          });
        } else if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('Invalid')
        ) {
          toast.error('Invalid email or password', {
            description: 'Please double-check your credentials and try again.',
          });
          setFieldErrors({ password: 'Invalid email or password' });
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Email/Password Sign-Up ───
  const handleSignUp = async () => {
    const validation = signupSchema.safeParse({ email, password, confirmPassword, fullName });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered', {
            description: 'Try signing in instead, or use "Forgot password" to reset it.',
          });
          setFieldErrors({ email: 'This email is already registered' });
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.session) {
        // Auto-confirmed (dev mode or specific config)
        toast.success('Account created! Welcome to Re:Local');
      } else if (data.user) {
        // Email confirmation required
        toast.success('Account created!', {
          description: `We sent a confirmation link to ${email}. Please check your inbox.`,
          duration: 10000,
        });
        setView('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password ───
  const handleForgotPassword = async () => {
    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldErrors({ email: validation.error.errors[0].message });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error('Could not send reset email', { description: error.message });
        return;
      }

      setView('reset-sent');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend Confirmation Email ───
  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error('Could not resend email', { description: error.message });
      } else {
        toast.success('Confirmation email resent!', {
          description: `Check your inbox at ${email}`,
        });
      }
    } catch {
      toast.error('Failed to resend confirmation email');
    }
  };

  // ─── Form Submit Handler ───
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'login') handleLogin();
    else if (view === 'signup') handleSignUp();
    else if (view === 'forgot-password') handleForgotPassword();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Re:Local Community"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 rounded-full hover:bg-card/80"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <Card className="w-full max-w-md p-8 space-y-6 relative z-10 shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
        {/* ─── Header ─── */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Re:Local
          </h1>
          <p className="text-muted-foreground text-sm">
            {view === 'login' && 'Welcome back! Sign in to continue'}
            {view === 'signup' && 'Create your account to get started'}
            {view === 'forgot-password' && 'Enter your email to reset your password'}
            {view === 'reset-sent' && 'Check your email'}
          </p>
        </div>

        {/* ─── Reset Sent View ─── */}
        {view === 'reset-sent' ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Password reset email sent</h2>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>.
                Please check your inbox (and spam folder).
              </p>
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setView('login');
                  setPassword('');
                }}
              >
                Back to Sign In
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={handleForgotPassword}
              >
                Didn't receive it? Click to resend
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ─── Google Sign-In ─── */}
            {(view === 'login' || view === 'signup') && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-sm font-medium gap-3 hover:bg-accent/50 transition-all"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
                  </div>
                </div>
              </>
            )}

            {/* ─── Email/Password Form ─── */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (sign-up only) */}
              {view === 'signup' && (
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                      }}
                      placeholder="Enter your full name"
                      className={`pl-10 h-11 ${fieldErrors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      autoComplete="name"
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="you@example.com"
                    className={`pl-10 h-11 ${fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password (login & signup) */}
              {(view === 'login' || view === 'signup') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => setView('forgot-password')}
                        className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder={view === 'signup' ? 'Min 6 chars, letters & numbers' : 'Enter your password'}
                      className={`pl-10 pr-10 h-11 ${fieldErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>
              )}

              {/* Confirm Password (signup only) */}
              {view === 'signup' && (
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter your password"
                      className={`pl-10 pr-10 h-11 ${fieldErrors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {view === 'login' && 'Signing in...'}
                    {view === 'signup' && 'Creating account...'}
                    {view === 'forgot-password' && 'Sending reset link...'}
                  </>
                ) : (
                  <>
                    {view === 'login' && 'Sign In'}
                    {view === 'signup' && 'Create Account'}
                    {view === 'forgot-password' && 'Send Reset Link'}
                  </>
                )}
              </Button>
            </form>

            {/* ─── Footer Links ─── */}
            <div className="space-y-3 text-center text-sm">
              {view === 'login' && (
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              )}
              {view === 'signup' && (
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              )}
              {view === 'forgot-password' && (
                <p className="text-muted-foreground">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Auth;
