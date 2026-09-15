import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Cpu,
  Clock,
  Layers,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Target,
  ArrowRight,
  ShieldAlert,
  Compass,
  Zap,
  Minimize2,
  Database,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  ExternalLink,
  HelpCircle,
  FileCode,
  Calendar,
  Layers as LayersIcon,
  Tag,
  Check,
  AlertOctagon,
} from 'lucide-react';
import { NavTab } from '../components/Navigation';

interface HistoryData {
  recentDoubts: any[];
  recentMechanisms: any[];
  recentSimulations: any[];
  recentReconstructions: any[];
  recentQuestions?: any[];
}

export interface HistoryPageProps {
  onNavigate?: (tab: NavTab) => void;
  onContextChange?: (context: any) => void;
  onSelectTopic?: (topic: any) => void;
}

// 5-Stage Longitudinal Reasoning Trajectory
type PipelineStage = 'all' | 'time' | 'attempts' | 'errors' | 'corrections' | 'model_change';

interface StageMeta {
  id: PipelineStage;
  title: string;
  tag: string;
  subtext: string;
  description: string;
}

const PIPELINE_STAGES: StageMeta[] = [
  {
    id: 'time',
    title: 'TEMPORAL LOG',
    tag: 'CHRONO SEQUENCE',
    subtext: 'Observation Epochs',
    description: 'Chronological activity sequence logging time-stamped reasoning engagements.',
  },
  {
    id: 'attempts',
    title: 'DIAGNOSTIC PROBES',
    tag: 'EMPIRICAL PROBES',
    subtext: 'Active Challenges',
    description: 'Physical problem trials, derivations, simulations, and close-book recall probes.',
  },
  {
    id: 'errors',
    title: 'ISOLATED FLAWS',
    tag: 'CAUSAL DEFICITS',
    subtext: 'Flaw Detection',
    description: 'Recorded directionality flips, missing invariants, and overconfidence gaps.',
  },
  {
    id: 'corrections',
    title: 'MODEL REPAIRS',
    tag: 'AXIOM ALIGNMENT',
    subtext: 'Boundary Adjustments',
    description: 'Instances where feedback, counterfactuals, or perturbations corrected understanding.',
  },
  {
    id: 'model_change',
    title: 'TRANSFER EVENTS',
    tag: 'VALIDATED SHIFTS',
    subtext: 'Verified Mastery',
    description: 'Empirically validated transfer across disguised contexts and stable physical invariants.',
  },
];

// Unified Timeline Entry for the Ledger
interface LedgerEntry {
  id: string;
  rawId: string;
  timestamp: string;
  sourceType: 'evidence' | 'mechanism' | 'simulation' | 'reconstruction' | 'question' | 'doubt';
  categoryLabel: string;
  toolTargetTab: NavTab;
  title: string;
  topicName: string;
  topicId?: string;
  summary: string;
  importance: 'high' | 'routine';
  semanticStatus: 'success' | 'uncertainty' | 'failure' | 'neutral';
  statusLabel: string;
  engineSignal: string;
  modelChange: string;
  errorName?: string;
  confidence?: number;
  score?: number;
  timeTakenSec?: number;
  canReopen?: boolean;
  canDelete?: boolean;
  raw: any;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onNavigate,
  onContextChange,
  onSelectTopic,
}) => {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [adaptiveEvidence, setAdaptiveEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activePipelineStage, setActivePipelineStage] = useState<PipelineStage>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'ledger' | 'streams'>('ledger');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/history')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setHistoryData(json.data);
          }
        }),
      fetch('/api/adaptive/evidence?limit=50')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setAdaptiveEvidence(json.data);
          }
        }),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle reopening a historical session
  const handleReopenSession = (entry: LedgerEntry) => {
    if (entry.sourceType === 'doubt') {
      // Reopen specific conversation in Doubt Chat
      if (onContextChange) {
        onContextChange({
          topicId: entry.topicId || 'general_physics',
          topicName: entry.topicName || 'General Physics',
          conversationId: entry.rawId,
          source: 'history_resume',
          summary: `Resumed discussion: ${entry.title}`,
        });
      }
      try {
        localStorage.setItem('mechanism_selected_conversation_id', entry.rawId);
      } catch (e) {}
      if (onNavigate) {
        onNavigate('doubt_chat');
      }
    } else {
      // Navigate to corresponding learning tool with active topic context
      if (onContextChange) {
        onContextChange({
          topicId: entry.topicId || 'general_physics',
          topicName: entry.topicName || 'General Physics',
          source: 'history_navigation',
          summary: `Navigated from longitudinal record: ${entry.title}`,
        });
      }
      if (onNavigate) {
        onNavigate(entry.toolTargetTab);
      }
    }
  };

  // Handle deleting a conversation record
  const handleDeleteConversation = async (conversationId: string) => {
    setDeletingId(conversationId);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        // Remove locally from state
        setHistoryData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentDoubts: prev.recentDoubts.filter((d) => d.id !== conversationId),
          };
        });
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Consolidate all historical records into a unified chronological ledger
  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    const entries: LedgerEntry[] = [];

    // 1. Adaptive Evidence records (Core Cognitive Engine Signals)
    adaptiveEvidence.forEach((ev) => {
      const isHighImportance =
        ev.transferable_mastery === 1 ||
        (ev.evidence_strength != null && ev.evidence_strength >= 0.75) ||
        Boolean(ev.error_id) ||
        ev.feature === 'reconstruction';

      let status: 'success' | 'uncertainty' | 'failure' | 'neutral' = 'neutral';
      let statusLabel = 'Recorded Signal';

      if (ev.transferable_mastery === 1) {
        status = 'success';
        statusLabel = 'Transfer Validated';
      } else if (ev.correct_reasoning === 1 || ev.correct_answer === 1) {
        status = 'success';
        statusLabel = 'Causal Integrity';
      } else if (ev.error_id) {
        status = 'failure';
        statusLabel = 'Reasoning Flaw Isolated';
      } else if (ev.correct_reasoning === 0 || ev.correct_answer === 0) {
        status = 'uncertainty';
        statusLabel = 'Reasoning Deficit';
      }

      const modelChangeStr =
        ev.transferable_mastery === 1
          ? 'Cross-Domain Transfer Validated; Invariant Verified'
          : ev.evidence_strength != null
          ? `Adaptive Evidence Weight: ${(ev.evidence_strength * 100).toFixed(0)}%`
          : 'Cognitive Observation Logged';

      const featureTabMap: Record<string, NavTab> = {
        compressor: 'compressor',
        first_principles: 'first_principles',
        adversarial: 'adversarial',
        reverse_engineering: 'reverse_engineering',
        simulation: 'simulation',
        reconstruction: 'reconstruction',
        mcq_test: 'mcq_test',
        question: 'mcq_test',
        doubt: 'doubt_chat',
      };

      const targetTab: NavTab = featureTabMap[ev.feature] || 'user_model';

      entries.push({
        id: `ev_${ev.id}`,
        rawId: String(ev.id),
        timestamp: ev.created_at,
        sourceType: 'evidence',
        toolTargetTab: targetTab,
        categoryLabel: `ADAPTIVE // ${(ev.feature || 'COGNITIVE').toUpperCase()}`,
        title:
          ev.feature === 'reconstruction'
            ? 'Close-Book Memory Reconstruction'
            : ev.feature
            ? `${ev.feature.replace(/_/g, ' ').toUpperCase()} Diagnostic Probe`
            : 'Adaptive Evidence Record',
        topicName: ev.topic_name || ev.topic_id || 'Physical Principles',
        topicId: ev.topic_id,
        summary: ev.evidence_summary || 'Diagnostic assessment logged in the central reasoning profile.',
        importance: isHighImportance ? 'high' : 'routine',
        semanticStatus: status,
        statusLabel,
        engineSignal: `Weight: ${ev.evidence_strength ? (ev.evidence_strength * 100).toFixed(0) + '%' : 'Nominal'}`,
        modelChange: modelChangeStr,
        errorName: ev.error_name || (ev.error_id ? ev.error_id.replace('err_', '').replace(/_/g, ' ') : undefined),
        confidence: ev.confidence,
        timeTakenSec: ev.time_taken_sec,
        canReopen: true,
        canDelete: false,
        raw: ev,
      });
    });

    // 2. Evaluated Mechanisms
    if (historyData?.recentMechanisms) {
      historyData.recentMechanisms.forEach((m) => {
        const score = Math.round((m.overall_score || 0.75) * 100);
        const isHighImportance = score >= 85 || score < 60;
        const status: 'success' | 'uncertainty' | 'failure' =
          score >= 80 ? 'success' : score >= 60 ? 'uncertainty' : 'failure';

        entries.push({
          id: `mech_${m.id}`,
          rawId: String(m.id),
          timestamp: m.created_at,
          sourceType: 'mechanism',
          toolTargetTab: 'compressor',
          categoryLabel: 'COMPRESSOR // INVARIANT MECHANISM',
          title: m.title || 'Mechanism Compression Evaluation',
          topicName: m.topic_name || 'Physical Derivation',
          topicId: m.topic_id,
          summary: `Evaluated causal derivation and 6-step compression rule. Overall physical score: ${score}%.`,
          importance: isHighImportance ? 'high' : 'routine',
          semanticStatus: status,
          statusLabel: score >= 80 ? 'Robust Invariant' : score >= 60 ? 'Moderate Alignment' : 'Sub-Optimal Causal Model',
          engineSignal: `Causal Score: ${score}%`,
          modelChange: score >= 80 ? 'Physical Invariant Formally Encoded' : 'Boundary Gaps Isolated for Correction',
          score,
          canReopen: true,
          canDelete: false,
          raw: m,
        });
      });
    }

    // 3. Physical Simulations
    if (historyData?.recentSimulations) {
      historyData.recentSimulations.forEach((s) => {
        const overanalyzed = Boolean(s.overanalyzed);
        entries.push({
          id: `sim_${s.id}`,
          rawId: String(s.id),
          timestamp: s.created_at,
          sourceType: 'simulation',
          toolTargetTab: 'simulation',
          categoryLabel: 'SIMULATION // PERTURBATION TRIAL',
          title: s.title || 'Physical Simulation Run',
          topicName: s.topic_name || 'System Dynamics',
          topicId: s.topic_id,
          summary:
            s.outcome ||
            (overanalyzed
              ? 'Discriminator delayed; redundant measurements requested before definitive decision.'
              : 'Targeted discriminator identified promptly with minimal unnecessary measurements.'),
          importance: overanalyzed ? 'high' : 'routine',
          semanticStatus: overanalyzed ? 'uncertainty' : 'success',
          statusLabel: overanalyzed ? 'Excessive Workup' : 'Targeted Discriminator',
          engineSignal: `Confidence: ${s.confidence || 75}%`,
          modelChange:
            s.model_update ||
            (overanalyzed ? 'Measurement Threshold Adjusted for Precision' : 'Physical Decision Path Consolidated'),
          confidence: s.confidence,
          canReopen: true,
          canDelete: false,
          raw: s,
        });
      });
    }

    // 4. Close-Book Reconstructions
    if (historyData?.recentReconstructions) {
      historyData.recentReconstructions.forEach((r) => {
        const score = Math.round(r.score || 0);
        const status: 'success' | 'uncertainty' | 'failure' =
          score >= 80 ? 'success' : score >= 60 ? 'uncertainty' : 'failure';

        entries.push({
          id: `rec_${r.id}`,
          rawId: String(r.id),
          timestamp: r.created_at,
          sourceType: 'reconstruction',
          toolTargetTab: 'reconstruction',
          categoryLabel: 'RECONSTRUCTION // CLOSE-BOOK RETRIEVAL',
          title: `Internal Model Rebuilt: ${r.topic_name || 'Mechanism'}`,
          topicName: r.topic_name || 'Physics Concept',
          topicId: r.topic_id,
          summary: `Zero-note active recall evaluated against invariant physical reality. Convergence score: ${score}%.`,
          importance: 'high',
          semanticStatus: status,
          statusLabel: score >= 80 ? 'Accurate Schema Recall' : 'Schema Divergence Detected',
          engineSignal: `Recall Alignment: ${score}%`,
          modelChange: score >= 80 ? 'Long-Term Memory Trace Reinforced' : 'Causal Gap Isolated in Mental Model',
          score,
          canReopen: true,
          canDelete: false,
          raw: r,
        });
      });
    }

    // 5. Question Attempts (Adaptive Diagnostic Probes)
    if (historyData?.recentQuestions) {
      historyData.recentQuestions.forEach((q) => {
        const isCorrect = Boolean(q.correct);
        const hasError = Boolean(q.reasoning_error);
        const isHigh = !isCorrect || hasError || (q.confidence && q.confidence > 85 && !isCorrect);

        entries.push({
          id: `qa_${q.id}`,
          rawId: String(q.id),
          timestamp: q.created_at,
          sourceType: 'question',
          toolTargetTab: 'mcq_test',
          categoryLabel: `ADAPTIVE PROBE // ${(q.mode || 'REASONING').toUpperCase()}`,
          title: q.question_text ? q.question_text.slice(0, 60) + '...' : 'Adaptive Reasoning Probe',
          topicName: q.topic_name || 'Diagnostic Challenge',
          topicId: q.topic_id,
          summary: q.reasoning || 'Evaluated physical response against mechanistic distractor set.',
          importance: isHigh ? 'high' : 'routine',
          semanticStatus: isCorrect ? 'success' : 'failure',
          statusLabel: isCorrect ? 'Correct Path' : 'Divergent Choice',
          engineSignal: `Confidence: ${q.confidence || '--'}%`,
          modelChange: isCorrect ? 'Confidence Calibration Validated' : 'Heuristic Bias Flagged for Correction',
          errorName: q.reasoning_error || undefined,
          confidence: q.confidence,
          timeTakenSec: q.time_taken,
          canReopen: true,
          canDelete: false,
          raw: q,
        });
      });
    }

    // 6. Socratic Doubts (Chat Conversations)
    if (historyData?.recentDoubts) {
      historyData.recentDoubts.forEach((d) => {
        entries.push({
          id: `dbt_${d.id}`,
          rawId: String(d.id),
          timestamp: d.created_at,
          sourceType: 'doubt',
          toolTargetTab: 'doubt_chat',
          categoryLabel: 'SOCRATIC // UNCERTAINTY INQUIRY',
          title: d.title || 'Doubt Resolution Session',
          topicName: d.topic_name || 'General Physics',
          topicId: d.topic_id,
          summary: 'Student-initiated first-principles clarification targeting mechanistic ambiguity.',
          importance: 'routine',
          semanticStatus: 'neutral',
          statusLabel: 'Dialogue Logged',
          engineSignal: 'Socratic Dialogue',
          modelChange: 'Explored via First Principles',
          canReopen: true,
          canDelete: true,
          raw: d,
        });
      });
    }

    // Sort chronologically descending
    return entries.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [historyData, adaptiveEvidence]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      // Filter by type
      if (activeFilter === 'critical' && entry.importance !== 'high') return false;
      if (activeFilter === 'evidence' && entry.sourceType !== 'evidence') return false;
      if (activeFilter === 'reconstructions' && entry.sourceType !== 'reconstruction') return false;
      if (activeFilter === 'mechanisms' && entry.sourceType !== 'mechanism') return false;
      if (activeFilter === 'simulations' && entry.sourceType !== 'simulation') return false;
      if (activeFilter === 'questions' && entry.sourceType !== 'question') return false;
      if (activeFilter === 'doubts' && entry.sourceType !== 'doubt') return false;

      // Filter by pipeline stage
      if (activePipelineStage === 'errors' && entry.semanticStatus !== 'failure' && !entry.errorName) {
        return false;
      }
      if (
        activePipelineStage === 'corrections' &&
        !entry.modelChange.toLowerCase().includes('correct') &&
        !entry.modelChange.toLowerCase().includes('gap') &&
        !entry.modelChange.toLowerCase().includes('repair') &&
        !entry.modelChange.toLowerCase().includes('adjusted')
      ) {
        return false;
      }
      if (
        activePipelineStage === 'model_change' &&
        entry.importance !== 'high' &&
        !entry.modelChange.toLowerCase().includes('schema') &&
        !entry.modelChange.toLowerCase().includes('transfer') &&
        !entry.modelChange.toLowerCase().includes('invariant')
      ) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = entry.topicName.toLowerCase().includes(q);
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesSummary = entry.summary.toLowerCase().includes(q);
        const matchesError = entry.errorName?.toLowerCase().includes(q);
        const matchesChange = entry.modelChange.toLowerCase().includes(q);
        if (!matchesTopic && !matchesTitle && !matchesSummary && !matchesError && !matchesChange) {
          return false;
        }
      }

      return true;
    });
  }, [ledgerEntries, activeFilter, activePipelineStage, searchQuery]);

  // Compute longitudinal activity telemetry (Strictly activity metrics, avoiding false mastery claims)
  const telemetry = useMemo(() => {
    const totalEvents = ledgerEntries.length;
    const highPriorityEvents = ledgerEntries.filter((e) => e.importance === 'high').length;
    const validatedTransfers = ledgerEntries.filter((e) => e.modelChange.includes('Transfer')).length;
    const errorsIsolated = ledgerEntries.filter((e) => e.errorName || e.semanticStatus === 'failure').length;
    const modelMutations = ledgerEntries.filter(
      (e) => e.modelChange && e.modelChange !== 'Cognitive Observation Logged'
    ).length;

    // Time span calculation
    let spanText = 'Active Session';
    if (ledgerEntries.length >= 2) {
      const oldest = new Date(ledgerEntries[ledgerEntries.length - 1].timestamp).getTime();
      const newest = new Date(ledgerEntries[0].timestamp).getTime();
      const diffHours = Math.round((newest - oldest) / (1000 * 60 * 60));
      if (diffHours < 24) {
        spanText = `${Math.max(1, diffHours)}h timeline window`;
      } else {
        const days = Math.round(diffHours / 24);
        spanText = `${days} day${days > 1 ? 's' : ''} audit trail`;
      }
    }

    return {
      totalEvents,
      highPriorityEvents,
      validatedTransfers,
      errorsIsolated,
      modelMutations,
      spanText,
    };
  }, [ledgerEntries]);

  // Formatting helper
  const formatDateTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return {
        dateStr: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        timeStr: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
    } catch (e) {
      return { dateStr: iso, timeStr: '' };
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm max-w-lg mx-auto space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
        <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
          Synthesizing Longitudinal Reasoning Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16 font-sans text-slate-200">
      {/* ========================================================= */}
      {/* 1. TOP LONGITUDINAL OBSERVATORY HEADER                    */}
      {/* ========================================================= */}
      <div className="p-6 md:p-7 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-2xl space-y-5 relative overflow-hidden">
        {/* Ambient glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                LONGITUDINAL REASONING RECORD
              </span>
              <span className="text-xs font-mono text-slate-400">
                • Immutable Activity & Evidence Chronology
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <History className="w-7 h-7 text-cyan-400 shrink-0" />
              <span>Longitudinal Ledger</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Complete chronological audit trail of all physical inquiries, diagnostic challenges, invariant compressions, and simulation trials. Historical event count reflects learning activity; cognitive conclusions are evaluated separately via empirical falsification.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="inline-flex p-0.5 rounded-lg bg-[#07080C] border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveViewMode('ledger')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeViewMode === 'ledger'
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chronological Ledger
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('streams')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeViewMode === 'streams'
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tool Streams
              </button>
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-[#101420] hover:bg-[#151a2b] border border-slate-700 transition-all"
              title="Refresh ledger records"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Longitudinal Activity Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-slate-400">Total Logged Events</div>
            <div className="text-base md:text-lg font-bold text-white">
              {telemetry.totalEvents}
            </div>
            <div className="text-[10px] text-slate-400 truncate">{telemetry.spanText}</div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-cyan-400">Diagnostic Probes</div>
            <div className="text-base md:text-lg font-bold text-cyan-300">
              {telemetry.highPriorityEvents}
            </div>
            <div className="text-[10px] text-slate-400">High-yield trials</div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-emerald-400">Transfer Validations</div>
            <div className="text-base md:text-lg font-bold text-emerald-300">
              {telemetry.validatedTransfers}
            </div>
            <div className="text-[10px] text-slate-400">Cross-domain tests</div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-rose-400">Isolated Flaws</div>
            <div className="text-base md:text-lg font-bold text-rose-300">
              {telemetry.errorsIsolated}
            </div>
            <div className="text-[10px] text-slate-400">Causal divergences</div>
          </div>

          <div className="p-3 rounded-lg bg-[#07080C] border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase text-indigo-400">Schema Updates</div>
            <div className="text-base md:text-lg font-bold text-indigo-300">
              {telemetry.modelMutations}
            </div>
            <div className="text-[10px] text-slate-400">Model calibrations</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. REASONING TRAJECTORY PIPELINE FILTER                   */}
      {/* ========================================================= */}
      <div className="p-4 md:p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-lg space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <strong className="text-slate-200 font-bold">LONGITUDINAL REASONING TRAJECTORY</strong>
            <span className="text-slate-400 hidden sm:inline">• Filter by cognitive process stage</span>
          </span>
          {activePipelineStage !== 'all' && (
            <button
              type="button"
              onClick={() => setActivePipelineStage('all')}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline"
            >
              Reset Stage Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isSelected = activePipelineStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() =>
                  setActivePipelineStage(activePipelineStage === stage.id ? 'all' : stage.id)
                }
                className={`text-left p-3 rounded-lg border transition-all text-xs font-sans ${
                  isSelected
                    ? 'border-cyan-500/80 bg-[#101420] text-cyan-200 shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-[#07080C] hover:bg-[#0e1220] hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                    0{idx + 1}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">
                    {stage.tag}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div
                    className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isSelected ? 'text-cyan-300' : 'text-slate-200'
                    }`}
                  >
                    {stage.title}
                  </div>
                  <div className="text-[11px] text-slate-300 line-clamp-1">
                    {stage.subtext}
                  </div>
                </div>

                <p className="mt-1.5 text-[10px] text-slate-400 leading-tight line-clamp-2">
                  {stage.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SEARCH & TOOL TYPE FILTER BAR                          */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800/90 bg-[#0C0E16]">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            FILTER:
          </span>
          {[
            { id: 'all', label: 'All Records' },
            { id: 'critical', label: '★ High Priority' },
            { id: 'evidence', label: 'Adaptive Signals' },
            { id: 'reconstructions', label: 'Reconstructions' },
            { id: 'mechanisms', label: 'Compressors' },
            { id: 'simulations', label: 'Simulations' },
            { id: 'questions', label: 'Diagnostic Probes' },
            { id: 'doubts', label: 'Socratic Doubts' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                activeFilter === f.id
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'bg-[#07080C] hover:bg-[#101420] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic, flaw, or invariant..."
            className="w-full text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-[#07080C] text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/70 transition-all"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. UNIFIED CHRONOLOGICAL LEDGER VIEW                      */}
      {/* ========================================================= */}
      {activeViewMode === 'ledger' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredEntries.length}</strong> longitudinal observations
              {activePipelineStage !== 'all' && (
                <span className="text-cyan-400 ml-1.5">
                  (Focused on {activePipelineStage.toUpperCase()})
                </span>
              )}
            </span>
            <span className="text-slate-400">Chronological Sequence (Newest First)</span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0C0E16] p-12 text-center space-y-3">
              <Database className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-mono font-bold text-slate-200">
                  No Longitudinal Observations Matching Filter
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try clearing search terms or selecting another filter category. New entries are created automatically as you work through physics reasoning tools.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative pl-4 md:pl-6 space-y-3.5 before:absolute before:left-2 md:before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
              {filteredEntries.map((entry) => {
                const isExpanded = expandedEntryId === entry.id;
                const { dateStr, timeStr } = formatDateTime(entry.timestamp);

                // Semantic indicator styling
                const statusBorder =
                  entry.semanticStatus === 'success'
                    ? 'border-emerald-800/60 text-emerald-300 bg-emerald-950/80'
                    : entry.semanticStatus === 'failure'
                    ? 'border-rose-800/70 text-rose-300 bg-rose-950/80'
                    : entry.semanticStatus === 'uncertainty'
                    ? 'border-amber-800/60 text-amber-300 bg-amber-950/70'
                    : 'border-slate-800 text-slate-300 bg-[#101420]';

                const nodeIcon =
                  entry.semanticStatus === 'success' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : entry.semanticStatus === 'failure' ? (
                    <XCircle className="w-3 h-3 text-rose-400" />
                  ) : entry.semanticStatus === 'uncertainty' ? (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  );

                const isHighHierarchy = entry.importance === 'high';

                return (
                  <div key={entry.id} className="relative group">
                    {/* Timeline Node Point */}
                    <div
                      className={`absolute -left-[19px] md:-left-[27px] top-4 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isHighHierarchy
                          ? 'border-cyan-500 bg-[#0C0E16] shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                          : 'border-slate-700 bg-[#07080C]'
                      }`}
                    >
                      {nodeIcon}
                    </div>

                    {/* Entry Card */}
                    <div
                      className={`rounded-xl border transition-all ${
                        isHighHierarchy
                          ? 'border-cyan-800/60 bg-[#0C0E16] shadow-lg shadow-cyan-950/20'
                          : 'border-slate-800/90 bg-[#07080C] hover:bg-[#0C0E16] hover:border-slate-700'
                      }`}
                    >
                      <div className="p-4 md:p-5 space-y-3">
                        {/* Top Line: Timestamp & Category & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                              {entry.categoryLabel}
                            </span>

                            {isHighHierarchy && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-800/60 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>CRITICAL PROBE</span>
                              </span>
                            )}

                            <span className="text-xs font-bold text-white">
                              {entry.topicName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                            <span>{dateStr}</span>
                            <span className="text-slate-400">•</span>
                            <span>{timeStr}</span>
                          </div>
                        </div>

                        {/* Title & Core Summary */}
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <span>{entry.title}</span>
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {entry.summary}
                          </p>
                        </div>

                        {/* Diagnostic Signals & Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Semantic Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusBorder}`}
                            >
                              <span>{entry.statusLabel}</span>
                            </span>

                            {/* Signal Strength */}
                            <span className="text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 text-[10px]">
                              {entry.engineSignal}
                            </span>

                            {/* Isolated Flaw if any */}
                            {entry.errorName && (
                              <span className="text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60 text-[10px] flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-rose-400" />
                                <span>Target: {entry.errorName}</span>
                              </span>
                            )}
                          </div>

                          {/* Delta & Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-slate-300 text-[11px]">
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Delta:</span>
                              <span className="text-slate-200 font-semibold bg-[#101420] px-2 py-0.5 rounded border border-slate-800">
                                {entry.modelChange}
                              </span>
                            </div>

                            {/* Reopen Session Button */}
                            {entry.canReopen && (
                              <button
                                type="button"
                                onClick={() => handleReopenSession(entry)}
                                className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-700/60 transition-colors flex items-center gap-1"
                                title="Reopen session in relevant learning tool"
                              >
                                <span>{entry.sourceType === 'doubt' ? 'Reopen Dialogue' : 'Open in Tool'}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}

                            {/* Delete Button for Chat Conversations */}
                            {entry.canDelete && (
                              deleteConfirmId === entry.rawId ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteConversation(entry.rawId)}
                                    disabled={deletingId === entry.rawId}
                                    className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold hover:bg-rose-900 transition-colors"
                                  >
                                    {deletingId === entry.rawId ? '...' : 'Confirm'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(entry.rawId)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete conversation from history"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}

                            {/* Expand Payload Toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedEntryId(isExpanded ? null : entry.id)
                              }
                              className="text-slate-400 hover:text-slate-200 p-1 hover:bg-[#101420] rounded transition-colors"
                              title="Toggle raw telemetry payload"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Diagnostic Audit Details */}
                        {isExpanded && (
                          <div className="pt-3 mt-2 border-t border-slate-800 text-xs font-mono space-y-2.5 bg-[#07080C] p-3.5 rounded-lg border border-slate-800">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <Cpu className="w-3 h-3 text-cyan-400" />
                              <span>COGNITIVE TELEMETRY AUDIT PAYLOAD</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                              <div className="p-2 rounded bg-[#101420] border border-slate-800">
                                <span className="text-slate-400 block text-[10px]">RECORD IDENTIFIER</span>
                                <span className="text-slate-300 select-all truncate block">{entry.id}</span>
                              </div>
                              <div className="p-2 rounded bg-[#101420] border border-slate-800">
                                <span className="text-slate-400 block text-[10px]">DECISION TIME / LATENCY</span>
                                <span className="text-slate-300">
                                  {entry.timeTakenSec != null ? `${entry.timeTakenSec}s` : 'Uncalibrated'}
                                </span>
                              </div>
                              <div className="p-2 rounded bg-[#101420] border border-slate-800">
                                <span className="text-slate-400 block text-[10px]">STATED CONFIDENCE</span>
                                <span className="text-slate-300">
                                  {entry.confidence != null ? `${entry.confidence}%` : 'Unstated'}
                                </span>
                              </div>
                            </div>

                            {entry.raw && (
                              <div className="space-y-1">
                                <span className="text-slate-400 text-[10px] block">SERIALIZED SYSTEM STATE:</span>
                                <pre className="text-[10px] text-slate-300 bg-[#05060A] p-2.5 rounded border border-slate-850 overflow-x-auto max-h-40 leading-relaxed font-mono">
                                  {JSON.stringify(entry.raw, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* 5. TOOL STREAMS VIEW (GROUPED BY SCIENTIFIC INSTRUMENT)   */
        /* ========================================================= */
        <div className="space-y-6">
          {/* Stream 1: Adaptive Evidence Stream */}
          <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-md space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Adaptive Evidence Feed ({adaptiveEvidence.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Central Empirical Input Stream
              </span>
            </div>

            <div className="space-y-2">
              {adaptiveEvidence.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono py-4 text-center">No adaptive evidence events logged yet.</p>
              ) : (
                adaptiveEvidence.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg bg-[#07080C] border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                          {ev.feature ? ev.feature.replace(/_/g, ' ') : 'COGNITIVE'}
                        </span>
                        <span className="font-semibold text-white">
                          {ev.topic_name || ev.topic_id || 'Physical Principles'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-slate-400">Weight:</span>
                        <span className="font-bold text-cyan-400">
                          {ev.evidence_strength ? `${(ev.evidence_strength * 100).toFixed(0)}%` : '--'}
                        </span>
                        <span className="text-slate-400">• {new Date(ev.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {ev.evidence_summary && (
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {ev.evidence_summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono pt-1 text-slate-400">
                      {ev.error_name && (
                        <span className="text-rose-400 font-semibold">
                          Target Flaw: {ev.error_name}
                        </span>
                      )}
                      {ev.confidence != null && <span>Confidence: {ev.confidence}%</span>}
                      {ev.correct_reasoning != null && (
                        <span className={ev.correct_reasoning ? 'text-emerald-400' : 'text-amber-400'}>
                          {ev.correct_reasoning ? '✓ Causal Integrity' : '⚠️ Flaw Isolated'}
                        </span>
                      )}
                      {ev.transferable_mastery === 1 && (
                        <span className="text-violet-400 font-bold">★ Transfer Validated</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stream 2: Evaluated Mechanisms */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Minimize2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Evaluated Invariants ({historyData?.recentMechanisms?.length || 0})
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                {!historyData?.recentMechanisms?.length ? (
                  <p className="text-xs text-slate-400 font-mono py-4 text-center">No mechanisms evaluated yet.</p>
                ) : (
                  historyData.recentMechanisms.map((m) => (
                    <div key={m.id} className="p-3 rounded-lg bg-[#07080C] border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{m.title}</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {Math.round((m.overall_score || 0.75) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{m.topic_name}</span>
                        <span>{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stream 3: Close-Book Reconstructions */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Close-Book Reconstructions ({historyData?.recentReconstructions?.length || 0})
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                {!historyData?.recentReconstructions?.length ? (
                  <p className="text-xs text-slate-400 font-mono py-4 text-center">No reconstructions recorded yet.</p>
                ) : (
                  historyData.recentReconstructions.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-[#07080C] border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{r.topic_name}</span>
                        <span className="font-mono font-bold text-emerald-400">{r.score}%</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stream 4: Physical Simulation Attempts */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Simulation Trials ({historyData?.recentSimulations?.length || 0})
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                {!historyData?.recentSimulations?.length ? (
                  <p className="text-xs text-slate-400 font-mono py-4 text-center">No simulation attempts recorded.</p>
                ) : (
                  historyData.recentSimulations.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-[#07080C] border border-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-white truncate">{s.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className={s.overanalyzed ? 'text-amber-400' : 'text-emerald-400'}>
                          {s.overanalyzed ? '⚠️ Excessive Measurements' : '✓ Direct Discriminator'}
                        </span>
                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stream 5: Recent Socratic Inquiries */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-[#0C0E16] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Socratic Inquiries ({historyData?.recentDoubts?.length || 0})
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                {!historyData?.recentDoubts?.length ? (
                  <p className="text-xs text-slate-400 font-mono py-4 text-center">No doubt inquiries recorded.</p>
                ) : (
                  historyData.recentDoubts.map((d) => (
                    <div key={d.id} className="p-3 rounded-lg bg-[#07080C] border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{d.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onContextChange) {
                              onContextChange({
                                topicId: d.topic_id || 'general_physics',
                                topicName: d.topic_name || 'General Physics',
                                conversationId: d.id,
                                source: 'history_resume',
                                summary: `Resumed dialogue: ${d.title}`,
                              });
                            }
                            try {
                              localStorage.setItem('mechanism_selected_conversation_id', d.id);
                            } catch (e) {}
                            if (onNavigate) {
                              onNavigate('doubt_chat');
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-700/60 transition-colors flex items-center gap-1 shrink-0"
                        >
                          <span>Reopen</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{d.topic_name || 'General Physics'}</span>
                        <span>{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
