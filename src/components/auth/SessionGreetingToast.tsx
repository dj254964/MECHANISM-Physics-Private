import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X } from 'lucide-react';

export function getTimeAwareGreeting(name: string = 'Scholar'): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) {
    return `Good morning, ${name}.`;
  } else if (hour >= 12 && hour < 17) {
    return `Good afternoon, ${name}.`;
  } else {
    return `Good evening, ${name}.`;
  }
}

interface SessionGreetingToastProps {
  greeting: string | null;
  onDismiss: () => void;
  onExitComplete?: () => void;
}

export const SessionGreetingToast: React.FC<SessionGreetingToastProps> = ({
  greeting,
  onDismiss,
  onExitComplete,
}) => {
  useEffect(() => {
    if (!greeting) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5500);
    return () => clearTimeout(timer);
  }, [greeting, onDismiss]);

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {greeting && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full pointer-events-auto"
          role="status"
          aria-live="polite"
        >
          <div className="rounded-xl border border-slate-700/80 bg-[#0d1326]/95 backdrop-blur-md p-3.5 shadow-2xl shadow-black/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-700/60 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 tracking-tight">{greeting}</p>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Private session established • Physics cognition laboratory active
              </p>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800/60 cursor-pointer"
              aria-label="Dismiss greeting"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
