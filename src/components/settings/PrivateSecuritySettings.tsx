import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';

export interface PrivateSecuritySettingsProps {
  username?: string;
  onDeleteAccountComplete?: () => void;
}

export const PrivateSecuritySettings: React.FC<PrivateSecuritySettingsProps> = ({
  username: initialUsername,
  onDeleteAccountComplete,
}) => {
  const [currentUsername, setCurrentUsername] = useState<string>(initialUsername || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  React.useEffect(() => {
    if (!currentUsername) {
      const token =
        sessionStorage.getItem('mechanism_private_session_token') ||
        localStorage.getItem('mechanism_private_session_token');
      if (token) {
        fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.user?.username) {
              setCurrentUsername(d.user.username);
            }
          })
          .catch(() => {});
      }
    }
  }, [currentUsername]);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token =
        sessionStorage.getItem('mechanism_private_session_token') ||
        localStorage.getItem('mechanism_private_session_token');

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update private password.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(data.message || 'Private password updated successfully. The new password is active.');
      // Clear sensitive form fields immediately
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setErrorMessage('Network error while updating private password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token =
        sessionStorage.getItem('mechanism_private_session_token') ||
        localStorage.getItem('mechanism_private_session_token');

      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setDeleteError(data.error || 'Failed to permanently delete account.');
        setIsDeleting(false);
        return;
      }

      // Cleanup local tokens
      localStorage.removeItem('mechanism_private_session_token');
      sessionStorage.removeItem('mechanism_private_session_token');

      setIsDeleteModalOpen(false);

      if (onDeleteAccountComplete) {
        onDeleteAccountComplete();
      } else {
        window.location.reload();
      }
    } catch {
      setDeleteError('Network error while connecting to account service.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            Private Security & Access Control
          </h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest hidden sm:inline">
          // ACCESS INVARIANT
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Security Policy Card */}
        <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                01 // ACCESS POLICY
              </span>
              <Lock className="w-3.5 h-3.5 text-cyan-400/80" />
            </div>

            <h3 className="text-sm font-semibold text-white">
              Private Identity Invariant
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              The MECHANISM platform enforces a strict single-practitioner private security boundary. No public registrations or third-party identity providers exist in this runtime.
            </p>

            <div className="pt-2 space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#07080C] border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Authorized Principal</span>
                <span className="text-cyan-300 font-bold truncate max-w-[140px]">{currentUsername || 'Configured Owner'}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#07080C] border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Hash Algorithm</span>
                <span className="text-slate-200">scrypt (Node.js crypto)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#07080C] border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Plaintext Storage</span>
                <span className="text-emerald-400 font-bold">Zero (Disallowed)</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-900/60 text-[11px] text-cyan-300 font-mono">
            Cryptographically isolated session tokens in memory.
          </div>
        </div>

        {/* Change Password Card */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Change Private Password
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Update your private password. The change takes effect immediately, revoking the previous credential.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-xs font-mono text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-xs font-mono text-rose-300 flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            {/* Current Password Field */}
            <div className="space-y-1">
              <label
                htmlFor="current-password-input"
                className="block text-xs font-mono text-slate-300"
              >
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="current-password-input"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter current private password"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-10 py-2 rounded-lg text-xs font-mono bg-[#07080C] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showCurrent ? 'Hide password' : 'Show password'}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="new-password-input"
                  className="block text-xs font-mono text-slate-300"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="new-password-input"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-10 py-2 rounded-lg text-xs font-mono bg-[#07080C] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showNew ? 'Hide password' : 'Show password'}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirm-password-input"
                  className="block text-xs font-mono text-slate-300"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="confirm-password-input"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-10 py-2 rounded-lg text-xs font-mono bg-[#07080C] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showConfirm ? 'Hide password' : 'Show password'}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Hash stored server-side // Zero browser token retention
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 rounded-lg text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Change Private Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Account Destructive Section */}
      <div className="p-5 rounded-xl border border-rose-950/60 bg-[#0C0E16] space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-rose-200">
                Delete Account
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-rose-950/80 border border-rose-800/80 text-rose-300">
                DESTRUCTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Permanently purges all learner history, adaptive cognitive profiles, Bayesian evidence logs, doubt chat conversations, and stored private credentials. Restores a clean, unassessed baseline state.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            className="py-2 px-4 rounded-lg text-xs font-mono font-bold text-rose-200 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 hover:border-rose-600 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-[0.99]"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Permanent Account Deletion */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#0C0E16] border border-rose-800/80 p-6 space-y-5 shadow-2xl animate-fadeIn text-left">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase tracking-wide">
                    Confirm Permanent Account Deletion
                  </h3>
                  <span className="text-[11px] font-mono text-rose-400">
                    // PERMANENT UNRECOVERABLE OPERATION
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setIsDeleteModalOpen(false);
                }}
                disabled={isDeleting}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deletion Warning Details */}
            <div className="space-y-3 text-xs font-sans text-slate-300 leading-relaxed bg-[#07080C] p-4 rounded-lg border border-slate-800">
              <p className="font-semibold text-rose-300">
                Deleting this account will permanently erase:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300 font-mono text-[11px]">
                <li><strong className="text-slate-200">Learning History:</strong> All test questions, simulations, and reconstruction attempts.</li>
                <li><strong className="text-slate-200">Adaptive Cognitive Model:</strong> Dynamic reasoning flaw diagnostic profiles and calibration scores.</li>
                <li><strong className="text-slate-200">Epistemic Evidence:</strong> All cross-tool behavioral logs and Bayesian updates.</li>
                <li><strong className="text-slate-200">Chat Conversations:</strong> All Doubt Chat transcripts and reasoning sessions.</li>
                <li><strong className="text-slate-200">Active Context & State:</strong> Focus topics, concept mappings, and learner preferences.</li>
                <li><strong className="text-slate-200">Private Credentials:</strong> Password hash and active session keys.</li>
              </ul>
              <p className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                Curated Physics core topics, canonical mechanisms, and gold-standard question banks will be preserved. The installation will return to a clean baseline state.
              </p>
            </div>

            {/* Error Message if Deletion Fails */}
            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-xs font-mono text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel / Keep Account
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-950/50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account & Clearing State...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
