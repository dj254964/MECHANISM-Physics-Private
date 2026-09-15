import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Database,
  ShieldCheck,
  Server,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Lock,
  FileCode2,
  Terminal,
  Activity,
  Gauge,
  Zap,
  RotateCcw,
  Check,
  AlertCircle,
  HardDrive,
  Network,
  Eye,
  KeyRound,
  Fingerprint,
  Sliders,
  Workflow,
  ShieldAlert,
} from 'lucide-react';
import { MechanismLogo } from '../components/branding/MechanismLogo';
import { PrivateSecuritySettings } from '../components/settings/PrivateSecuritySettings';

interface SystemSettingsData {
  provider: string;
  model: string;
  hasApiKey: boolean;
  environment?: string;
  databaseDriver?: string;
  databasePath?: string;
  tableCount?: number;
  foreignKeys?: string;
  journalMode?: string;
  sdk?: string;
  securityProtocol?: string;
  costControl?: string;
  engineVersion?: string;
}

// User Configurable Preferences stored in localStorage
interface EnginePreferences {
  feedbackDensity: 'comprehensive' | 'discriminator' | 'socratic';
  adversarialPressure: 'standard' | 'extreme' | 'latent';
  reconstructionMode: 'dual' | 'pillars' | 'narrative';
  requireConfidenceGate: boolean;
  autoLogAdaptiveEvidence: boolean;
  detectTeleologicalJumps: boolean;
}

const DEFAULT_PREFERENCES: EnginePreferences = {
  feedbackDensity: 'comprehensive',
  adversarialPressure: 'standard',
  reconstructionMode: 'dual',
  requireConfidenceGate: true,
  autoLogAdaptiveEvidence: true,
  detectTeleologicalJumps: true,
};

export interface SettingsPageProps {
  onDeleteAccountComplete?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDeleteAccountComplete }) => {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<'all' | 'tuning' | 'architecture' | 'security'>('all');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // User configurable engine preferences
  const [prefs, setPrefs] = useState<EnginePreferences>(() => {
    try {
      const stored = localStorage.getItem('mechanism_engine_preferences');
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading preferences from localStorage', e);
    }
    return DEFAULT_PREFERENCES;
  });

  // Modal for resetting user cognitive baseline
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resettingBaseline, setResettingBaseline] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const fetchSettings = () => {
    setLoading(true);
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSettings(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updatePreference = <K extends keyof EnginePreferences>(
    key: K,
    value: EnginePreferences[K]
  ) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('mechanism_engine_preferences', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving preference', e);
      }
      return updated;
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetBaseline = async () => {
    setResettingBaseline(true);
    try {
      const res = await fetch('/api/user-model/reset', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setResetSuccessMessage('Cognitive baseline reset successfully. Fresh Bayesian priors initialized.');
        setShowResetModal(false);
        setTimeout(() => setResetSuccessMessage(null), 4500);
      } else {
        alert('Reset failed: ' + (json.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResettingBaseline(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16 font-sans text-slate-200">
      {/* ========================================================= */}
      {/* 1. CONTROL CENTER HEADER & RUNTIME SPECIFICATION          */}
      {/* ========================================================= */}
      <div className="p-6 md:p-7 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-2xl space-y-5 relative overflow-hidden">
        {/* Ambient subtle cyan/indigo glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <MechanismLogo size={20} glow />
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                ENVIRONMENT CONTROL CENTER
              </span>
              <span className="text-xs font-mono text-slate-400">
                • {settings?.engineVersion || 'MECHANISM v2.4.0'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <SlidersHorizontal className="w-7 h-7 text-cyan-400 shrink-0" />
              <span>Physics Environment Settings</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Operational parameters, cognitive diagnostic tuning, security credentials, and verified architectural specifications powering your private physics environment.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Filter Pills */}
            <div className="inline-flex p-0.5 rounded-lg bg-[#07080C] border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveSection('all')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeSection === 'all'
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Sections
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('tuning')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeSection === 'tuning'
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Adaptive Tuning
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('security')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeSection === 'security'
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Security & Access
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('architecture')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeSection === 'architecture'
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Architecture
              </button>
            </div>

            <button
              type="button"
              onClick={fetchSettings}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-[#101420] hover:bg-[#151a2b] border border-slate-700 transition-all cursor-pointer"
              title="Refresh environment specifications"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-cyan-400 font-semibold">AI Reasoning Engine</div>
            <div className="text-sm font-bold text-white truncate">
              {settings?.model || 'gemini-3.8-flash'}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Server-Side Proxied</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-slate-400 font-semibold">Storage Substrate</div>
            <div className="text-sm font-bold text-white truncate">
              SQLite WAL DatabaseSync
            </div>
            <div className="text-[10px] text-slate-400">
              <span className="text-slate-300 font-bold">{settings?.tableCount || 17}</span> relational tables
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-emerald-400 font-semibold">Credential Isolation</div>
            <div className="text-sm font-bold text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero Browser Exposure</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Encapsulated in backend
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-indigo-400 font-semibold">Container Ingress</div>
            <div className="text-sm font-bold text-white">
              0.0.0.0:3000
            </div>
            <div className="text-[10px] text-slate-400">
              Single-turn dispatch
            </div>
          </div>
        </div>
      </div>

      {/* Persistence / Feedback Notifications */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-xs font-mono text-cyan-200 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Preference updated and saved to local configuration.</span>
        </div>
      )}

      {resetSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs font-mono text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LEARNING & ADAPTIVE TUNING CONTROLS                    */}
      {/* ========================================================= */}
      {(activeSection === 'all' || activeSection === 'tuning') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Adaptive Diagnostics & Reasoning Parameters
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">
              // REASONING PROFILE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2.1 Derivation Depth */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    01 // DERIVATION DEPTH
                  </span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400/80" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Diagnostic Feedback Protocol
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Controls analytical granularity when evaluating causal arguments and counterfactual claims.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  {
                    id: 'comprehensive',
                    label: 'Full Causal Derivations',
                    desc: 'Step-by-step invariant equations, counterfactuals, and rate-limiting laws.',
                  },
                  {
                    id: 'discriminator',
                    label: 'Targeted Discriminators',
                    desc: 'Focus primarily on diagnostic branch points and rule-out invariants.',
                  },
                  {
                    id: 'socratic',
                    label: 'Socratic Inversion',
                    desc: 'Presents first-principles guiding questions rather than direct answers.',
                  },
                ].map((opt) => {
                  const isSelected = prefs.feedbackDensity === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updatePreference('feedbackDensity', opt.id as any)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-500/80 bg-[#101420] text-cyan-200 shadow-sm'
                          : 'border-slate-800 bg-[#07080C] hover:bg-[#0e1220] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.2 Adversarial Attack Pressure */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">
                    02 // PERTURBATION STRESS
                  </span>
                  <Zap className="w-3.5 h-3.5 text-violet-400/80" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Adversarial Attack Pressure
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sets the intensity of counterfactual perturbations and multi-variable edge cases.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  {
                    id: 'standard',
                    label: 'Calibrated Stress (Standard)',
                    desc: 'Realistic physical perturbations with harmonic and dynamical compensations.',
                  },
                  {
                    id: 'extreme',
                    label: 'Extreme Boundary Stress',
                    desc: 'Non-linear bifurcation states and extreme boundary limit challenges.',
                  },
                  {
                    id: 'latent',
                    label: 'Latent Traps & Biases',
                    desc: 'Subtle distractors specifically targeting teleological assumptions.',
                  },
                ].map((opt) => {
                  const isSelected = prefs.adversarialPressure === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updatePreference('adversarialPressure', opt.id as any)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500/80 bg-[#131228] text-violet-200 shadow-sm'
                          : 'border-slate-800 bg-[#07080C] hover:bg-[#0e1220] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-violet-300' : 'text-slate-200'}`}>
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.3 Reconstruction Default */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    03 // RECALL MODALITY
                  </span>
                  <Layers className="w-3.5 h-3.5 text-cyan-400/80" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Reconstruction Engine Default
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Default format for close-book memory retrieval when rebuilding physical mechanisms.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  {
                    id: 'dual',
                    label: 'Dual-Channel Synthesis',
                    desc: 'Simultaneous continuous causal essay + 5-Pillar structured matrix.',
                  },
                  {
                    id: 'pillars',
                    label: '5-Pillar Architecture',
                    desc: 'Strict causal steps, invariant laws, variables, and breakdown limits.',
                  },
                  {
                    id: 'narrative',
                    label: 'Causal Synthesis Only',
                    desc: 'Free-form long-form paragraph retrieval of physical state transitions.',
                  },
                ].map((opt) => {
                  const isSelected = prefs.reconstructionMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updatePreference('reconstructionMode', opt.id as any)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-500/80 bg-[#101420] text-cyan-200 shadow-sm'
                          : 'border-slate-800 bg-[#07080C] hover:bg-[#0e1220] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Epistemic Calibration & Telemetry Gates */}
          <div className="p-5 md:p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Epistemic Calibration & Telemetry Gates</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Behavioral constraints governing how diagnostic probes and personal telemetry are recorded.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Toggle 1: Confidence Calibration Gate */}
              <div className="p-3.5 rounded-lg bg-[#07080C] border border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200">
                    Confidence Calibration Gate
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Require explicit subjective confidence (0–100%) before submitting answers to chart calibration curves.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreference('requireConfidenceGate', !prefs.requireConfidenceGate)
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                    prefs.requireConfidenceGate ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle confidence gate"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      prefs.requireConfidenceGate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Continuous Evidence Logging */}
              <div className="p-3.5 rounded-lg bg-[#07080C] border border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200">
                    Continuous Evidence Logging
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automatically pipe probe responses, simulation metrics, and recall scores into the adaptive model.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreference('autoLogAdaptiveEvidence', !prefs.autoLogAdaptiveEvidence)
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                    prefs.autoLogAdaptiveEvidence ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle evidence logging"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      prefs.autoLogAdaptiveEvidence ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Teleological Jump Isolation */}
              <div className="p-3.5 rounded-lg bg-[#07080C] border border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200">
                    Teleological Jump Isolation
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instantly flag goal-oriented explanations (e.g., &quot;particles move to minimize energy&quot;) in Socratic dialogue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreference('detectTeleologicalJumps', !prefs.detectTeleologicalJumps)
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                    prefs.detectTeleologicalJumps ? 'bg-cyan-600' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle teleological jump isolation"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      prefs.detectTeleologicalJumps ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Cognitive Baseline Reset Action */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cognitive Baseline Calibration Reset</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Resets historical question attempts, reconstructions, and Bayesian evidence priors back to baseline scholar state.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-950/80 border border-rose-800/60 transition-all cursor-pointer shrink-0"
              >
                Reset Diagnostic Baseline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ACCOUNT & SECURITY (PRIVATE CREDENTIALS)               */}
      {/* ========================================================= */}
      {(activeSection === 'all' || activeSection === 'security') && (
        <div id="private-security" className="space-y-4">
          <PrivateSecuritySettings onDeleteAccountComplete={onDeleteAccountComplete} />
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TECHNICAL ARCHITECTURE & INFRASTRUCTURE MATRIX         */}
      {/* ========================================================= */}
      {(activeSection === 'all' || activeSection === 'architecture') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Subsystem Architecture & Security Telemetry
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">
              // VERIFIED RUNTIME SPECIFICATION
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 4.1 Google Gemini AI Subsystem */}
            <div className="p-5 md:p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Google Gemini & AI Model Layer
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  ACTIVE PROVIDER
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">AI Engine Provider</span>
                  <span className="font-mono font-bold text-white">
                    {settings?.provider || 'Google Gemini'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Target Reasoning Model</span>
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    {settings?.model || 'gemini-3.8-flash'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">SDK Integration Standard</span>
                  <span className="font-mono text-slate-200">
                    {settings?.sdk || '@google/genai (Interactions API)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Execution Protocol</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    Low-Latency Server Proxy & Prompt Caching
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Cost & Rate Control</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{settings?.costControl || 'Single-Turn Dispatch (Zero Duplicate Calls)'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 4.2 Relational SQLite Database Subsystem */}
            <div className="p-5 md:p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Relational SQLite Database Subsystem
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-950/80 text-violet-300 border border-violet-800/60">
                  PERSISTENT WAL
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Database Driver</span>
                  <span className="font-mono font-bold text-white">
                    {settings?.databaseDriver || 'Node.js Native SQLite (node:sqlite DatabaseSync)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Storage Target Path</span>
                  <span className="font-mono text-slate-300 select-all">
                    {settings?.databasePath || './data/mechanism.db'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Foreign Key Integrity</span>
                  <span className="font-mono text-emerald-400">
                    {settings?.foreignKeys || 'PRAGMA foreign_keys = ON (Enforced)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Journal Mode</span>
                  <span className="font-mono text-cyan-300">
                    {settings?.journalMode || 'WAL (Write-Ahead Logging)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Active Relational Schema</span>
                  <span className="font-mono text-white">
                    {settings?.tableCount || 17} Registered Tables
                  </span>
                </div>
              </div>
            </div>

            {/* 4.3 Secret Encapsulation & Credential Isolation */}
            <div className="p-5 md:p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Security & Credential Encapsulation
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  ZERO EXPOSURE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#07080C] border border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">
                        Browser Key Isolation
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Zero API keys are exposed or accessible in browser runtime
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                    HARDENED
                  </span>
                </div>

                <div className="space-y-2 text-slate-400 text-xs leading-relaxed">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/70">
                    <span>API Key Environment Status</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {settings?.hasApiKey ? 'KEY CONFIGURED & VERIFIED' : 'DEFAULT HOST KEY'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800/70">
                    <span>Client-Side Bundle Scrubbing</span>
                    <span className="font-mono text-slate-200">
                      process.env.GEMINI_API_KEY stripped from client bundle
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span>Proxy Routing Invariant</span>
                    <span className="font-mono text-slate-200">
                      All LLM dispatches proxied via internal /api/* endpoints
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4.4 Ingress & Architecture Blueprint */}
            <div className="p-5 md:p-6 rounded-xl border border-slate-800/90 bg-[#0C0E16] space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Container Ingress & Full-Stack Blueprint
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  PORT 3000
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Container Ingress Port</span>
                  <span className="font-mono font-bold text-white">
                    0.0.0.0:3000 (Internal Reverse Proxy)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Backend Server Entry</span>
                  <span className="font-mono text-slate-200">
                    Express v4 + tsx / esbuild (server.ts)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400">Frontend Client Architecture</span>
                  <span className="font-mono text-slate-200">
                    React 18 + Vite SPA + Tailwind CSS
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Reasoning Workflow Loop</span>
                  <span className="font-mono text-cyan-300 text-[11px]">
                    Doubt → Compressor → Adversarial → Recall → Adaptive Profile
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CONFIRMATION MODAL FOR COGNITIVE BASELINE RESET        */}
      {/* ========================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0C0E16] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/60">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Reset Cognitive Baseline?
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  // REINITIALIZE BAYESIAN PRIORS
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will reset your question attempts, close-book reconstruction scores, physical simulation records, and adaptive Bayesian evidence. Your underlying physics topics and invariant mechanism tables will remain intact.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resettingBaseline}
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 bg-[#07080C] hover:bg-[#101420] border border-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetBaseline}
                disabled={resettingBaseline}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-100 bg-rose-700 hover:bg-rose-600 transition-colors cursor-pointer flex items-center gap-2"
              >
                {resettingBaseline ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Confirm Reset</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
