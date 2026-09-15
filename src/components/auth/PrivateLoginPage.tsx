import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MechanismLogo } from '../branding/MechanismLogo';
import { FluidBackground } from './FluidBackground';
import { PhysicsLabEnvironment } from './PhysicsLabEnvironment';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2, KeyRound, ShieldCheck } from 'lucide-react';

export interface LoginSuccessPayload {
  user: {
    username: string;
    displayName: string;
  };
  token: string;
  isNewLogin: boolean;
  isFirstRunInit?: boolean;
}

interface PrivateLoginPageProps {
  onLoginSuccess: (payload: LoginSuccessPayload) => void;
}

interface FailureRoast {
  title: string;
  body: React.ReactNode;
}

const FAILURE_ROASTS: FailureRoast[] = [
  // 1st incorrect attempt
  {
    title: 'HYPOTHESIS REJECTED. 🧠',
    body: <p className="text-slate-300 font-sans text-sm sm:text-base">Your reconstruction failed.</p>,
  },
  // 2nd incorrect attempt
  {
    title: 'INCORRECT. 🧠',
    body: <p className="text-slate-300 font-sans text-sm sm:text-base">Your confidence continues to exceed your evidence.</p>,
  },
  // 3rd incorrect attempt
  {
    title: 'Nope. 🧩',
    body: (
      <div className="space-y-1.5 text-slate-300 font-sans text-sm sm:text-base">
        <p>You had a clue.</p>
        <p>You chose guessing.</p>
      </div>
    ),
  },
  // 4th incorrect attempt
  {
    title: 'INCORRECT. 🔬',
    body: (
      <div className="space-y-1.5 text-slate-300 font-sans text-sm sm:text-base">
        <p>Observation: wrong answer.</p>
        <p>Inference: your methodology needs work.</p>
      </div>
    ),
  },
  // 5th incorrect attempt
  {
    title: 'Still wrong. 🧠',
    body: <p className="text-slate-300 font-sans text-sm sm:text-base">At this point, persistence is no longer a virtue.</p>,
  },
  // 6th incorrect attempt
  {
    title: 'INCORRECT. 🤨',
    body: (
      <p className="text-slate-300 font-sans text-sm sm:text-base">
        You are repeatedly testing the same hypothesis and expecting a different result.
      </p>
    ),
  },
  // 7th incorrect attempt
  {
    title: 'INCORRECT. 📉',
    body: (
      <div className="space-y-2 text-slate-300 font-sans text-sm sm:text-base">
        <p>Your confidence appears to be increasing while your accuracy remains unchanged.</p>
        <p className="text-slate-400 font-medium">Fascinating.</p>
      </div>
    ),
  },
  // 8th incorrect attempt
  {
    title: 'HYPOTHESIS REJECTED. 🧠',
    body: (
      <div className="space-y-1.5 text-slate-300 font-sans text-sm sm:text-base">
        <p>Evidence: 0</p>
        <p>Confidence: concerningly high.</p>
      </div>
    ),
  },
  // 9th incorrect attempt
  {
    title: 'Still incorrect. 🧠',
    body: (
      <div className="space-y-2 text-slate-300 font-sans text-sm sm:text-base">
        <p>You keep trying the same approach despite repeated contradictory evidence.</p>
        <p>At this point, the password isn't the problem.</p>
        <p className="font-bold text-slate-100">Your reasoning is.</p>
      </div>
    ),
  },
  // 10th incorrect attempt
  {
    title: 'INCORRECT. 🎭',
    body: (
      <div className="space-y-2 text-slate-300 font-sans text-sm sm:text-base">
        <p>You should have realized by now:</p>
        <p className="font-bold text-slate-100">Your approach has exhausted its predictive validity.</p>
      </div>
    ),
  },
];

const FINAL_RECURRING_ROAST: FailureRoast = {
  title: 'INCORRECT CREDENTIALS. 💀',
  body: (
    <div className="space-y-2 text-slate-300 font-sans text-sm sm:text-base">
      <p>You have now demonstrated remarkable commitment to being wrong.</p>
      <p>The password has not changed.</p>
      <p>Only your confidence appears to have.</p>
      <p className="font-bold text-slate-100 pt-1">Perhaps reconsider your methodology.</p>
    </div>
  ),
};

export const PrivateLoginPage: React.FC<PrivateLoginPageProps> = ({ onLoginSuccess }) => {
  // Views: 'check_init' | 'setup' | 'login' | 'forgot_password' | 'pseudo_loading' | 'failure'
  const [view, setView] = useState<'check_init' | 'setup' | 'login' | 'forgot_password' | 'pseudo_loading' | 'failure'>('check_init');

  // Initialization check
  const [hasCheckedInit, setHasCheckedInit] = useState(false);

  // Normal login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // First-run setup state
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupRecoveryClue, setSetupRecoveryClue] = useState('');
  const [setupRememberMe, setSetupRememberMe] = useState(true);
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirm, setShowSetupConfirm] = useState(false);
  const [isSetupSubmitting, setIsSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Recovery clue state
  const [clueText, setClueText] = useState<string | null>(null);
  const [hasClue, setHasClue] = useState<boolean>(false);
  const [isLoadingClue, setIsLoadingClue] = useState<boolean>(false);

  // Failure tracking state
  const [failureCount, setFailureCount] = useState(0);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const pseudoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check prefers-reduced-motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Inspect authentication status on mount: determine if initialized
  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setHasCheckedInit(true);
        if (data.success && data.initialized) {
          setView('login');
          setHasClue(Boolean(data.hasRecoveryClue));
        } else {
          setView('setup');
        }
      })
      .catch((err) => {
        console.error('Failed to check auth status:', err);
        if (!isMounted) return;
        setHasCheckedInit(true);
        setView('setup');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pseudoTimerRef.current) {
        clearTimeout(pseudoTimerRef.current);
      }
    };
  }, []);

  // First-run setup submission handler
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSetupSubmitting) return;

    setSetupError(null);

    const cleanUser = setupUsername.trim();
    if (!cleanUser || cleanUser.length < 3) {
      setSetupError('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
      setSetupError('Username may only contain letters, numbers, hyphens, underscores, or periods.');
      return;
    }

    if (!setupPassword || setupPassword.length < 6) {
      setSetupError('Password must be at least 6 characters long.');
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      setSetupError('Passwords do not match. Please verify confirmation.');
      return;
    }

    setIsSetupSubmitting(true);

    try {
      const response = await fetch('/api/auth/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: cleanUser,
          password: setupPassword,
          confirmPassword: setupConfirmPassword,
          recoveryClue: setupRecoveryClue.trim(),
          rememberMe: setupRememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (setupRememberMe) {
          localStorage.setItem('mechanism_private_session_token', data.sessionToken);
          sessionStorage.removeItem('mechanism_private_session_token');
        } else {
          sessionStorage.setItem('mechanism_private_session_token', data.sessionToken);
          localStorage.removeItem('mechanism_private_session_token');
        }

        setIsSetupSubmitting(false);

        onLoginSuccess({
          user: data.user || { username: cleanUser, displayName: cleanUser },
          token: data.sessionToken,
          isNewLogin: true,
          isFirstRunInit: true,
        });
        return;
      }

      setIsSetupSubmitting(false);
      setSetupError(data.error || 'Failed to initialize private credentials.');
    } catch {
      setIsSetupSubmitting(false);
      setSetupError('Network error during initialization. Please try again.');
    }
  };

  // Standard Login submit handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage('Invalid username or password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: cleanUser,
          password: password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Authenticated successfully
        if (rememberMe) {
          localStorage.setItem('mechanism_private_session_token', data.sessionToken);
          sessionStorage.removeItem('mechanism_private_session_token');
        } else {
          sessionStorage.setItem('mechanism_private_session_token', data.sessionToken);
          localStorage.removeItem('mechanism_private_session_token');
        }

        setIsSubmitting(false);

        onLoginSuccess({
          user: data.user || { username: cleanUser, displayName: cleanUser },
          token: data.sessionToken,
          isNewLogin: true,
        });
        return;
      }

      // Incorrect password attempt: trigger the fluid failure/roast sequence!
      setIsSubmitting(false);

      const nextCount = failureCount + 1;
      setFailureCount(nextCount);
      setUsername('');
      setPassword('');

      if (nextCount === 1) {
        setView('pseudo_loading');

        if (pseudoTimerRef.current) {
          clearTimeout(pseudoTimerRef.current);
        }

        const duration = prefersReducedMotion ? 80 : 1250;
        pseudoTimerRef.current = setTimeout(() => {
          setView('failure');
        }, duration);
      } else {
        setView('failure');
      }
    } catch {
      setIsSubmitting(false);
      const nextCount = failureCount + 1;
      setFailureCount(nextCount);
      setUsername('');
      setPassword('');
      setView('failure');
    }
  };

  // "Try Again" from failure state returns directly to normal PRIVATE LOGIN SCREEN with clean empty fields
  const handleTryAgain = () => {
    setUsername('');
    setPassword('');
    setErrorMessage(null);
    setView('login');
  };

  // User navigates to recovery clue screen
  const handleGoToClue = () => {
    setUsername('');
    setPassword('');
    setErrorMessage(null);
    setView('forgot_password');
    setIsLoadingClue(true);

    fetch('/api/auth/recovery-clue')
      .then((res) => res.json())
      .then((data) => {
        setIsLoadingClue(false);
        if (data.success && data.hasClue) {
          setHasClue(true);
          setClueText(data.clue);
        } else {
          setHasClue(false);
          setClueText(null);
        }
      })
      .catch(() => {
        setIsLoadingClue(false);
        setHasClue(false);
        setClueText(null);
      });
  };

  // User clicks "← Back to Sign In" from clue screen to return to normal login screen
  const handleBackToSignIn = () => {
    setUsername('');
    setPassword('');
    setErrorMessage(null);
    setView('login');
  };

  // Select the appropriate roast based on current failure count
  const currentRoast: FailureRoast =
    failureCount >= 1 && failureCount <= 10
      ? FAILURE_ROASTS[failureCount - 1]
      : FINAL_RECURRING_ROAST;

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 overflow-y-auto overflow-x-hidden bg-[#060913] flex items-center justify-center select-none font-sans p-4">
      {/* Continuous Organic Fluid Field Background */}
      <FluidBackground />

      {/* Living Physics Research Environment */}
      <PhysicsLabEnvironment />

      {/* Dynamic View Transitions */}
      <AnimatePresence mode="wait">
        {/* VIEW 0: INITIAL STATUS CHECK */}
        {view === 'check_init' && (
          <motion.div
            key="check-init-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-20 flex flex-col items-center justify-center space-y-3"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-[11px] font-mono text-cyan-400/80 tracking-widest uppercase">
              INITIALIZING ENVIRONMENT
            </span>
          </motion.div>
        )}

        {/* VIEW 1: FIRST-RUN SETUP SCREEN (FOR NEW OWNER) */}
        {view === 'setup' && (
          <motion.div
            key="setup-card"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[460px] relative z-10 my-auto py-6"
          >
            <div className="relative rounded-2xl bg-[#080d1a]/90 backdrop-blur-2xl border border-cyan-500/25 shadow-2xl shadow-black/90 overflow-hidden">
              {/* Top ambient accent refraction line */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

              {/* Scientific corner indicators */}
              <div className="absolute top-2.5 left-3 text-[9px] font-mono text-cyan-400/30 select-none pointer-events-none tracking-widest">
                SYS.PH//SETUP
              </div>
              <div className="absolute top-2.5 right-3 text-[9px] font-mono text-cyan-400/30 select-none pointer-events-none tracking-widest">
                [FIRST_LAUNCH]
              </div>

              <div className="p-7 sm:p-9 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2.5 pt-1">
                  <div className="flex justify-center mb-2">
                    <MechanismLogo variant="full" size="lg" glow={true} alt="MECHANISM" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>SECURE PHYSICS ENVIRONMENT</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight font-sans">
                    INITIALIZE PRIVATE ACCESS
                  </h1>
                  <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                    Create your private credentials.
                  </p>
                </div>

                {/* Setup Error banner */}
                {setupError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-medium">{setupError}</span>
                  </motion.div>
                )}

                {/* Setup Form */}
                <form onSubmit={handleSetupSubmit} className="space-y-4 text-left" autoComplete="off">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-username"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="setup-username"
                        name="setup_username_field"
                        type="text"
                        value={setupUsername}
                        onChange={(e) => {
                          setSetupUsername(e.target.value);
                          if (setupError) setSetupError(null);
                        }}
                        placeholder="Choose your private username"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        disabled={isSetupSubmitting}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-[#050914] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all font-sans disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-password"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="setup-password"
                        name="setup_password_field"
                        type={showSetupPassword ? 'text' : 'password'}
                        value={setupPassword}
                        onChange={(e) => {
                          setSetupPassword(e.target.value);
                          if (setupError) setSetupError(null);
                        }}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        disabled={isSetupSubmitting}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[#050914] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all font-sans disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword((p) => !p)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer"
                        title={showSetupPassword ? 'Hide password' : 'Show password'}
                        aria-label={showSetupPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-confirm-password"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="setup-confirm-password"
                        name="setup_confirm_password_field"
                        type={showSetupConfirm ? 'text' : 'password'}
                        value={setupConfirmPassword}
                        onChange={(e) => {
                          setSetupConfirmPassword(e.target.value);
                          if (setupError) setSetupError(null);
                        }}
                        placeholder="Re-enter your private password"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        disabled={isSetupSubmitting}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[#050914] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all font-sans disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupConfirm((p) => !p)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer"
                        title={showSetupConfirm ? 'Hide password' : 'Show password'}
                        aria-label={showSetupConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showSetupConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Recovery Clue (Optional) */}
                  <div className="space-y-1.5 pt-1">
                    <label
                      htmlFor="setup-recovery-clue"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                    >
                      Recovery clue (optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="setup-recovery-clue"
                        name="setup_recovery_clue_field"
                        type="text"
                        value={setupRecoveryClue}
                        onChange={(e) => setSetupRecoveryClue(e.target.value)}
                        placeholder="Personal memory clue (optional)"
                        autoComplete="off"
                        disabled={isSetupSubmitting}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-[#050914] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all font-sans disabled:opacity-50"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      A personal memory aid displayed if you forget your password. Never bypasses authentication.
                    </p>
                  </div>

                  {/* Remember me toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={setupRememberMe}
                        onChange={(e) => setSetupRememberMe(e.target.checked)}
                        disabled={isSetupSubmitting}
                        className="w-4 h-4 rounded bg-[#050914] border-slate-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 transition-colors cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-300">
                        Remember private session on this device (30 days)
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSetupSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/20 hover:brightness-105 border border-cyan-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                      {isSetupSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>INITIALIZING...</span>
                        </>
                      ) : (
                        <span>CREATE PRIVATE LOGIN</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Subdued Footer Note */}
                <div className="pt-2 border-t border-slate-800/80 text-center">
                  <p className="text-[11px] text-slate-500 font-mono tracking-tight">
                    Single-Practitioner Access Boundary • Server Authoritative
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: NORMAL PRIVATE LOGIN SCREEN */}
        {view === 'login' && (
          <motion.div
            key="login-card"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[440px] relative z-10 my-auto"
          >
            <div className="relative rounded-2xl bg-[#080d1a]/85 backdrop-blur-2xl border border-cyan-500/20 shadow-2xl shadow-black/90 overflow-hidden">
              {/* Top ambient accent refraction line */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

              {/* Scientific instrumentation corner indicators */}
              <div className="absolute top-2.5 left-3 text-[9px] font-mono text-cyan-400/25 select-none pointer-events-none tracking-widest">
                SYS.PH//01
              </div>
              <div className="absolute top-2.5 right-3 text-[9px] font-mono text-cyan-400/25 select-none pointer-events-none tracking-widest">
                [AUTH_GATE]
              </div>

              <div className="p-7 sm:p-9 space-y-6">
                {/* Header: Logo and Session Info */}
                <div className="text-center space-y-3 pt-1">
                  <div className="flex justify-center mb-3">
                    <MechanismLogo variant="full" size="lg" glow={true} alt="MECHANISM" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>SECURE PHYSICS ENVIRONMENT</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight font-sans">
                    Secure Research Access
                  </h1>
                  <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                    Sign in with your private credentials to access the individualized physics cognition laboratory.
                  </p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-left" autoComplete="off">
                  {/* Username field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="mechanism-username"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="mechanism-username"
                        name="mechanism_user_field"
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Enter username"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-lpignore="true"
                        data-form-type="other"
                        required
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-[#050914] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all font-sans disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Password field with Eye/Eye-Off toggle */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="mechanism-password"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="mechanism-password"
                        name="mechanism_pass_field"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Enter password"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-lpignore="true"
                        data-form-type="other"
                        required
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[#050914] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all font-sans disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember me & Forgot private password controls */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded bg-[#050914] border-slate-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 transition-colors cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-300">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleGoToClue}
                      className="text-xs font-sans text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer underline-offset-2 hover:underline"
                    >
                      Forgot private password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/20 hover:brightness-105 border border-cyan-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <span>SIGN IN</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Subdued Footer Note */}
                <div className="pt-2 border-t border-slate-800/80 text-center">
                  <p className="text-[11px] text-slate-500 font-mono tracking-tight">
                    Single-Scholar Physics Session • Private Environment
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: PRIVATE PASSWORD CLUE SCREEN (MEMORY AID ONLY) */}
        {view === 'forgot_password' && (
          <motion.div
            key="recovery-card"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[500px] relative z-10 my-auto"
          >
            <div className="relative rounded-2xl bg-[#080d1a]/90 backdrop-blur-2xl border border-cyan-500/25 shadow-2xl shadow-black/90 overflow-hidden">
              {/* Top ambient accent refraction line */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

              {/* Scientific corner indicators */}
              <div className="absolute top-2.5 left-3 text-[9px] font-mono text-cyan-400/25 select-none pointer-events-none tracking-widest">
                SYS.PH//RECOVERY
              </div>
              <div className="absolute top-2.5 right-3 text-[9px] font-mono text-cyan-400/25 select-none pointer-events-none tracking-widest">
                [PARITY_CHECK]
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                {/* Header */}
                <div className="text-center space-y-2.5 pt-1">
                  <div className="flex justify-center mb-1">
                    <MechanismLogo variant="full" size="lg" glow={true} alt="MECHANISM" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
                    <KeyRound className="w-3 h-3 text-cyan-400" />
                    <span>PRIVATE RECOVERY INVARIANT</span>
                  </div>
                </div>

                {/* Clue Display Box - Memory Aid Only */}
                <div className="p-5 rounded-xl bg-[#050914] border border-slate-800 text-left space-y-3.5 shadow-inner">
                  <h3 className="text-xs font-mono font-bold text-cyan-300 tracking-wider border-b border-slate-800/80 pb-2">
                    ### PRIVATE PASSWORD CLUE
                  </h3>

                  {isLoadingClue ? (
                    <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>RETRIEVING INVARIANT...</span>
                    </div>
                  ) : hasClue && clueText ? (
                    <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed select-text">
                      <p className="text-slate-100 font-medium whitespace-pre-wrap">
                        {clueText}
                      </p>
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        Authenticate with the private credentials created during initialization.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed select-text">
                      <p className="text-slate-200">
                        No recovery clue was configured for this private installation.
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Access to this environment requires authenticating with the private credentials configured during first-run initialization.
                      </p>
                    </div>
                  )}
                </div>

                {/* Exactly ONE arrow: "← Back to Sign In" */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleBackToSignIn}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-all border border-slate-700/70 flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <span>← Back to Sign In</span>
                  </button>
                </div>

                {/* Subdued Footer Note */}
                <div className="pt-2 border-t border-slate-800/80 text-center">
                  <p className="text-[11px] text-slate-500 font-mono tracking-tight">
                    Authorized Principal Verification • Private Diagnostic Core
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: PSEUDO-LOADING INDICATOR (FIRST INCORRECT RECOVERY ATTEMPT ONLY) */}
        {view === 'pseudo_loading' && (
          <motion.div
            key="pseudo-loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-20 flex flex-col items-center justify-center space-y-4 select-none"
          >
            {/* Minimalist technical analysis reticle */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full border border-cyan-500/30 border-t-cyan-400 ${
                  prefersReducedMotion ? '' : 'animate-spin'
                }`}
                style={{ animationDuration: '1.2s' }}
              />
              <div
                className={`w-3.5 h-3.5 rounded-full bg-cyan-400/70 ${
                  prefersReducedMotion ? '' : 'animate-pulse'
                }`}
              />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-400 font-bold">
                ANALYZING RECONSTRUCTION
              </span>
              <p className="text-[10px] font-mono text-slate-500 tracking-wider">
                // COGNITIVE VERIFICATION IN PROGRESS
              </p>
            </div>
          </motion.div>
        )}

        {/* VIEW 5: MINIMAL FULL-SCREEN FLUID FAILURE STATE & ROAST */}
        {view === 'failure' && (
          <motion.div
            key={`failure-state-${failureCount}`}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[460px] relative z-20 text-center px-4 my-auto"
          >
            <div className="relative p-8 sm:p-10 rounded-2xl bg-[#080d1a]/90 backdrop-blur-2xl border border-rose-500/30 shadow-2xl shadow-black/90 space-y-6 overflow-hidden">
              {/* Subtle top ambient accent line */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

              {/* Centered Insult Header */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight font-sans">
                  {currentRoast.title}
                </h2>

                <div className="text-slate-300 font-sans leading-relaxed text-sm sm:text-base">
                  {currentRoast.body}
                </div>
              </div>

              {/* Try Again Primary Action - Returns directly to normal PRIVATE LOGIN SCREEN */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  autoFocus
                  className="w-full sm:w-auto min-w-[160px] py-2.5 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-cyan-950/40 border border-cyan-400/30 cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
