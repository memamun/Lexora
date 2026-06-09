import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { PremiumLoginIcon as LogIn } from '@/components/ui/PremiumIcons';
import { Eye, EyeOff } from 'lucide-react';
import LexoraLogo from '@/components/ui/LexoraLogo';

export default function LoginPage() {
  const { isAuthenticated, loginWithGoogle, loginWithEmail, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <LexoraLogo className="w-16 h-20 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.35)]" isLoading={true} />
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80 animate-pulse">
            Authenticating Synapse...
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await loginWithEmail(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-6 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm mx-auto space-y-8"
      >
        <div className="flex flex-col items-center gap-4">
            <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_4px_12px_rgba(99,102,241,0.25)]" animated={true} />
            <div className="text-center">
              <h1 className="font-serif text-xl font-bold text-foreground">Welcome back</h1>
              <p className="text-xs text-muted-foreground mt-1">Sign in to continue your progress</p>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-secondary/40 border border-border/80 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-secondary/40 border border-border/80 text-foreground rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-secondary/40 border border-border/80 text-foreground text-sm font-semibold hover:bg-secondary/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>
      </motion.div>
    </div>
  );
}
