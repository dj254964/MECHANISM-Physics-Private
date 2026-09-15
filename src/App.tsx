import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Subject, Topic, UserModel, ActiveLearningContext } from './types';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { DoubtChatPage } from './pages/DoubtChatPage';
import { CompressorPage } from './pages/CompressorPage';
import { FirstPrinciplesPage } from './pages/FirstPrinciplesPage';
import { AdversarialPage } from './pages/AdversarialPage';
import { ReverseEngineeringPage } from './pages/ReverseEngineeringPage';
import { SimulationPage } from './pages/SimulationPage';
import { TestEnginePage } from './pages/TestEnginePage';
import { ReconstructionPage } from './pages/ReconstructionPage';
import { PersonalModelPage } from './pages/PersonalModelPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivateLoginPage, LoginSuccessPayload } from './components/auth/PrivateLoginPage';
import { FirstRunInitExperience } from './components/auth/FirstRunInitExperience';
import { SessionGreetingToast, getTimeAwareGreeting } from './components/auth/SessionGreetingToast';
import { MechanismLogo } from './components/branding/MechanismLogo';
import { NoirBackground } from './components/layout/NoirBackground';

export default function App() {
  // Authentication state for private MECHANISM application
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isFirstRunInit, setIsFirstRunInit] = useState<boolean>(false);
  const [isAppVisible, setIsAppVisible] = useState<boolean>(false);
  const [hasGreeting, setHasGreeting] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionUser, setSessionUser] = useState<{ username: string; displayName: string } | null>(null);
  const [sessionGreeting, setSessionGreeting] = useState<string | null>(null);

  // Default opening experience is Doubt Chat per user requirement
  const [activeTab, setActiveTab] = useState<NavTab>('doubt_chat');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Check prefers-reduced-motion for smooth accessible fade-in
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Cleanup fade timer on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  // Handle greeting exit: wait 200–300ms of deep noir silence, then smoothly fade in the application
  const handleGreetingExitComplete = useCallback(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }
    fadeTimerRef.current = setTimeout(() => {
      setHasGreeting(false);
      setIsAppVisible(true);
    }, 250); // Exactly 250ms of pure noir background before application fade-in
  }, []);

  // If authenticated without a greeting, reveal application directly
  useEffect(() => {
    if (isAuthenticated && !hasGreeting && !isAppVisible) {
      setIsAppVisible(true);
    }
  }, [isAuthenticated, hasGreeting, isAppVisible]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [userModel, setUserModel] = useState<UserModel | null>(null);
  const [activeContext, setActiveContext] = useState<ActiveLearningContext | null>(null);

  // Default to permanent dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const refreshUserModel = () => {
    fetch('/api/user-model')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setUserModel(json.data);
        }
      })
      .catch(console.error);
  };

  const refreshLearningContext = () => {
    fetch('/api/learning-context')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setActiveContext(json.data);
        }
      })
      .catch(console.error);
  };

  const loadApplicationData = useCallback(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setSubjects(json.data);
        }
      })
      .catch(console.error);

    fetch('/api/topics')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setTopics(json.data);
        }
      })
      .catch(console.error);

    refreshUserModel();
    refreshLearningContext();
  }, []);

  // Initial Authentication Check
  useEffect(() => {
    const token =
      sessionStorage.getItem('mechanism_private_session_token') ||
      localStorage.getItem('mechanism_private_session_token');

    if (!token) {
      setIsCheckingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    // Verify session token server-side
    fetch('/api/auth/session', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.authenticated) {
          setIsAuthenticated(true);
          setIsAppVisible(false);
          setHasGreeting(true);
          const user = json.user || { username: 'Scholar', displayName: 'Scholar' };
          setSessionUser(user);
          // Show time-aware greeting on authenticated session restoration
          setSessionGreeting(getTimeAwareGreeting(user.displayName || 'Scholar'));
          loadApplicationData();
        } else {
          // Token invalid or expired: clear from storage
          localStorage.removeItem('mechanism_private_session_token');
          sessionStorage.removeItem('mechanism_private_session_token');
          setIsAuthenticated(false);
        }
      })
      .catch((err) => {
        console.error('Session verification error:', err);
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [loadApplicationData]);

  const handleLoginSuccess = (payload: LoginSuccessPayload) => {
    setIsAuthenticated(true);
    setSessionUser(payload.user);
    setIsAppVisible(false);

    if (payload.isFirstRunInit) {
      setIsFirstRunInit(true);
    } else {
      // Show time-aware greeting on ordinary login.
      setHasGreeting(true);
      setSessionGreeting(
        getTimeAwareGreeting(payload.user.displayName || 'Scholar')
      );
    }

    loadApplicationData();
  };

  const handleAccountDeleted = () => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    localStorage.removeItem('mechanism_private_session_token');
    sessionStorage.removeItem('mechanism_private_session_token');
    setIsAuthenticated(false);
    setIsFirstRunInit(false);
    setIsAppVisible(false);
    setHasGreeting(false);
    setSessionUser(null);
    setSessionGreeting(null);
    setActiveContext(null);
    setSelectedTopicId(undefined);
    setUserModel(null);
    setActiveTab('doubt_chat');
  };

  const handleLogout = async () => {
    const token =
      sessionStorage.getItem('mechanism_private_session_token') ||
      localStorage.getItem('mechanism_private_session_token');

    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      localStorage.removeItem('mechanism_private_session_token');
      sessionStorage.removeItem('mechanism_private_session_token');
      setIsAuthenticated(false);
      setIsAppVisible(false);
      setHasGreeting(false);
      setSessionUser(null);
      setSessionGreeting(null);
    }
  };

  // Synchronize selectedTopicId with activeContext
  useEffect(() => {
    if (activeContext) {
      const match = topics.find(
        (t) =>
          (activeContext.topicId && t.id === activeContext.topicId) ||
          t.name.toLowerCase() === activeContext.topicName.toLowerCase()
      );
      if (match) {
        setSelectedTopicId(match.id);
      } else {
        setSelectedTopicId(undefined);
      }
    } else {
      setSelectedTopicId(undefined);
    }
  }, [activeContext, topics]);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  // Authoritative topic selection handler: updates activeContext as single source of truth
  const handleSelectTopic = (topicId: string | undefined) => {
    if (!topicId) {
      setSelectedTopicId(undefined);
      setActiveContext(null);
      fetch('/api/learning-context', { method: 'DELETE' }).catch(console.error);
      return;
    }

    const found = topics.find((t) => t.id === topicId);
    if (found) {
      setSelectedTopicId(found.id);
      const newContext: ActiveLearningContext = {
        source: found.is_custom || found.id.startsWith('top_custom_') ? 'custom_topic' : 'predefined_topic',
        topicId: found.id,
        topicName: found.name,
        subjectId: found.subject_id,
        summary: found.description || `Active curricular focus on ${found.name}`,
        keyConcepts: [found.name],
        detectedGaps: [],
        unresolvedQuestions: [],
        lastUpdated: new Date().toISOString(),
      };
      setActiveContext(newContext);
      fetch('/api/learning-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContext),
      }).catch(console.error);
    }
  };

  // Authoritative context change handler from Doubt Chat or other tools
  const handleContextChange = (newContext: ActiveLearningContext | null) => {
    setActiveContext(newContext);
    if (!newContext) {
      setSelectedTopicId(undefined);
      fetch('/api/learning-context', { method: 'DELETE' }).catch(console.error);
    } else {
      const match = topics.find(
        (t) =>
          (newContext.topicId && t.id === newContext.topicId) ||
          t.name.toLowerCase() === newContext.topicName.toLowerCase()
      );
      if (match) {
        setSelectedTopicId(match.id);
      } else {
        setSelectedTopicId(undefined);
      }
      fetch('/api/learning-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContext),
      }).catch(console.error);
    }
  };

  const handleAddCustomTopic = async (customName: string, subjectId?: string): Promise<Topic | null> => {
    const trimmed = customName.trim();
    if (!trimmed) return null;

    // Check if already in topics
    const existing = topics.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleSelectTopic(existing.id);
      return existing;
    }

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          subject_id: subjectId || selectedSubjectId || 'sub_physics',
          chapter: 'Custom Reasoning Concept',
          description: `User-defined Physics topic: ${trimmed}`,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newTopic: Topic = json.data;
        setTopics((prev) => [newTopic, ...prev.filter((t) => t.id !== newTopic.id)]);
        
        // Immediately establish Active Context with the new custom topic
        const newContext: ActiveLearningContext = {
          source: 'custom_topic',
          topicId: newTopic.id,
          topicName: newTopic.name,
          subjectId: newTopic.subject_id,
          summary: newTopic.description || `User-defined Physics topic: ${newTopic.name}`,
          keyConcepts: [newTopic.name],
          detectedGaps: [],
          unresolvedQuestions: [],
          lastUpdated: new Date().toISOString(),
        };
        setSelectedTopicId(newTopic.id);
        setActiveContext(newContext);
        fetch('/api/learning-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newContext),
        }).catch(console.error);

        // Also refresh user model asynchronously
        fetch('/api/user-model')
          .then((r) => r.json())
          .then((umJson) => {
            if (umJson.success && umJson.data) {
              setUserModel(umJson.data);
            }
          })
          .catch(() => {});

        return newTopic;
      }
    } catch (e) {
      console.error('Failed to create custom topic on server', e);
    }

    // Client-side fallback if server fails
    const fallback: Topic = {
      id: 'top_custom_' + Date.now(),
      subject_id: subjectId || selectedSubjectId || 'sub_physics',
      name: trimmed,
      chapter: 'Custom Reasoning Concept',
      description: `User-defined Physics topic: ${trimmed}`,
      is_custom: true,
    };
    setTopics((prev) => [fallback, ...prev]);
    const newContext: ActiveLearningContext = {
      source: 'custom_topic',
      topicId: fallback.id,
      topicName: fallback.name,
      subjectId: fallback.subject_id,
      summary: fallback.description || `User-defined Physics topic: ${fallback.name}`,
      keyConcepts: [fallback.name],
      detectedGaps: [],
      unresolvedQuestions: [],
      lastUpdated: new Date().toISOString(),
    };
    setSelectedTopicId(fallback.id);
    setActiveContext(newContext);
    fetch('/api/learning-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContext),
    }).catch(console.error);
    return fallback;
  };

  const activeModeLabelMap: Record<NavTab, string> = {
    dashboard: 'Cognitive Cockpit',
    doubt_chat: 'Doubt Engine',
    compressor: 'Mechanism Compressor',
    first_principles: 'First Principles',
    adversarial: 'Adversarial Attack',
    reverse_engineering: 'Reverse Engineering',
    simulation: 'Physics Simulation',
    mcq_test: 'Reasoning Tests',
    reconstruction: 'Close-Book Recall',
    user_model: 'Personal Model',
    history: 'Longitudinal Ledger',
    settings: 'Architecture & Configuration',
  };

  // 1. Initial Checking Screen (completely hides application UI while verifying)
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#05070e] flex items-center justify-center select-none font-sans z-50">
        <div className="flex flex-col items-center gap-4">
          <MechanismLogo variant="full" size="lg" glow={true} alt="MECHANISM" />
          <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500 tracking-wide">
            Validating private session...
          </span>
        </div>
      </div>
    );
  }

  // 2. Full-Page Private Login Gate (completely replaces application UI if unauthenticated)
  if (!isAuthenticated) {
    return <PrivateLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2.5 First-Run Cinematic Initialization Sequence (FIRST RUN ONLY)
  if (isFirstRunInit) {
    return (
      <FirstRunInitExperience
        username={sessionUser?.displayName || sessionUser?.username || 'Scholar'}
        onComplete={() => {
          setIsFirstRunInit(false);
          setIsAppVisible(false);
          setHasGreeting(true);

          setSessionGreeting(
            getTimeAwareGreeting(
              sessionUser?.displayName || sessionUser?.username || 'Scholar'
            )
          );
        }}
      />
    );
  }

  // 3. Authenticated Application
  return (
    <div className="min-h-screen bg-[#05070e] text-slate-100 flex flex-col font-sans transition-colors duration-200 relative selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Scientific Background Overlay (coordinate traces, faint field lines, sparse drifting particles) */}
      <NoirBackground />

      {/* Session Entry Time-Aware Greeting Toast - sits above noir background */}
      <SessionGreetingToast
        greeting={sessionGreeting}
        onDismiss={() => setSessionGreeting(null)}
        onExitComplete={handleGreetingExitComplete}
      />

      {/* Authenticated Application Content - smooth fade-in after greeting & noir interval */}
      <motion.div
        className="relative z-10 flex flex-col min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: isAppVisible ? 1 : 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          pointerEvents: isAppVisible ? 'auto' : 'none',
        }}
      >
        {/* Top Academic Header */}
      <Header
        darkMode={isDarkMode}
        setDarkMode={setIsDarkMode}
        subjects={subjects}
        topics={topics}
        selectedTopicId={selectedTopicId}
        activeContext={activeContext}
        onSelectTopic={handleSelectTopic}
        onAddCustomTopic={handleAddCustomTopic}
        activeModeLabel={activeModeLabelMap[activeTab]}
        userDisplayName={sessionUser?.displayName}
        onLogout={handleLogout}
        onNavigateToSettings={() => setActiveTab('settings')}
      />

      {/* Primary Navigation Tabs */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full ${
          activeTab === 'doubt_chat'
            ? 'h-[calc(100vh-100px)] overflow-hidden p-0 max-w-full flex flex-col'
            : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5'
        }`}
      >
        {activeTab === 'dashboard' && (
          <DashboardPage
            userModel={userModel}
            topics={topics}
            activeContext={activeContext}
            onNavigate={setActiveTab}
            onSelectTopic={handleSelectTopic}
          />
        )}

        {activeTab === 'doubt_chat' && (
          <DoubtChatPage
            selectedTopic={selectedTopic}
            activeContext={activeContext}
            onContextChange={handleContextChange}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'compressor' && (
          <CompressorPage
            selectedTopic={selectedTopic}
            activeContext={activeContext}
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onNavigate={setActiveTab}
            onNewDiscussion={() => {
              handleContextChange(null);
              setActiveTab('doubt_chat');
            }}
          />
        )}

        {activeTab === 'first_principles' && (
          <FirstPrinciplesPage
            selectedTopic={selectedTopic}
            activeContext={activeContext}
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onNavigate={setActiveTab}
            onNewDiscussion={() => {
              handleContextChange(null);
              setActiveTab('doubt_chat');
            }}
          />
        )}

        {activeTab === 'adversarial' && (
          <AdversarialPage
            selectedTopic={selectedTopic}
            activeContext={activeContext}
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onNavigate={setActiveTab}
            onNewDiscussion={() => {
              handleContextChange(null);
              setActiveTab('doubt_chat');
            }}
          />
        )}

        {activeTab === 'reverse_engineering' && (
          <ReverseEngineeringPage
            selectedTopic={selectedTopic}
            activeContext={activeContext}
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onNavigate={setActiveTab}
            onNewDiscussion={() => {
              handleContextChange(null);
              setActiveTab('doubt_chat');
            }}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationPage
            selectedTopic={selectedTopic}
            activeContext={activeContext}
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onNavigate={setActiveTab}
            onNewDiscussion={() => {
              handleContextChange(null);
              setActiveTab('doubt_chat');
            }}
          />
        )}

        {activeTab === 'mcq_test' && (
          <TestEnginePage
            selectedTopic={selectedTopic}
            topics={topics}
            userModel={userModel}
            activeContext={activeContext}
            onRefreshUserModel={refreshUserModel}
            onSelectTopic={handleSelectTopic}
            onNavigate={setActiveTab}
            onNewDiscussion={() => {
              handleContextChange(null);
              setActiveTab('doubt_chat');
            }}
          />
        )}

        {activeTab === 'reconstruction' && (
          <ReconstructionPage
            selectedTopic={selectedTopic}
            activeContext={activeContext}
            topics={topics}
            onRefreshUserModel={refreshUserModel}
            onSelectTopic={handleSelectTopic}
            onNavigate={setActiveTab}
            onNewDiscussion={() => {
              handleContextChange(null);
              setActiveTab('doubt_chat');
            }}
          />
        )}

        {activeTab === 'user_model' && (
          <PersonalModelPage
            userModel={userModel}
            onNavigate={setActiveTab}
            onRefreshUserModel={refreshUserModel}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onNavigate={setActiveTab}
            onContextChange={handleContextChange}
            onSelectTopic={handleSelectTopic}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage onDeleteAccountComplete={handleAccountDeleted} />
        )}
      </main>

      {/* Academic Footer - hidden during Doubt Chat to give full classic AI chat immersion */}
      {activeTab !== 'doubt_chat' && (
        <footer className="border-t border-white/[0.08] py-3 bg-[#07080c]/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
            <div>
              <span className="font-bold tracking-wider text-slate-200">MECHANISM</span>
              <span className="text-slate-400"> • Reasoning-First Physics Cognitive Engine</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                AI: Gemini 3 Flash
              </span>
              <span>Database: SQLite (PRAGMA foreign_keys)</span>
              <span>Security: Zero-Client Secrets</span>
            </div>
          </div>
        </footer>
      )}
      </motion.div>
  </div>
);
}
