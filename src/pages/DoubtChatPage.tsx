import React, { useState, useEffect, useRef } from 'react';
import { ChatConversation, ChatMessage, Topic, ChatAttachment, ActiveLearningContext } from '../types';
import { NavTab } from '../components/Navigation';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { AiMetadataBadge, AntiOveranalysisBanner } from '../components/AiMetadataBadge';
import {
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Trash2,
  Paperclip,
  Camera,
  CameraOff,
  SwitchCamera,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  X,
  PanelLeftClose,
  PanelLeft,
  Copy,
  Check,
  Search,
  Maximize2,
  Download,
  Edit2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface DoubtChatPageProps {
  selectedTopic: Topic | undefined;
  activeContext?: ActiveLearningContext | null;
  onContextChange?: (newContext: ActiveLearningContext | null) => void;
  onNavigate?: (tab: NavTab) => void;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit for PDFs, Word documents, and high-clarity images

const HIGH_YIELD_PROMPTS = [
  {
    category: 'Analytical Mechanics',
    label: 'Lagrangian vs Newtonian Formalism',
    query: 'How does the Principle of Least Action derive the Euler-Lagrange equations, and why does generalized coordinate invariance eliminate constraint forces that complicate Newtonian vector mechanics?',
    type: 'Foundational',
  },
  {
    category: 'Electromagnetism',
    label: 'Maxwell Displacement Current & Wave Equation',
    query: 'Why did Maxwell introduce displacement current ε₀(∂E/∂t) to Ampère’s law, and how does this single term mathematically necessitate electromagnetic wave propagation at speed c = 1/√(μ₀ε₀)?',
    type: 'Derivation',
  },
  {
    category: 'Quantum Mechanics',
    label: 'Finite Potential Well & Quantum Tunneling',
    query: 'Why does the wave function in quantum mechanics penetrate exponentially into classically forbidden potential barriers (E < V₀), and what determines transmission probability in tunneling?',
    type: 'Mechanism',
  },
  {
    category: 'Statistical Physics',
    label: 'Microscopic Entropy & Reversibility',
    query: 'How does Boltzmann’s statistical definition S = k_B ln(Ω) reconcile time-reversible microscopic Hamiltonian dynamics with the irreversible macroscopic Second Law of Thermodynamics?',
    type: 'Paradox',
  },
];

export const DoubtChatPage: React.FC<DoubtChatPageProps> = ({
  selectedTopic,
  activeContext,
  onContextChange,
  onNavigate,
}) => {
  // Chat state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cognitive flaw context for cross-context awareness
  const [cognitiveFlaws, setCognitiveFlaws] = useState<{
    target_flaw?: string;
    flaw_confidence?: number;
    flaw_stage?: number;
    specific_failure?: string;
  } | null>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  // File upload & camera state
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  // Live Camera stream state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturingFlash, setIsCapturingFlash] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Format bytes to human readable
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to read deleted IDs from local cache
  const getDeletedConversationIds = (): string[] => {
    try {
      const stored = localStorage.getItem('mechanism_deleted_chat_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Helper to mark conversation ID as permanently deleted
  const markConversationAsDeleted = (id: string) => {
    try {
      const current = getDeletedConversationIds();
      if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem('mechanism_deleted_chat_ids', JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Could not store deleted chat id in localStorage', e);
    }
  };

  // Load conversations list with deleted filter
  const loadConversations = async (autoSelectFirst = false) => {
    try {
      const deletedIds = getDeletedConversationIds();
      const res = await fetch('/api/chat/conversations');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Filter out any conversations marked deleted locally or on server
        const activeList = json.data.filter((c: any) => !deletedIds.includes(c.id));
        setConversations(activeList);
        if (autoSelectFirst && activeList.length > 0 && !currentConversationId) {
          loadConversationDetails(activeList[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      setCurrentConversationId(id);
      setErrorMessage(null);
      const res = await fetch(`/api/chat/conversations/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data.messages || []);
        if (json.data.learning_context) {
          try {
            const lc = typeof json.data.learning_context === 'string'
              ? JSON.parse(json.data.learning_context)
              : json.data.learning_context;
            onContextChange?.(lc);
          } catch {}
        } else {
          fetch(`/api/chat/conversations/${id}/context`)
            .then((r) => r.json())
            .then((cJson) => {
              if (cJson.success && cJson.data) {
                onContextChange?.(cJson.data);
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error('Failed to load conversation details', e);
    }
  };

  // Fetch cognitive flaws profile on mount
  useEffect(() => {
    loadConversations(false);
    fetch('/api/user-model/flaws')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setCognitiveFlaws(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Restore active conversation if context contains conversationId
  useEffect(() => {
    if (activeContext?.conversationId && !currentConversationId) {
      loadConversationDetails(activeContext.conversationId);
    }
  }, [activeContext?.conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  const handleStartNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputText('');
    setPendingAttachments([]);
    setErrorMessage(null);
    setFileError(null);
    onContextChange?.(null);
    fetch('/api/learning-context', { method: 'DELETE' }).catch(() => {});
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      // 1. Immediately store in local suppression list so reload never shows it
      markConversationAsDeleted(id);

      // 2. Perform server deletion
      await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });

      // 3. Update local state
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (currentConversationId === id) {
        if (updated.length > 0) {
          loadConversationDetails(updated[0].id);
        } else {
          handleStartNewChat();
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  };

  const handleClearAllConversations = async () => {
    if (!window.confirm('Delete all past doubt chat sessions? This will permanently clear your conversation history.')) {
      return;
    }
    try {
      // Record all existing IDs as deleted
      conversations.forEach((c) => markConversationAsDeleted(c.id));
      await fetch('/api/chat/conversations', { method: 'DELETE' });
      setConversations([]);
      handleStartNewChat();
    } catch (e) {
      console.error('Failed to clear conversations', e);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await fetch(`/api/chat/messages/${msgId}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (e) {
      console.error('Failed to delete message', e);
    }
  };

  const handleSaveTitleEdit = async (id: string) => {
    if (!editedTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      await fetch(`/api/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editedTitle.trim() } : c))
      );
    } catch (e) {
      console.error('Failed to update conversation title', e);
    } finally {
      setEditingTitleId(null);
    }
  };

  // Handle file uploads (Images, PDFs & Word documents up to 100MB, NO camera access)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    for (const file of fileList) {
      // Validate file size: 100MB limit
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(
          `"${file.name}" (${formatFileSize(file.size)}) exceeds the 100MB limit for scientific files. Please attach a file under 100MB.`
        );
        continue;
      }

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isWord =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc');
      const isImg = file.type.startsWith('image/');

      if (!isPdf && !isImg && !isWord) {
        setFileError(`"${file.name}" is not supported. Please attach diagrams, images, PDF documents, or Word documents (.docx, .doc).`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultString = uploadEvent.target?.result as string;
        const base64Data = resultString.split(',')[1] || '';

        const attachment: ChatAttachment = {
          name: file.name,
          type: isPdf ? 'pdf' : isWord ? 'doc' : 'image',
          mimeType:
            file.type ||
            (isPdf
              ? 'application/pdf'
              : isWord
              ? file.name.toLowerCase().endsWith('.doc')
                ? 'application/msword'
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'image/jpeg'),
          size: file.size,
          dataUrl: resultString,
          base64Data,
        };

        setPendingAttachments((prev) => [...prev, attachment]);
      };

      reader.readAsDataURL(file);
    }

    // Reset input value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingAttachment = (indexToRemove: number) => {
    setPendingAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Safe helper to stop camera media tracks
  const stopCurrentStream = (streamToStop?: MediaStream | null) => {
    const s = streamToStop !== undefined ? streamToStop : cameraStream;
    if (s) {
      s.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCurrentStream();
    };
  }, []);

  // Connect camera stream to video element whenever stream changes or modal renders
  useEffect(() => {
    if (isCameraModalOpen && videoRef.current && cameraStream && !capturedImage) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => {
        console.warn('Camera video auto-play prevented or failed:', err);
      });
    }
  }, [cameraStream, isCameraModalOpen, capturedImage]);

  // Request camera access and start live stream
  const startCameraStream = async (facing: 'environment' | 'user') => {
    setIsCameraInitializing(true);
    setCameraError(null);
    setCapturedImage(null);

    // Stop existing stream if any
    if (cameraStream) {
      stopCurrentStream(cameraStream);
      setCameraStream(null);
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsCameraInitializing(false);
      setCameraError(
        'Direct camera access is not supported by your browser or container environment. You can use the "Device Camera" button below.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback to generic constraints if specific facingMode constraint fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setCameraStream(stream);
      setIsCameraInitializing(false);

      // Check device inventory for multi-camera switch availability
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }
    } catch (err: any) {
      setIsCameraInitializing(false);
      console.error('Camera stream access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission was denied. Please allow camera permissions in your browser or use the native camera option below.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is already in use by another app or tab.');
      } else {
        setCameraError(err.message || 'Unable to access camera.');
      }
    }
  };

  const handleOpenCameraModal = () => {
    setIsCameraModalOpen(true);
    setCapturedImage(null);
    startCameraStream(cameraFacingMode);
  };

  const handleCloseCameraModal = () => {
    stopCurrentStream();
    setCameraStream(null);
    setIsCameraModalOpen(false);
    setCapturedImage(null);
    setCameraError(null);
    setIsCapturingFlash(false);
  };

  const handleSwitchCamera = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Trigger visual shutter flash
    setIsCapturingFlash(true);
    setTimeout(() => setIsCapturingFlash(false), 180);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
  };

  const handleAcceptPhoto = () => {
    if (!capturedImage) return;

    const base64Data = capturedImage.split(',')[1] || '';
    const approxSize = Math.round((base64Data.length * 3) / 4);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `camera_photo_${timestampStr}.jpg`;

    const attachment: ChatAttachment = {
      name: filename,
      type: 'image',
      mimeType: 'image/jpeg',
      size: approxSize,
      dataUrl: capturedImage,
      base64Data,
    };

    setPendingAttachments((prev) => [...prev, attachment]);
    handleCloseCameraModal();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputText).trim();
    if ((!query && pendingAttachments.length === 0) || loading) return;

    const attachmentsToSend = [...pendingAttachments];
    setInputText('');
    setPendingAttachments([]);
    setErrorMessage(null);
    setFileError(null);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: 'temp_u_' + Date.now(),
      conversation_id: currentConversationId || 'pending',
      role: 'user',
      content: query || (attachmentsToSend.length > 0 ? `[Attached: ${attachmentsToSend.map((a) => a.name).join(', ')}]` : ''),
      attachments: attachmentsToSend,
      provider: 'Gemini',
      model: 'gemini-3.8-flash',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: currentConversationId,
          content: query,
          topic_id: selectedTopic?.id,
          attachments: attachmentsToSend,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to receive response from Gemini');
      }

      const assistantMsg = json.data;
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        tempUserMsg,
        assistantMsg,
      ]);

      if (json.learning_context) {
        onContextChange?.(json.learning_context);
      }

      if (!currentConversationId && assistantMsg.conversation_id) {
        setCurrentConversationId(assistantMsg.conversation_id);
        loadConversations();
      } else {
        loadConversations();
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Gemini is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const currentConvo = conversations.find((c) => c.id === currentConversationId);

  const filteredConversations = conversations.filter((c) =>
    searchFilter.trim() === ''
      ? true
      : c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (c.topic_name && c.topic_name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="flex w-full h-full bg-[#07080c] overflow-hidden font-sans text-slate-200">
      {/* Left Sidebar: Physical Reasoning Sessions Panel */}
      <aside
        className={`flex flex-col border-r border-white/[0.08] bg-[#0c0e16] transition-all duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'w-80' : 'w-0 border-r-0'
        } overflow-hidden`}
      >
        {/* Sidebar Header with New Chat */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-[#090b10]">
          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:opacity-95 text-slate-950 text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
            title="Start new physical reasoning session"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Doubt Session</span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#101420] transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search Past Chats */}
        <div className="p-3 border-b border-white/[0.08] bg-[#0c0e16]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search previous doubts..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs bg-[#101420] text-slate-200 placeholder-slate-500 border border-white/[0.08] focus:border-sky-500/50 focus:outline-none transition-colors"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">
            <span>Doubt Sessions</span>
            <span>{filteredConversations.length}</span>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto opacity-30 text-slate-400" />
              <p>No doubt sessions found.</p>
              <p className="text-[11px] text-slate-500">Enter a physics doubt or conceptual question to initiate inquiry.</p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = currentConversationId === c.id;
              const isEditing = editingTitleId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => !isEditing && loadConversationDetails(c.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#101420] text-slate-100 font-medium border-l-2 border-l-sky-400 border border-sky-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#101420]/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitleEdit(c.id);
                              if (e.key === 'Escape') setEditingTitleId(null);
                            }}
                            autoFocus
                            className="w-full text-xs px-1.5 py-0.5 rounded border border-sky-500 bg-[#090b10] text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTitleEdit(c.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="truncate font-medium">{c.title}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                            {c.topic_name && (
                              <span className="truncate max-w-[120px] text-sky-400">
                                {c.topic_name}
                              </span>
                            )}
                            <span>{new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(c.id);
                          setEditedTitle(c.title);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-slate-300"
                        title="Rename title"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, c.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                        title="Delete chat session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Reasoning Specs & Management */}
        <div className="p-3 border-t border-white/[0.08] bg-[#090b10] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]"></span>
              <span className="font-mono text-[10px] text-slate-300">Diagnostic Model</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">100MB Max File</span>
          </div>
          {conversations.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllConversations}
              className="w-full py-1 px-2 text-[11px] rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 flex items-center justify-center gap-1.5 transition-colors font-mono cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All Sessions</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Physics Inquiry Laboratory Interface Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#07080c]">
        {/* Top Header Bar */}
        <header className="h-12 px-4 border-b border-white/[0.08] bg-[#0c0e16]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#101420] transition-colors cursor-pointer"
                title="Open past doubts history"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xs md:text-sm font-semibold text-slate-200 truncate">
                {currentConvo ? currentConvo.title : 'New Physics Reasoning Session'}
              </h1>
              {selectedTopic ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#101420] text-sky-300 border border-sky-500/30 truncate">
                  Scope: {selectedTopic.name}
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#101420] text-slate-400 border border-white/[0.08] truncate">
                  Scope: Universal Invariants
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNewChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:bg-[#101420] border border-white/[0.08] transition-colors cursor-pointer"
              title="Start a fresh empty discussion"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Session</span>
            </button>
          </div>
        </header>

        {/* Cross-Context Physical Misconception Adaptation Banner */}
        {cognitiveFlaws?.target_flaw && (
          <div className="px-4 py-2 bg-amber-950/20 border-b border-amber-800/40 text-amber-200 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
              <span className="font-semibold shrink-0">Active Misconception Focus:</span>
              <span className="font-mono text-[11px] truncate text-amber-300">
                {cognitiveFlaws.target_flaw}
                {cognitiveFlaws.flaw_confidence ? ` (${(cognitiveFlaws.flaw_confidence * 100).toFixed(0)}% confidence)` : ''}
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400/70 shrink-0 hidden sm:inline">
              Synchronized across diagnostic probes & simulations
            </span>
          </div>
        )}

        {/* Active Learning Context Banner */}
        {activeContext?.topicName ? (
          <div className="px-4 py-2 bg-[#0c0e16] border-b border-sky-500/30 text-xs flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)] shrink-0"></span>
              <span className="text-slate-400 font-medium shrink-0">Active Reasoning Focus:</span>
              <span className="font-semibold text-sky-200 truncate">{activeContext.topicName}</span>
              {activeContext.detectedGaps && activeContext.detectedGaps.length > 0 && (
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950/50 text-rose-300 border border-rose-800/50">
                  {activeContext.detectedGaps.length} friction point{activeContext.detectedGaps.length > 1 ? 's' : ''} detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-slate-400 hidden lg:inline mr-1">Direct Activities:</span>
              <button
                type="button"
                onClick={() => onNavigate?.('mcq_test')}
                className="px-2.5 py-1 rounded bg-sky-950/60 hover:bg-sky-900/80 text-sky-200 hover:text-white border border-sky-700/50 text-[11px] font-medium flex items-center gap-1 transition-all duration-150 cursor-pointer"
                title="Generate an adaptive test focused on this concept and detected gaps"
              >
                <span>Probe Concept</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('compressor')}
                className="px-2 py-1 rounded bg-[#101420] hover:bg-[#151c2e] text-slate-300 hover:text-white border border-white/[0.08] text-[11px] font-medium flex items-center gap-1 transition-all duration-150 cursor-pointer"
                title="Evaluate causal sequence in Mechanism Compressor"
              >
                <span>Compress</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('adversarial')}
                className="px-2 py-1 rounded bg-[#101420] hover:bg-[#151c2e] text-slate-300 hover:text-white border border-white/[0.08] text-[11px] font-medium hidden sm:flex items-center gap-1 transition-all duration-150 cursor-pointer"
                title="Stress-test axioms in Adversarial Attack"
              >
                <span>Stress Test</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2 bg-[#0c0e16] border-b border-white/[0.08] text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
              <span className="text-slate-500 font-medium shrink-0">Active Context:</span>
              <span className="font-mono text-slate-400 font-medium">None</span>
              <span className="text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-500 hidden sm:inline text-[11px] truncate">
                Context is calibrated automatically as dialogue progresses, or via the topic picker.
              </span>
            </div>
          </div>
        )}

        {/* Middle: Scrollable Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto py-8 md:py-12 flex flex-col items-center text-center space-y-6 animate-fadeIn">
              <div className="w-12 h-12 rounded-xl bg-[#101420] border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="space-y-2 max-w-xl">
                <h2 className="text-xl md:text-2xl font-bold font-sans text-slate-100 tracking-tight">
                  Mechanistic Physics Inquiry Laboratory
                </h2>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  Anchor physical systems in conservation laws, trace causal mechanics, isolate crucial variables, and examine problem sets (PDFs & Word files) or apparatus diagrams up to 100MB.
                </p>
              </div>

              {/* Supported Capabilities Pill */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="px-2.5 py-1 rounded bg-[#101420] border border-white/[0.08]">
                  📄 Problem Sets & Notes (≤ 100MB)
                </span>
                <span className="px-2.5 py-1 rounded bg-[#101420] border border-white/[0.08]">
                  🔬 Scientific Apparatus & Diagrams
                </span>
                <span className="px-2.5 py-1 rounded bg-[#101420] border border-white/[0.08]">
                  🧠 Causal Invariant Engine
                </span>
              </div>

              {/* High Yield Prompt Starters */}
              <div className="w-full max-w-2xl text-left space-y-2.5 pt-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold px-1">
                  High-Yield Physical Inquiry Templates
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {HIGH_YIELD_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(p.query)}
                      className="p-3.5 rounded-xl bg-[#0c0e16] border border-white/[0.08] hover:border-sky-500/40 text-left transition-all duration-150 hover:-translate-y-0.5 group flex flex-col justify-between gap-2 shadow-sm cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono text-sky-300 font-medium bg-[#101420] px-2 py-0.5 rounded border border-sky-900/40">
                            {p.category}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#160f22] text-violet-300 border border-violet-900/30">
                            {p.type}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                          {p.label}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                          "{p.query}"
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Run inquiry</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                const hasAttachments = m.attachments && m.attachments.length > 0;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                  >
                    {/* Message Bubble Container */}
                    <div
                      className={`rounded-2xl text-sm transition-all ${
                        isUser
                          ? 'bg-[#0d1527] border border-sky-500/30 text-slate-100 shadow-md rounded-br-xs p-4 md:p-5 max-w-2xl'
                          : 'bg-[#0c0e16] border border-white/[0.08] text-slate-200 shadow-sm rounded-bl-xs p-5 md:p-6 w-full'
                      }`}
                    >
                      {/* Attachments Section if present in message */}
                      {hasAttachments && (
                        <div className={`mb-3 space-y-2 ${isUser ? 'border-b border-sky-900/40 pb-3' : 'border-b border-white/[0.08] pb-3'}`}>
                          <span className={`text-[10px] font-mono uppercase tracking-wider block ${isUser ? 'text-sky-300' : 'text-slate-400'}`}>
                            Attached Evidence / Artifact ({m.attachments!.length})
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {m.attachments!.map((att, attIdx) => (
                              <div
                                key={attIdx}
                                className={`flex items-center gap-2 p-2 rounded-lg border ${
                                  isUser
                                    ? 'bg-[#121c33] border-sky-800/60 text-slate-100'
                                    : 'bg-[#101420] border-white/[0.08] text-slate-200'
                                }`}
                              >
                                {att.type === 'pdf' ? (
                                  <>
                                    <div className="w-8 h-8 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="text-left pr-2">
                                      <div className="text-xs font-medium truncate max-w-[180px]" title={att.name}>
                                        {att.name}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-400">
                                        PDF • {formatFileSize(att.size)}
                                      </div>
                                    </div>
                                  </>
                                ) : att.type === 'doc' || att.type === 'docx' || att.name.toLowerCase().endsWith('.docx') || att.name.toLowerCase().endsWith('.doc') ? (
                                  <>
                                    <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="text-left pr-2">
                                      <div className="text-xs font-medium truncate max-w-[180px]" title={att.name}>
                                        {att.name}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-400">
                                        Word Doc • {formatFileSize(att.size)}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {att.dataUrl && (
                                      <div
                                        onClick={() => setActivePreviewImage(att.dataUrl!)}
                                        className="relative group/thumb cursor-pointer overflow-hidden rounded border border-white/[0.12] shrink-0 w-10 h-10"
                                      >
                                        <img
                                          src={att.dataUrl}
                                          alt={att.name}
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                                          <Maximize2 className="w-3 h-3" />
                                        </div>
                                      </div>
                                    )}
                                    <div className="text-left pr-2">
                                      <div className="text-xs font-medium truncate max-w-[180px]" title={att.name}>
                                        {att.name}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-400">
                                        High-Clarity Image • {formatFileSize(att.size)}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Text */}
                      {isUser ? (
                        <div className="space-y-2">
                          <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-[15px] font-normal text-slate-100">
                            {m.content}
                          </p>
                          <div className="flex items-center justify-end gap-1 pt-1 opacity-60 hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(m.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <MarkdownRenderer content={m.content} />

                          {/* Anti-Overanalysis Banner if triggered */}
                          {m.metadata?.anti_overanalysis_flag && (
                            <div className="pt-2">
                              <AntiOveranalysisBanner />
                            </div>
                          )}

                          {/* Assistant Action Bar */}
                          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyContent(m.id, m.content)}
                                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#101420] hover:text-slate-300 transition-colors text-[11px] cursor-pointer"
                                title="Copy explanation"
                              >
                                {copiedMessageId === m.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 transition-colors text-[11px] cursor-pointer"
                                title="Delete this turn"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>

                            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                              Verified against fundamental physical invariants
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Badges */}
                    {!isUser && (
                      <div className="pl-1">
                        <AiMetadataBadge
                          provider={m.provider || 'MECHANISM'}
                          model={m.model || 'gemini-3.7-flash'}
                          timestamp={m.created_at}
                          classification={m.classification}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Thinking Indicator */}
              {loading && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0c0e16] border border-sky-500/30 text-slate-300 w-fit shadow-md">
                  <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                  <span className="text-xs font-mono text-slate-400">
                    MECHANISM deconstructing physical causal chain & state discriminators...
                  </span>
                </div>
              )}

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="p-4 rounded-xl border border-rose-900/80 bg-rose-950/40 text-rose-200 text-xs flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold block font-mono">Inference Notice:</span>
                    <p>{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      className="mt-1 px-2.5 py-1 rounded bg-rose-900 text-rose-100 font-medium text-[11px] hover:bg-rose-800 transition-colors cursor-pointer"
                    >
                      Retry Query
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Docked AI Reasoning Console Container */}
        <div className="border-t border-white/[0.08] bg-[#0c0e16] p-3 md:p-4 shrink-0 shadow-2xl">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* File Error Notice if any file exceeds 100MB or unsupported */}
            {fileError && (
              <div className="p-2.5 rounded-lg border border-amber-800/80 bg-amber-950/40 text-amber-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{fileError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  className="text-amber-400 hover:text-amber-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Pending Attachments Tray */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-[#101420] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold pl-1">
                  Ready to Ingest ({pendingAttachments.length}):
                </span>
                {pendingAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 py-1 px-2.5 rounded-md bg-[#151c2e] border border-white/[0.08] text-xs shadow-xs"
                  >
                    {att.type === 'pdf' ? (
                      <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : att.type === 'doc' || att.type === 'docx' || att.name.toLowerCase().endsWith('.docx') || att.name.toLowerCase().endsWith('.doc') ? (
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                    <span className="font-medium max-w-[150px] truncate text-slate-200" title={att.name}>
                      {att.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({formatFileSize(att.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(idx)}
                      className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main AI Reasoning Console Form */}
            <div className="relative rounded-xl border border-white/[0.08] bg-[#101420] focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/30 shadow-lg transition-all flex flex-col">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Native device camera input fallback */}
              <input
                ref={cameraFallbackInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
                rows={1}
                placeholder="State your physical doubt, propose a causal mechanism, or attach problem sets/notes (Enter to send, Shift+Enter for new line)..."
                className="w-full bg-transparent px-4 pt-3 pb-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none min-h-[44px] max-h-[160px] leading-relaxed font-sans"
              />

              {/* Bottom Control Bar of the Input */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] text-xs">
                {/* File Upload & Camera Buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-[#151c2e] transition-colors cursor-pointer"
                    title="Upload diagram, problem PDF, or Word document (up to 100MB)"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="text-[11px] font-medium hidden sm:inline">Attach File</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCameraModal}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-[#151c2e] transition-colors cursor-pointer"
                    title="Capture image (whiteboard, problem sheet, apparatus)"
                  >
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span className="text-[11px] font-medium hidden sm:inline">Camera</span>
                  </button>

                  <span className="text-[10px] font-mono text-slate-500 hidden md:inline pl-1">
                    (PDF, Word, Image, Camera ≤ 100MB)
                  </span>
                </div>

                {/* Right side: Send button */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                    Enter ↵
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={(!inputText.trim() && pendingAttachments.length === 0) || loading}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Send doubt to MECHANISM"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                    )}
                    <span className="font-bold">Inquire</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-500">
              <span>Supports PDFs & Word docs (≤ 100MB) & scientific figures</span>
              <span>Causal Chains • Discriminator Isolation • Invariant Laws</span>
            </div>
          </div>
        </div>
      </main>

      {/* Image Lightbox Modal for High-Clarity Examination (Diagrams/Plots) */}
      {activePreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#0c0e16] rounded-xl overflow-hidden shadow-2xl border border-white/[0.12] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#101420] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-200">
              <span className="font-mono text-[11px] text-sky-400 font-semibold">High-Clarity Scientific Figure View</span>
              <button
                type="button"
                onClick={() => setActivePreviewImage(null)}
                className="p-1 rounded hover:bg-[#151c2e] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center max-h-[calc(90vh-50px)] bg-[#07080c]">
              <img
                src={activePreviewImage}
                alt="High clarity view"
                className="max-w-full max-h-full object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder & Capture Modal */}
      {isCameraModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn"
          onClick={handleCloseCameraModal}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0c0e16] border border-white/[0.12] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 px-4 bg-[#090b10] border-b border-white/[0.08] flex items-center justify-between text-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight flex items-center gap-2">
                    Scientific Optical Capture
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                      {cameraFacingMode === 'environment' ? 'Rear / Document' : 'Front'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Align whiteboard notes, problem sheets, or apparatus setups inside frame
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="p-1.5 rounded-lg hover:bg-[#101420] text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder / Capture Canvas Container */}
            <div className="relative bg-black flex-1 min-h-[300px] max-h-[58vh] flex items-center justify-center overflow-hidden">
              {/* Shutter flash overlay */}
              {isCapturingFlash && (
                <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150 pointer-events-none" />
              )}

              {/* Error Notice */}
              {cameraError ? (
                <div className="p-6 text-center max-w-md space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
                    <CameraOff className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-rose-200">Camera Access Issue</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCameraStream(cameraFacingMode)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#101420] hover:bg-[#151c2e] text-xs font-medium text-slate-200 border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Access</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseCameraModal();
                        cameraFallbackInputRef.current?.click();
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-medium text-slate-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Use Device Camera</span>
                    </button>
                  </div>
                </div>
              ) : capturedImage ? (
                /* Captured Frame Preview */
                <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                  <img
                    src={capturedImage}
                    alt="Captured scientific view"
                    className="max-h-[55vh] max-w-full object-contain rounded-lg border border-white/[0.12] shadow-xl"
                  />
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-white/[0.12] text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-sky-400" />
                    <span>Photo Staged for Inquiry</span>
                  </div>
                </div>
              ) : (
                /* Live Camera Stream */
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain max-h-[58vh] ${cameraFacingMode === 'user' ? '-scale-x-100' : ''}`}
                  />

                  {/* Optical Document / Figure Reticle Overlay */}
                  <div className="absolute inset-6 md:inset-10 border border-sky-500/20 pointer-events-none rounded-lg flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-sky-400" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-sky-400" />
                    </div>
                    <div className="flex justify-center">
                      <div className="w-5 h-5 border border-dashed border-sky-400/40 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-sky-400 rounded-full" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-sky-400" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-sky-400" />
                    </div>
                  </div>

                  {/* Live Status Pill */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/[0.08] text-[10px] font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>Live Lens Stream</span>
                  </div>

                  {/* Camera toggle button in viewfinder */}
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/[0.12] text-slate-200 hover:text-sky-400 transition-colors cursor-pointer"
                    title="Flip camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>

                  {/* Initializing indicator */}
                  {isCameraInitializing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-20">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                      <span className="text-xs text-slate-300 font-mono">Accessing camera sensor...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls Toolbar */}
            <div className="p-3 md:p-4 bg-[#090b10] border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
              {capturedImage ? (
                /* Post-Capture Review Actions */
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="px-4 py-2 rounded-xl bg-[#101420] hover:bg-[#151c2e] text-slate-200 border border-white/[0.08] font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseCameraModal}
                      className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptPhoto}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-slate-950 font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>Attach to Doubt Chat</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Viewfinder Controls */
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={handleCloseCameraModal}
                    className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {/* Big Circular Shutter Button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={isCameraInitializing || !!cameraError}
                      className="group relative w-14 h-14 rounded-full border-2 border-slate-300 flex items-center justify-center p-1 transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Capture photo"
                    >
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 group-hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center">
                        <Camera className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                      </div>
                    </button>
                  </div>

                  {/* Switch Camera Button */}
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    disabled={isCameraInitializing || !!cameraError}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101420] hover:bg-[#151c2e] text-slate-300 text-xs border border-white/[0.08] transition-colors disabled:opacity-40 cursor-pointer"
                    title="Switch camera"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Flip</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
