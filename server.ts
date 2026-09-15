import express, { Request, Response } from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, DEFAULT_USER_ID } from './server/db.ts';
import { queryGemini, CURRENT_MODEL, AI_PROVIDER } from './server/gemini.ts';
import {
  handleLogin,
  handleGetSession,
  handleLogout,
  handleChangePassword,
  handleGetAuthStatus,
  handleInitializeAuth,
  handleGetRecoveryClue,
  handleDeleteAccount,
  getAuthenticatedUserId,
} from './server/auth.ts';
import {
  ensureAdaptiveUserModel,
  selectAdaptiveQuestion,
  evaluateAdaptiveAttempt,
  generateDynamicDiagnosticQuestion,
  getUserCognitiveFlawSummary,
  computeAdaptiveUserModel,
  processAdaptiveEvidence,
  deriveNextBestTask,
  calculateEvidenceStrength,
  INITIAL_HIERARCHICAL_ERRORS,
  CURATED_DIAGNOSTIC_QUESTIONS,
} from './server/adaptive_engine.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database & seeds
  initDatabase();
  ensureAdaptiveUserModel();

  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

  // Standard health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', provider: AI_PROVIDER, model: CURRENT_MODEL });
  });

  // Private application authentication endpoints
  app.get('/api/auth/status', handleGetAuthStatus);
  app.post('/api/auth/initialize', handleInitializeAuth);
  app.post('/api/auth/login', handleLogin);
  app.get('/api/auth/session', handleGetSession);
  app.post('/api/auth/logout', handleLogout);
  app.post('/api/auth/change-password', handleChangePassword);
  app.get('/api/auth/recovery-clue', handleGetRecoveryClue);
  app.post('/api/auth/delete-account', handleDeleteAccount);
  app.delete('/api/auth/account', handleDeleteAccount);

  // Subjects
  app.get('/api/subjects', (req: Request, res: Response) => {
    try {
      const subjects = db.prepare(`
        SELECT s.*, (SELECT count(*) FROM topics t WHERE t.subject_id = s.id) as topicCount
        FROM subjects s
        ORDER BY s.name ASC
      `).all();
      res.json({ success: true, data: subjects });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Topics
  app.get('/api/topics', (req: Request, res: Response) => {
    try {
      const { subject_id } = req.query;
      let topics;
      if (subject_id) {
        topics = db.prepare(`
          SELECT t.*, COALESCE(s.name, 'General Concepts') as subject_name
          FROM topics t
          LEFT JOIN subjects s ON t.subject_id = s.id
          WHERE t.subject_id = ?
          ORDER BY t.name ASC
        `).all(subject_id as string);
      } else {
        topics = db.prepare(`
          SELECT t.*, COALESCE(s.name, 'General Concepts') as subject_name
          FROM topics t
          LEFT JOIN subjects s ON t.subject_id = s.id
          ORDER BY (CASE WHEN t.id LIKE 'top_custom_%' THEN 0 ELSE 1 END), s.name ASC, t.name ASC
        `).all();
      }
      res.json({ success: true, data: topics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create Custom Topic
  app.post('/api/topics', (req: Request, res: Response) => {
    try {
      const { name, subject_id, chapter, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Topic name is required' });
      }

      const trimmedName = name.trim();

      // Check if topic with this exact name already exists
      const existing = db.prepare(`
        SELECT t.*, COALESCE(s.name, 'General Concepts') as subject_name
        FROM topics t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE LOWER(t.name) = LOWER(?)
      `).get(trimmedName) as any;

      if (existing) {
        return res.json({ success: true, data: existing, existing: true });
      }

      const id = 'top_custom_' + Date.now();
      const finalSubjectId = subject_id || 'sub_physics';
      const finalChapter = chapter || 'Custom Concepts';
      const finalDesc = description || `User-defined Physics reasoning topic: ${trimmedName}`;

      db.prepare(`
        INSERT INTO topics (id, subject_id, name, chapter, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, finalSubjectId, trimmedName, finalChapter, finalDesc);

      const subjectRow = db.prepare('SELECT name FROM subjects WHERE id = ?').get(finalSubjectId) as any;
      const subjectName = subjectRow ? subjectRow.name : 'General Concepts';

      const newTopic = {
        id,
        subject_id: finalSubjectId,
        name: trimmedName,
        chapter: finalChapter,
        description: finalDesc,
        subject_name: subjectName,
        is_custom: true,
      };

      // Register into user_model topic_mastery
      try {
        const userId = getAuthenticatedUserId(req);
        const row = db.prepare('SELECT topic_mastery FROM user_model WHERE user_id = ?').get(userId) as any;
        if (row) {
          const masteryMap = JSON.parse(row.topic_mastery || '{}');
          masteryMap[id] = {
            topic_name: trimmedName,
            mastery_percentage: 65,
            status: 'Calibrating',
            last_practiced: new Date().toISOString(),
          };
          db.prepare('UPDATE user_model SET topic_mastery = ?, updated_at = ? WHERE user_id = ?').run(
            JSON.stringify(masteryMap),
            new Date().toISOString(),
            userId
          );
        }
      } catch (e) {
        // non-blocking
      }

      res.json({ success: true, data: newTopic });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete Custom Topic
  app.delete('/api/topics/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM topics WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // User Model & Personal Cognition Profile (Dynamically computed from adaptive engine)
  app.get('/api/user-model', (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const userModel = computeAdaptiveUserModel(userId);
      res.json({
        success: true,
        data: userModel,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset User Model & Test History back to unassessed baseline safely scoped to this user only
  app.post('/api/user-model/reset', (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      db.prepare('DELETE FROM question_attempts WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM mechanism_evaluations WHERE mechanism_id IN (SELECT id FROM mechanisms WHERE user_id = ?)').run(userId);
      db.prepare('DELETE FROM reconstructions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM adaptive_evidence WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM active_learning_context WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_model WHERE user_id = ?').run(userId);
      ensureAdaptiveUserModel(userId);
      const freshModel = computeAdaptiveUserModel(userId);
      res.json({ success: true, data: freshModel });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Cross-Context Active Flaws Summary for Learner Dashboard and Adaptation
  app.get('/api/user-model/flaws', (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const summary = getUserCognitiveFlawSummary(userId);
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CENTRAL ADAPTIVE EVIDENCE ENDPOINTS

  // Dynamic Next Best Task on Demand
  app.get('/api/adaptive/next-task', (req: Request, res: Response) => {
    try {
      const topic_id = req.query.topic_id as string | undefined;
      const current_mode = req.query.current_mode as string | undefined;
      const userId = getAuthenticatedUserId(req);
      const nextTask = deriveNextBestTask({
        userId,
        selectedTopicId: topic_id,
        currentMode: current_mode,
      });
      res.json({ success: true, data: nextTask });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Query Recent Adaptive Evidence Records
  app.get('/api/adaptive/evidence', (req: Request, res: Response) => {
    try {
      const limit = Math.min(100, Number(req.query.limit) || 40);
      const userId = getAuthenticatedUserId(req);
      const rows = db.prepare(`
        SELECT e.*, t.name as topic_name
        FROM adaptive_evidence e
        LEFT JOIN topics t ON e.topic_id = t.id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC
        LIMIT ?
      `).all(userId, limit);
      res.json({ success: true, data: rows });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Ingest Manual or External Diagnostic Evidence
  app.post('/api/adaptive/evidence', (req: Request, res: Response) => {
    try {
      const evidence = processAdaptiveEvidence(req.body);
      res.json({ success: true, data: evidence });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Active Learning Context Endpoints (Authoritative Shared Context across all tools)
  app.get('/api/learning-context', (req: Request, res: Response) => {
    try {
      const activeRow = db.prepare('SELECT * FROM active_learning_context WHERE id = ?').get('current_active_context') as any;
      if (activeRow) {
        return res.json({
          success: true,
          data: {
            source: activeRow.source,
            topicId: activeRow.topic_id || undefined,
            topicName: activeRow.topic_name,
            subjectId: activeRow.subject_id || undefined,
            conversationId: activeRow.conversation_id || undefined,
            conversationTitle: activeRow.conversation_title || undefined,
            summary: activeRow.summary || '',
            detectedGaps: activeRow.detected_gaps ? JSON.parse(activeRow.detected_gaps) : [],
            keyConcepts: activeRow.key_concepts ? JSON.parse(activeRow.key_concepts) : [],
            unresolvedQuestions: activeRow.unresolved_questions ? JSON.parse(activeRow.unresolved_questions) : [],
            hasAttachments: Boolean(activeRow.has_attachments),
            attachmentNames: activeRow.attachment_names ? JSON.parse(activeRow.attachment_names) : [],
            lastUpdated: activeRow.updated_at,
          },
        });
      }

      // Genuinely empty context when no topic has been selected or extracted
      return res.json({
        success: true,
        data: null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/learning-context', (req: Request, res: Response) => {
    try {
      db.prepare('DELETE FROM active_learning_context WHERE id = ?').run('current_active_context');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/learning-context', (req: Request, res: Response) => {
    try {
      const {
        source,
        topicId,
        topicName,
        subjectId,
        conversationId,
        conversationTitle,
        summary,
        detectedGaps,
        keyConcepts,
        unresolvedQuestions,
        hasAttachments,
        attachmentNames,
      } = req.body;

      if (!topicName || !topicName.trim()) {
        return res.status(400).json({ success: false, error: 'topicName is required' });
      }

      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO active_learning_context (
          id, user_id, source, topic_id, topic_name, subject_id, conversation_id, conversation_title,
          summary, detected_gaps, key_concepts, unresolved_questions, has_attachments, attachment_names, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          source = excluded.source,
          topic_id = excluded.topic_id,
          topic_name = excluded.topic_name,
          subject_id = excluded.subject_id,
          conversation_id = excluded.conversation_id,
          conversation_title = excluded.conversation_title,
          summary = excluded.summary,
          detected_gaps = excluded.detected_gaps,
          key_concepts = excluded.key_concepts,
          unresolved_questions = excluded.unresolved_questions,
          has_attachments = excluded.has_attachments,
          attachment_names = excluded.attachment_names,
          updated_at = excluded.updated_at
      `).run(
        'current_active_context',
        getAuthenticatedUserId(req),
        source || 'custom_topic',
        topicId || null,
        topicName.trim(),
        subjectId || null,
        conversationId || null,
        conversationTitle || null,
        summary || '',
        JSON.stringify(Array.isArray(detectedGaps) ? detectedGaps : []),
        JSON.stringify(Array.isArray(keyConcepts) ? keyConcepts : []),
        JSON.stringify(Array.isArray(unresolvedQuestions) ? unresolvedQuestions : []),
        hasAttachments ? 1 : 0,
        JSON.stringify(Array.isArray(attachmentNames) ? attachmentNames : []),
        now
      );

      res.json({
        success: true,
        data: {
          source: source || 'custom_topic',
          topicId: topicId || undefined,
          topicName: topicName.trim(),
          subjectId: subjectId || undefined,
          conversationId: conversationId || undefined,
          conversationTitle: conversationTitle || undefined,
          summary: summary || '',
          detectedGaps: Array.isArray(detectedGaps) ? detectedGaps : [],
          keyConcepts: Array.isArray(keyConcepts) ? keyConcepts : [],
          unresolvedQuestions: Array.isArray(unresolvedQuestions) ? unresolvedQuestions : [],
          hasAttachments: Boolean(hasAttachments),
          attachmentNames: Array.isArray(attachmentNames) ? attachmentNames : [],
          lastUpdated: now,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/chat/conversations/:id/context', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const convo = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(id) as any;
      if (!convo) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      if (convo.learning_context) {
        try {
          const parsed = JSON.parse(convo.learning_context);
          return res.json({ success: true, data: parsed });
        } catch {}
      }

      // If no stored learning_context yet, derive from latest message
      const latestAssistant = db.prepare(`
        SELECT content FROM chat_messages
        WHERE conversation_id = ? AND role = 'assistant'
        ORDER BY created_at DESC LIMIT 1
      `).get(id) as any;

      let extractedContext: any = null;
      if (latestAssistant?.content) {
        const match = latestAssistant.content.match(/<!--\s*LEARNING_CONTEXT:\s*(\{.*?\})\s*-->/s);
        if (match) {
          try { extractedContext = JSON.parse(match[1]); } catch {}
        }
      }

      const linkedTopic = convo.topic_id ? db.prepare('SELECT name, description FROM topics WHERE id = ?').get(convo.topic_id) as any : null;
      const topicName = extractedContext?.topic_name || linkedTopic?.name || convo.title.replace(/[#*_`]/g, '');
      const summary = extractedContext?.summary || linkedTopic?.description || 'Physical reasoning discussion.';

      const resultContext = {
        source: 'doubt_chat',
        topicId: convo.topic_id || undefined,
        topicName,
        conversationId: id,
        conversationTitle: convo.title,
        summary,
        detectedGaps: Array.isArray(extractedContext?.detected_gaps) ? extractedContext.detected_gaps : [],
        keyConcepts: Array.isArray(extractedContext?.key_concepts) ? extractedContext.key_concepts : [],
        unresolvedQuestions: Array.isArray(extractedContext?.unresolved_questions) ? extractedContext.unresolved_questions : [],
        hasAttachments: false,
        attachmentNames: [],
        lastUpdated: convo.updated_at,
      };

      res.json({ success: true, data: resultContext });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Chat Conversations
  app.get('/api/chat/conversations', (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const convos = db.prepare(`
        SELECT c.*, t.name as topic_name,
               (SELECT count(*) FROM chat_messages m WHERE m.conversation_id = c.id) as message_count
        FROM chat_conversations c
        LEFT JOIN topics t ON c.topic_id = t.id
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
      `).all(userId);
      res.json({ success: true, data: convos });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/chat/conversations', (req: Request, res: Response) => {
    try {
      const { title, topic_id } = req.body;
      const id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const now = new Date().toISOString();
      const userId = getAuthenticatedUserId(req);

      db.prepare(`
        INSERT INTO chat_conversations (id, user_id, topic_id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, userId, topic_id || null, title || 'New Doubt Session', now, now);

      res.json({ success: true, data: { id, title: title || 'New Doubt Session', topic_id, created_at: now } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/chat/conversations/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const convo = db.prepare(`
        SELECT c.*, t.name as topic_name
        FROM chat_conversations c
        LEFT JOIN topics t ON c.topic_id = t.id
        WHERE c.id = ?
      `).get(id) as any;

      if (!convo) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      const rawMessages = db.prepare(`
        SELECT * FROM chat_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `).all(id) as any[];

      const messages = rawMessages.map((m) => ({
        ...m,
        metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
        attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
      }));

      res.json({ success: true, data: { ...convo, messages } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/chat/conversations/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      if (title && title.trim()) {
        db.prepare('UPDATE chat_conversations SET title = ?, updated_at = ? WHERE id = ?').run(
          title.trim(),
          new Date().toISOString(),
          id
        );
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/chat/conversations/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Explicitly delete both messages and conversation to ensure clean removal
      db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(id);
      db.prepare('DELETE FROM chat_conversations WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete all conversations (Clear history)
  app.delete('/api/chat/conversations', (req: Request, res: Response) => {
    try {
      db.prepare('DELETE FROM chat_messages').run();
      db.prepare('DELETE FROM chat_conversations').run();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete a specific chat message
  app.delete('/api/chat/messages/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM chat_messages WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Post message to Doubt Chat with strictly 1 Gemini API call + Cross-Context Flaw Adaptation
  app.post('/api/chat/message', async (req: Request, res: Response) => {
    try {
      const { conversation_id, content, topic_id, attachments } = req.body;
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      const trimmedContent = content ? content.trim() : '';

      if (!trimmedContent && !hasAttachments) {
        return res.status(400).json({ success: false, error: 'Please enter a doubt or attach a document or image' });
      }

      let convId = conversation_id;
      const now = new Date().toISOString();

      // Retrieve cross-context student flaw summary to attack patterns of understanding
      const flawContext = getUserCognitiveFlawSummary();

      let basePrompt = trimmedContent || (hasAttachments 
        ? `Please examine the attached experimental file(s) (${attachments.map((a: any) => a.name || a.type).join(', ')}). Dissect the underlying physical mechanisms, distinguishing variables, and theoretical implications from first principles.`
        : 'Please analyze this physical setup.');

      // Inject student's active cognitive flaw into the physical reasoning context
      const promptToUse = `${basePrompt}

${flawContext.prompt_injection}`;

      let conversationTitle = 'Physics Reasoning Discussion';
      if (!convId) {
        convId = 'conv_' + Date.now();
        conversationTitle = trimmedContent
          ? trimmedContent.slice(0, 45).replace(/[#*_`]/g, '') + (trimmedContent.length > 45 ? '...' : '')
          : `Data Ingestion: ${attachments[0]?.name?.slice(0, 30) || 'Attached Files'}`;

        const userId = getAuthenticatedUserId(req);
        db.prepare(`
          INSERT INTO chat_conversations (id, user_id, topic_id, title, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(convId, userId, topic_id || null, conversationTitle, now, now);
      } else {
        const existingConv = db.prepare('SELECT title FROM chat_conversations WHERE id = ?').get(convId) as any;
        if (existingConv?.title) {
          conversationTitle = existingConv.title;
        }
      }

      // Save user message with attachments (sanitize heavy base64 for local database storage)
      const userMsgId = 'msg_u_' + Date.now();
      const sanitizedAttachments = hasAttachments ? attachments.map((a: any) => ({
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        dataUrl: a.dataUrl || (a.mimeType.startsWith('image/') ? `data:${a.mimeType};base64,${a.base64Data}` : undefined),
      })) : null;

      db.prepare(`
        INSERT INTO chat_messages (id, conversation_id, role, content, provider, model, attachments, created_at)
        VALUES (?, ?, 'user', ?, ?, ?, ?, ?)
      `).run(
        userMsgId,
        convId,
        trimmedContent || `[Attached: ${attachments.map((a: any) => a.name).join(', ')}]`,
        AI_PROVIDER,
        CURRENT_MODEL,
        sanitizedAttachments ? JSON.stringify(sanitizedAttachments) : null,
        now
      );

      // Fetch last 4 messages for compact history
      const historyRows = db.prepare(`
        SELECT role, content FROM chat_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT 6
      `).all(convId) as Array<{ role: 'user' | 'assistant'; content: string }>;

      // Map attachments for Gemini inlineData
      const geminiAttachments = hasAttachments ? attachments.map((a: any) => ({
        mimeType: a.mimeType,
        data: a.base64Data || (a.dataUrl ? a.dataUrl.replace(/^data:[^;]+;base64,/, '') : ''),
        name: a.name,
      })) : undefined;

      // Single call to Gemini API
      const geminiResult = await queryGemini({
        prompt: promptToUse,
        history: historyRows,
        attachments: geminiAttachments,
      });

      // Save assistant message
      const assistantMsgId = 'msg_a_' + Date.now();
      const metadataStr = JSON.stringify({
        answered_at: geminiResult.timestamp,
        anti_overanalysis_flag: geminiResult.metadata?.anti_overanalysis_flag || false,
      });

      db.prepare(`
        INSERT INTO chat_messages (id, conversation_id, role, content, provider, model, classification, metadata, created_at)
        VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)
      `).run(
        assistantMsgId,
        convId,
        geminiResult.text,
        geminiResult.provider,
        geminiResult.model,
        geminiResult.classification || 'Mechanism',
        metadataStr,
        geminiResult.timestamp
      );

      // Check for classification flags
      const isConfusedModel = geminiResult.classification === 'Confused mental model';
      const isOveranalysis = Boolean(geminiResult.metadata?.anti_overanalysis_flag);

      // Extract active learning context from Gemini response
      let extractedContext: any = null;
      const contextMatch = geminiResult.text.match(/<!--\s*LEARNING_CONTEXT:\s*(\{.*?\})\s*-->/s);
      if (contextMatch) {
        try {
          extractedContext = JSON.parse(contextMatch[1]);
        } catch (e) {
          console.warn('Failed to parse LEARNING_CONTEXT tag:', e);
        }
      }

      // Fallback topic name extraction if not structured
      const linkedTopic = topic_id ? db.prepare('SELECT name, description, subject_id FROM topics WHERE id = ?').get(topic_id) as any : null;
      const topicName = extractedContext?.topic_name?.trim() || linkedTopic?.name || trimmedContent.slice(0, 45).replace(/[#*_`]/g, '');
      const summary = extractedContext?.summary?.trim() || linkedTopic?.description || 'Extracted from Doubt Chat physical inquiry dialogue.';
      const detectedGaps: string[] = Array.isArray(extractedContext?.detected_gaps) ? extractedContext.detected_gaps : [];
      if (isConfusedModel && detectedGaps.length === 0) {
        detectedGaps.push('Confused mental model in mechanistic inquiry');
      }
      const keyConcepts: string[] = Array.isArray(extractedContext?.key_concepts) ? extractedContext.key_concepts : [];
      const unresolvedQuestions: string[] = Array.isArray(extractedContext?.unresolved_questions) ? extractedContext.unresolved_questions : [];

      const fullLearningContext = {
        source: topic_id ? 'predefined_topic' : 'doubt_chat',
        topicId: topic_id || undefined,
        topicName,
        subjectId: linkedTopic?.subject_id || undefined,
        conversationId: convId,
        conversationTitle: conversationTitle || 'Physics Inquiry',
        summary,
        detectedGaps,
        keyConcepts,
        unresolvedQuestions,
        hasAttachments,
        attachmentNames: hasAttachments ? attachments.map((a: any) => a.name || a.type) : [],
        lastUpdated: now,
      };

      // Persist learning context on conversation record
      try {
        db.prepare('UPDATE chat_conversations SET learning_context = ?, updated_at = ? WHERE id = ?').run(
          JSON.stringify(fullLearningContext),
          now,
          convId
        );
      } catch (e) {
        console.warn('Failed to save learning_context to conversation:', e);
      }

      // Update authoritative active_learning_context table
      try {
        const userId = getAuthenticatedUserId(req);
        db.prepare(`
          INSERT INTO active_learning_context (
            id, user_id, source, topic_id, topic_name, subject_id, conversation_id, conversation_title,
            summary, detected_gaps, key_concepts, unresolved_questions, has_attachments, attachment_names, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            source = excluded.source,
            topic_id = excluded.topic_id,
            topic_name = excluded.topic_name,
            subject_id = excluded.subject_id,
            conversation_id = excluded.conversation_id,
            conversation_title = excluded.conversation_title,
            summary = excluded.summary,
            detected_gaps = excluded.detected_gaps,
            key_concepts = excluded.key_concepts,
            unresolved_questions = excluded.unresolved_questions,
            has_attachments = excluded.has_attachments,
            attachment_names = excluded.attachment_names,
            updated_at = excluded.updated_at
        `).run(
          'current_active_context',
          userId,
          'doubt_chat',
          topic_id || null,
          topicName,
          linkedTopic?.subject_id || null,
          convId,
          conversationTitle || 'Physics Inquiry',
          summary,
          JSON.stringify(detectedGaps),
          JSON.stringify(keyConcepts),
          JSON.stringify(unresolvedQuestions),
          hasAttachments ? 1 : 0,
          JSON.stringify(hasAttachments ? attachments.map((a: any) => a.name || a.type) : []),
          now
        );
      } catch (e) {
        console.warn('Failed to persist active_learning_context from message:', e);
      }

      // Check for meaningful diagnostic events in Doubt Chat (ordinary chat does not emit evidence)
      const diagnosticMatch = geminiResult.text.match(/<!--\s*DIAGNOSTIC_EVENT:\s*(\{.*?\})\s*-->/s);

      if (isConfusedModel || isOveranalysis || diagnosticMatch) {
        let diagData: any = {};
        if (diagnosticMatch) {
          try { diagData = JSON.parse(diagnosticMatch[1]); } catch {}
        }
        const errorId = diagData.error_id || (isOveranalysis ? 'err_overanalysis_trap' : flawContext.flaws[0]?.id || 'err_assoc_causation');
        const isCorrection = diagData.type === 'meaningful_correction' || diagData.correct_reasoning === true;
        const targetFlaw = flawContext.flaws.find((f: any) => f.id === errorId);

        processAdaptiveEvidence({
          user_id: getAuthenticatedUserId(req),
          feature: 'doubt_chat',
          topic_id: topic_id || null,
          error_id: errorId,
          error_name: diagData.error_name || targetFlaw?.name || 'Causal Reasoning Error',
          correct_answer: isCorrection,
          correct_reasoning: isCorrection,
          evidence_summary: diagData.summary || (isConfusedModel
            ? `Doubt Chat diagnostic event: identified confused mental model in student query "${trimmedContent.slice(0, 80)}..."`
            : 'Doubt Chat diagnostic event: flagged persistent overanalysis pattern without model commitment.'),
          created_at: now,
        });
      }

      res.json({
        success: true,
        data: {
          id: assistantMsgId,
          conversation_id: convId,
          role: 'assistant',
          content: geminiResult.text,
          provider: geminiResult.provider,
          model: geminiResult.model,
          classification: geminiResult.classification,
          metadata: {
            answered_at: geminiResult.timestamp,
            anti_overanalysis_flag: geminiResult.metadata?.anti_overanalysis_flag || false,
          },
          created_at: geminiResult.timestamp,
        },
        learning_context: fullLearningContext,
        metadata: {
          provider: geminiResult.provider,
          model: geminiResult.model,
          timestamp: geminiResult.timestamp,
        },
      });
    } catch (err: any) {
      console.error('Error in /api/chat/message:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
  });

  // Mechanism Compressor Endpoint
  const handleCompressorEvaluate = async (req: Request, res: Response) => {
    try {
      const { topic_id, user_explanation, title } = req.body;
      if (!user_explanation || !user_explanation.trim()) {
        return res.status(400).json({ success: false, error: 'User explanation is required' });
      }

      const flawContext = getUserCognitiveFlawSummary();

      const prompt = `You are evaluating a BSc Physics student's dynamical mechanism explanation for MECHANISM COMPRESSOR.
Topic: ${title || 'Classical / Quantum / Electromagnetic Mechanism'}
Student Explanation:
"""
${user_explanation}
"""

Evaluate with mathematical and physical rigor:
- Causal accuracy
- Missing variables
- Hidden assumptions
- Causal direction (did they invert cause and effect?)
- Incorrect links
- Alternative mechanisms
- Discriminators
- Exceptions
- Unnecessary complexity or overcompression
- Memorized facts incorrectly presented as mechanisms

DO NOT immediately rewrite their answer!
Structure your critique in 6 numbered sections:
1. WHAT IS CORRECT: (Acknowledge valid parts of their mental model)
2. WEAKEST LINK: (Pinpoint the exact missing or broken causal link)
3. ATTACK THE MODEL: (Show where their explanation fails under physical perturbation or extreme boundary conditions)
4. DISTINGUISHING OBSERVATION: (What experimental test, sensor trace, or observation separates their model from truth?)
5. REPAIR THE MODEL: (Add the missing variable and correct directionality)
6. COMPRESSED FINAL MECHANISM: (A pristine, high-yield, compressed causal sequence: Step 1 → Step 2 → Step 3)

${flawContext.prompt_injection}

At the very end of your response, output a strict JSON block assessing the student's actual submission wrapped exactly like this:
<!-- EVALUATION_SCORES:
{
  "causal_accuracy": <number between 0.05 and 1.00 evaluating causal validity>,
  "completeness": <number between 0.05 and 1.00 evaluating essential variable accounting>,
  "directionality": <number between 0.05 and 1.00 evaluating correct causal flow and absence of cause/effect inversion>,
  "assumption_quality": <number between 0.05 and 1.00 evaluating axiomatic foundations>,
  "discriminator_quality": <number between 0.05 and 1.00 evaluating distinguishing diagnostic observation>,
  "exception_handling": <number between 0.05 and 1.00 evaluating boundary conditions>,
  "compression_quality": <number between 0.05 and 1.00 evaluating conciseness without information loss>,
  "overall_score": <number between 0.05 and 1.00 overall mechanistic soundness>
}
-->`;

      const geminiResult = await queryGemini({
        prompt,
        temperature: 0.2,
      });

      // Parse structured evaluation scores
      let causalAccuracy = 0.70;
      let completeness = 0.70;
      let directionality = 0.75;
      let assumptionQuality = 0.70;
      let discriminatorQuality = 0.70;
      let exceptionHandling = 0.65;
      let compressionQuality = 0.75;
      let overallScore = 0.70;

      let cleanFeedback = geminiResult.text;
      const scoresMatch = geminiResult.text.match(/<!--\s*EVALUATION_SCORES:\s*(\{.*?\})\s*-->/s);

      const clampScore = (val: any, fallback: number): number => {
        const num = Number(val);
        if (isNaN(num)) return fallback;
        return Math.max(0.05, Math.min(1.0, Number(num.toFixed(2))));
      };

      if (scoresMatch && scoresMatch[1]) {
        try {
          const parsed = JSON.parse(scoresMatch[1]);
          causalAccuracy = clampScore(parsed.causal_accuracy, 0.70);
          completeness = clampScore(parsed.completeness, 0.70);
          directionality = clampScore(parsed.directionality, 0.75);
          assumptionQuality = clampScore(parsed.assumption_quality, 0.70);
          discriminatorQuality = clampScore(parsed.discriminator_quality, 0.70);
          exceptionHandling = clampScore(parsed.exception_handling, 0.65);
          compressionQuality = clampScore(parsed.compression_quality, 0.75);
          overallScore = clampScore(parsed.overall_score, (causalAccuracy + directionality + completeness) / 3);

          // Strip the JSON tag from client-facing feedback
          cleanFeedback = geminiResult.text.replace(/<!--\s*EVALUATION_SCORES:.*?-->/s, '').trim();
        } catch (e) {
          // Fallback parsing failed, use heuristic
        }
      } else {
        // Fallback: evaluate text tone for score estimates
        const lower = geminiResult.text.toLowerCase();
        if (lower.includes('completely correct') || lower.includes('exemplary') || lower.includes('flawless')) {
          causalAccuracy = 0.92;
          directionality = 0.95;
          completeness = 0.88;
          overallScore = 0.91;
        } else if (lower.includes('invert') || lower.includes('fatal flaw') || lower.includes('completely incorrect')) {
          causalAccuracy = 0.45;
          directionality = 0.40;
          completeness = 0.50;
          overallScore = 0.45;
        }
      }

      const now = new Date().toISOString();
      const evalId = 'eval_' + Date.now();
      const mechId = 'mech_' + Date.now();
      const userId = getAuthenticatedUserId(req);

      // Save mechanism and evaluation to database with actual scores
      db.prepare(`
        INSERT INTO mechanisms (id, user_id, topic_id, title, user_explanation, canonical_mechanism, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(mechId, userId, topic_id || 'top_damped_oscillator', title || 'Mechanism Compression', user_explanation, cleanFeedback, now, now);

      db.prepare(`
        INSERT INTO mechanism_evaluations (
          id, mechanism_id, causal_accuracy, completeness, directionality,
          assumption_quality, discriminator_quality, exception_handling, compression_quality,
          alternative_mechanism_quality, confidence, overall_score, evaluator_feedback, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        evalId,
        mechId,
        causalAccuracy,
        completeness,
        directionality,
        assumptionQuality,
        discriminatorQuality,
        exceptionHandling,
        compressionQuality,
        0.75,
        0.85,
        overallScore,
        cleanFeedback,
        now
      );

      // Emit evaluated empirical scores to central adaptive evidence architecture
      processAdaptiveEvidence({
        user_id: userId,
        feature: 'compressor',
        topic_id: topic_id || 'top_damped_oscillator',
        robust_mechanism: overallScore >= 0.75,
        correct_reasoning: causalAccuracy >= 0.70,
        discriminator_identified: discriminatorQuality >= 0.70,
        evidence_summary: `Mechanism Compressor on "${title || 'Mechanism'}": Evaluated causal accuracy (${Math.round(causalAccuracy * 100)}%), directionality (${Math.round(directionality * 100)}%), completeness (${Math.round(completeness * 100)}%), overall score (${Math.round(overallScore * 100)}%).`,
        created_at: now,
      });

      res.json({
        success: true,
        data: {
          id: evalId,
          mechanism_id: mechId,
          feedback: cleanFeedback,
          scores: {
            causal_accuracy: Math.round(causalAccuracy * 100),
            directionality: Math.round(directionality * 100),
            completeness: Math.round(completeness * 100),
            overall_score: Math.round(overallScore * 100),
          },
        },
        metadata: {
          provider: geminiResult.provider,
          model: geminiResult.model,
          timestamp: geminiResult.timestamp,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  app.post('/api/compressor/evaluate', handleCompressorEvaluate);
  app.post('/api/compress/evaluate', handleCompressorEvaluate);

  // Adversarial / Attack Mode Endpoint
  app.post('/api/adversarial/attack', async (req: Request, res: Response) => {
    try {
      const { model_text, attack_type } = req.body;
      const flawContext = getUserCognitiveFlawSummary();

      let instructionTarget = '';
      switch (attack_type) {
        case 'DESTROY_MY_MODEL':
          instructionTarget = 'Produce counterexamples and extreme physical boundary cases that directly break this student model. Do not manufacture false criticism if it is completely sound, but stress-test every limit.';
          break;
        case 'WHAT_AM_I_ASSUMING':
          instructionTarget = 'Expose all unstated, hidden assumptions, implicit constants, and unverified physical axioms in this model.';
          break;
        case 'FIND_THE_DISCRIMINATOR':
          instructionTarget = 'Isolate the single physical observation, measurement discriminator, or experimental setup that proves or disproves this model against competing alternative explanations.';
          break;
        case 'ATTACK_THE_CAUSAL_CHAIN':
          instructionTarget = 'Scrutinize every link in the causal chain for directionality errors, conservation law violations, non-sequiturs, or missing intermediate physical steps.';
          break;
        default:
          instructionTarget = 'Adversarially critique this physical reasoning model with academic precision.';
      }

      const prompt = `Adversarial BSc Physics Evaluation Mode:
Target Focus: ${attack_type}
Directive: ${instructionTarget}

Student's Working Model:
"""
${model_text}
"""

Deliver a razor-sharp, objective, academic critique formatted cleanly in markdown with physical notation (LaTeX, SI units, vector notation, etc.).

${flawContext.prompt_injection}`;

      const result = await queryGemini({ prompt, temperature: 0.25 });

      // Emit to central adaptive evidence architecture
      const hasVulnerability = /break|flaw|vulnerab|defect|missing|inversion|contradict|erroneous/i.test(result.text.slice(0, 450));
      const targetFlaw = flawContext.flaws[0];
      processAdaptiveEvidence({
        user_id: getAuthenticatedUserId(req),
        feature: 'adversarial',
        error_id: targetFlaw?.id || null,
        error_name: targetFlaw?.name || null,
        robust_mechanism: !hasVulnerability,
        correct_reasoning: !hasVulnerability,
        evidence_summary: `Adversarial attack [${attack_type}] on student model: ${hasVulnerability ? 'Stress test exposed model boundary vulnerabilities.' : 'Model withstood boundary counterexamples.'}`,
      });

      res.json({
        success: true,
        data: { attack_type, critique: result.text },
        metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // First-Principles Mode Endpoint
  app.post('/api/first-principles', async (req: Request, res: Response) => {
    try {
      const { topic_or_concept } = req.body;
      const flawContext = getUserCognitiveFlawSummary();

      const prompt = `FIRST-PRINCIPLES PHYSICS RECONSTRUCTION:
Concept to Deconstruct: "${topic_or_concept}"

Ask and answer the fundamental question:
"What is the SMALLEST set of physical laws, conservation axioms, and symmetries from which this entire dynamical mechanism can be derived?"

Structure:
1. Minimal Axiom Base (Fundamental laws: conservation of energy/momentum, Lagrangian/Hamiltonian formulation, Maxwell equations, Schrödinger equation, thermodynamics, etc.)
2. Deductive Step-by-Step Derivation (Show how the physical phenomenon inevitably emerges mathematically without rote memorization)
3. Non-Derivable Elements (Clearly delineate: what MUST be empirical constants or conventions vs what can be derived from first principles)

${flawContext.prompt_injection}`;

      const result = await queryGemini({ prompt, temperature: 0.15 });

      // Emit to central adaptive evidence architecture
      processAdaptiveEvidence({
        user_id: getAuthenticatedUserId(req),
        feature: 'first_principles',
        robust_mechanism: true,
        correct_reasoning: true,
        evidence_summary: `First-principles deconstruction of "${(topic_or_concept || '').slice(0, 60)}": Evaluated foundational axioms and derivations.`,
      });

      res.json({
        success: true,
        data: { analysis: result.text },
        metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reverse Engineering Mode Endpoint
  app.post('/api/reverse-engineering', async (req: Request, res: Response) => {
    try {
      const { observation, user_hypotheses } = req.body;
      const flawContext = getUserCognitiveFlawSummary();

      const prompt = `REVERSE-ENGINEERING MODE:
Physical / Experimental Observation:
"""
${observation}
"""

${user_hypotheses ? `User Proposed Hypotheses:\n"""\n${user_hypotheses}\n"""\n` : ''}

Guide the reverse-engineering deduction using:
Observation
→ Hypotheses generation
→ Specific verifiable predictions for each
→ Critical Discriminator test or measurement setup
→ Test result interpretation
→ Final updated mechanistic model

Crucial requirement: Distinguish strictly between "possible explanation" and "best-supported explanation" using Bayesian likelihood, conservation laws, and dynamical equations.

${flawContext.prompt_injection}`;

      const result = await queryGemini({ prompt, temperature: 0.2 });

      // Emit to central adaptive evidence architecture
      processAdaptiveEvidence({
        user_id: getAuthenticatedUserId(req),
        feature: 'reverse_engineering',
        discriminator_identified: true,
        robust_mechanism: true,
        evidence_summary: `Reverse-engineering deduction on observation: Evaluated hypothesis generation and gold-standard discriminators.`,
      });

      res.json({
        success: true,
        data: { deduction: result.text },
        metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Simulations Endpoints
  app.get('/api/simulations', (req: Request, res: Response) => {
    try {
      const sims = db.prepare(`
        SELECT s.id, s.topic_id, s.title, s.scenario, s.difficulty, t.name as topic_name,
               s.system_presentation, s.available_investigations, s.available_decisions
        FROM simulations s
        JOIN topics t ON s.topic_id = t.id
      `).all() as any[];

      const parsed = sims.map((s) => ({
        ...s,
        system_presentation: JSON.parse(s.system_presentation || s.patient_presentation || '{}'),
        available_investigations: JSON.parse(s.available_investigations || '[]').map((inv: any) => ({
          id: inv.id,
          name: inv.name,
          cost_cognitive: inv.cost_cognitive,
          // do NOT reveal hidden results upfront
        })),
        available_decisions: JSON.parse(s.available_decisions || '[]').map((dec: any) => ({
          id: dec.id,
          intervention: dec.intervention,
        })),
      }));

      res.json({ success: true, data: parsed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/simulations/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sim = db.prepare(`
        SELECT s.*, t.name as topic_name
        FROM simulations s
        JOIN topics t ON s.topic_id = t.id
        WHERE s.id = ?
      `).get(id) as any;

      if (!sim) {
        return res.status(404).json({ success: false, error: 'Simulation not found' });
      }

      res.json({
        success: true,
        data: {
          ...sim,
          system_presentation: JSON.parse(sim.system_presentation || sim.patient_presentation || '{}'),
          available_investigations: JSON.parse(sim.available_investigations || '[]'),
          available_decisions: JSON.parse(sim.available_decisions || '[]'),
          hidden_state: JSON.parse(sim.hidden_state || '{}'),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/simulations/attempt', (req: Request, res: Response) => {
    try {
      const { simulation_id, hypotheses, evidence_used, decisions, confidence } = req.body;
      const sim = db.prepare('SELECT * FROM simulations WHERE id = ?').get(simulation_id) as any;
      if (!sim) {
        return res.status(404).json({ success: false, error: 'Simulation not found' });
      }

      const availableDecisions = JSON.parse(sim.available_decisions || '[]');
      const availableInvestigations = JSON.parse(sim.available_investigations || '[]');
      const hiddenState = JSON.parse(sim.hidden_state || '{}');

      // Check for overanalysis (requesting redundant tests when discriminators were already available)
      const nonDiscriminatorCount = evidence_used.filter((eId: string) => {
        const inv = availableInvestigations.find((i: any) => i.id === eId);
        return inv && !inv.is_discriminator;
      }).length;

      const overanalyzed = nonDiscriminatorCount >= 2;
      const chosenDecision = availableDecisions.find((d: any) => decisions.includes(d.id));
      const outcome = chosenDecision?.outcome_feedback || 'Intervention recorded.';

      const id = 'sim_att_' + Date.now();
      const now = new Date().toISOString();
      const userId = getAuthenticatedUserId(req);

      db.prepare(`
        INSERT INTO simulation_attempts (
          id, user_id, simulation_id, hypotheses, evidence_used, decisions,
          confidence, outcome, model_update, unnecessary_investigations_count, overanalyzed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        simulation_id,
        JSON.stringify(hypotheses || []),
        JSON.stringify(evidence_used || []),
        JSON.stringify(decisions || []),
        confidence || 4,
        outcome,
        hiddenState.hidden_physical_state || hiddenState.hidden_mechanism || hiddenState.hidden_state || '',
        nonDiscriminatorCount,
        overanalyzed ? 1 : 0,
        now
      );

      // Emit to central adaptive evidence architecture
      processAdaptiveEvidence({
        user_id: userId,
        feature: 'simulation',
        topic_id: sim.topic_id,
        error_id: overanalyzed ? 'err_overanalysis_trap' : null,
        error_name: overanalyzed ? 'Overanalysis & Reluctance to Commit' : null,
        correct_answer: chosenDecision?.is_optimal || false,
        correct_reasoning: !overanalyzed,
        discriminator_identified: !overanalyzed,
        confidence: confidence ? confidence * 20 : 80,
        evidence_summary: `Physical Simulation "${sim.title}": ${overanalyzed ? 'Overanalysis trap triggered — requested superfluous redundant measurements.' : 'Efficient discriminator-focused parameter commit.'}`,
        created_at: now,
      });

      res.json({
        success: true,
        data: {
          outcome,
          is_optimal: chosenDecision?.is_optimal || false,
          hidden_physical_state: hiddenState.hidden_physical_state || hiddenState.hidden_mechanism || hiddenState.hidden_state || '',
          hidden_mechanism: hiddenState.hidden_physical_state || hiddenState.hidden_mechanism || hiddenState.hidden_state || '',
          discriminator_explanation: hiddenState.gold_standard_discriminator,
          overanalysis_flag: overanalyzed,
          anti_overanalysis_message: overanalyzed
            ? 'STOP — ENOUGH INFORMATION. COMMIT. You gathered surplus measurements beyond the discriminator threshold.'
            : 'Excellent cognitive efficiency. You committed when the discriminator satisfied evidence threshold.',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Tests & MCQs Endpoints - Personalized Adaptive Reasoning Engine
  app.get('/api/questions', (req: Request, res: Response) => {
    try {
      const { topic_id, mode } = req.query;
      let questions;
      if (topic_id) {
        questions = db.prepare(`
          SELECT q.*, t.name as topic_name, s.name as subject_name
          FROM questions q
          JOIN topics t ON q.topic_id = t.id
          JOIN subjects s ON t.subject_id = s.id
          WHERE q.topic_id = ?
        `).all(topic_id as string) as any[];

        if (questions.length === 0) {
          questions = db.prepare(`
            SELECT q.*, t.name as topic_name, s.name as subject_name
            FROM questions q
            JOIN topics t ON q.topic_id = t.id
            JOIN subjects s ON t.subject_id = s.id
            LIMIT 10
          `).all() as any[];
        }
      } else {
        questions = db.prepare(`
          SELECT q.*, t.name as topic_name, s.name as subject_name
          FROM questions q
          JOIN topics t ON q.topic_id = t.id
          JOIN subjects s ON t.subject_id = s.id
        `).all() as any[];
      }

      // Merge curated diagnostic questions into the pool to ensure all 10 archetypes are accessible
      const dbIds = new Set(questions.map((q) => q.id));
      const curatedToAdd = CURATED_DIAGNOSTIC_QUESTIONS.filter((cq) => {
        if (dbIds.has(cq.id)) return false;
        if (topic_id && cq.topic_id !== topic_id) return false;
        return true;
      });

      const parsed = [
        ...questions.map((q) => {
          const curatedMatch = CURATED_DIAGNOSTIC_QUESTIONS.find((c) => c.id === q.id);
          return {
            ...q,
            options: JSON.parse(q.options || '[]'),
            question_type: q.question_type || curatedMatch?.question_type || 'TYPE_A_DIRECT_DIAGNOSTIC',
            root_error_target: q.root_error_target || curatedMatch?.root_error_target,
            internal_rationale: q.internal_rationale || curatedMatch?.internal_rationale,
            competing_paths: curatedMatch?.competing_paths,
            falsification_criteria: curatedMatch?.falsification_criteria,
          };
        }),
        ...curatedToAdd,
      ];

      res.json({ success: true, data: parsed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Adaptive Diagnostic Question Selector
  app.all('/api/tests/adaptive-select', async (req: Request, res: Response) => {
    try {
      const source = req.method === 'POST' ? req.body : req.query;
      const mode = (source.mode as any) || 'mixed_adaptive';
      const topic_id = source.topic_id as string | undefined;
      let topic_ids: string[] | undefined = undefined;
      if (source.topic_ids) {
        if (Array.isArray(source.topic_ids)) {
          topic_ids = source.topic_ids;
        } else if (typeof source.topic_ids === 'string') {
          topic_ids = source.topic_ids.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      const custom_topic_name = source.custom_topic_name as string | undefined;
      const topic_name = source.topic_name as string | undefined;
      const focus = source.focus as any;
      const difficulty = source.difficulty as string | undefined;
      const question_format = source.question_format as 'mcq' | 'long_answer' | undefined;
      const detected_gaps = source.detected_gaps ? (Array.isArray(source.detected_gaps) ? source.detected_gaps : [source.detected_gaps]) : undefined;
      const context_summary = source.context_summary as string | undefined;
      const unresolved_questions = source.unresolved_questions ? (Array.isArray(source.unresolved_questions) ? source.unresolved_questions : [source.unresolved_questions]) : undefined;

      const question = await selectAdaptiveQuestion({
        mode,
        topic_id,
        topic_ids,
        custom_topic_name,
        topic_name,
        focus,
        difficulty,
        question_format,
        detected_gaps,
        context_summary,
        unresolved_questions,
      });

      res.json({ success: true, data: question });
    } catch (err: any) {
      console.error('Error selecting adaptive question:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dynamic Question Generator
  app.post('/api/tests/generate-dynamic', async (req: Request, res: Response) => {
    try {
      const {
        target_error_id,
        topic_id,
        custom_topic_name,
        topic_name,
        mode,
        difficulty,
        question_format,
        detected_gaps,
        context_summary,
        unresolved_questions,
      } = req.body;
      const userId = getAuthenticatedUserId(req);
      const row = db.prepare('SELECT error_profile FROM user_model WHERE user_id = ?').get(userId) as any;
      let errors = INITIAL_HIERARCHICAL_ERRORS;
      if (row?.error_profile) {
        try {
          errors = JSON.parse(row.error_profile);
        } catch {}
      }

      const targetError = errors.find((e) => e.id === target_error_id) || errors[0];

      const question = await generateDynamicDiagnosticQuestion({
        target_error: targetError,
        topic_id,
        custom_topic_name,
        topic_name,
        mode: mode || 'weakness_hunt',
        difficulty: difficulty || 'Mechanistic',
        question_format: question_format || 'mcq',
        detected_gaps,
        context_summary,
        unresolved_questions,
      });

      res.json({ success: true, data: question });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Diagnostic Question Attempt Evaluation
  app.post('/api/questions/attempt', async (req: Request, res: Response) => {
    try {
      const { question_id, answer, confidence, reasoning, time_taken } = req.body;
      if (!question_id || !answer) {
        return res.status(400).json({ success: false, error: 'Question ID and answer are required' });
      }

      const evaluation = await evaluateAdaptiveAttempt({
        question_id,
        answer,
        confidence: Number(confidence) || 80,
        reasoning: reasoning || '',
        time_taken: Number(time_taken) || 25,
        user_id: getAuthenticatedUserId(req),
      });

      res.json({
        success: true,
        data: evaluation,
      });
    } catch (err: any) {
      console.error('Error evaluating adaptive attempt:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Close-Book Reconstruction
  app.get('/api/reconstructions', (req: Request, res: Response) => {
    try {
      const rows = db.prepare(`
        SELECT r.*, t.name as topic_name
        FROM reconstructions r
        JOIN topics t ON r.topic_id = t.id
        ORDER BY r.created_at DESC
      `).all() as any[];

      const parsed = rows.map((r) => ({
        ...r,
        user_reconstruction: JSON.parse(r.user_reconstruction || '{}'),
        evaluation: JSON.parse(r.evaluation || '{}'),
      }));

      res.json({ success: true, data: parsed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/reconstructions', async (req: Request, res: Response) => {
    try {
      const {
        topic_id,
        causal_chain,
        directionality,
        critical_variables,
        discriminator,
        exception,
        paragraph_explanation,
        explanation_mode = 'both',
      } = req.body;

      const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topic_id) as any;
      const mech = db.prepare('SELECT * FROM mechanisms WHERE topic_id = ?').get(topic_id) as any;
      const flawContext = getUserCognitiveFlawSummary();

      let studentInputSection = '';
      if (paragraph_explanation && paragraph_explanation.trim()) {
        studentInputSection += `\n--- STUDENT NARRATIVE PARAGRAPH EXPLANATION ---\n${paragraph_explanation.trim()}\n`;
      }
      if (causal_chain || directionality || critical_variables || discriminator || exception) {
        studentInputSection += `\n--- STUDENT STRUCTURED FRAMEWORK ---\n` +
          `- Causal Chain: ${causal_chain || 'N/A'}\n` +
          `- Directionality: ${directionality || 'N/A'}\n` +
          `- Critical Variables: ${critical_variables || 'N/A'}\n` +
          `- Discriminator: ${discriminator || 'N/A'}\n` +
          `- Exception: ${exception || 'N/A'}\n`;
      }

      const prompt = `EVALUATE CLOSE-BOOK MECHANISM RECONSTRUCTION:
Topic: ${topic ? topic.name : 'Physics / Dynamical Mechanisms'}
Mode of Explanation Submitted: ${explanation_mode}

Canonical Benchmark Mechanism:
"""
${mech ? mech.canonical_mechanism : 'Consensus physical mechanism'}
"""

Student Submission:${studentInputSection}

Instructions for Evaluation:
1. Evaluate whether the student articulated the mechanism with first-principles physical precision, rigorous causal directionality, correct conservation laws, and key discriminators.
2. If a narrative paragraph was provided, evaluate the cohesion, clarity, and depth of causal flow.
3. If the structured framework was provided, evaluate each of the 5 pillars.
4. Check if the student exhibited known cognitive flaws (e.g., reversing directionality, confounding association with causation, premature closure).
5. On the FIRST line of your response, output exactly:
SCORE: <integer from 0 to 100>
6. Follow immediately with detailed markdown critique including:
- **Causal Flow & First Principles**: Strengths and gaps.
- **Directionality & Thresholds**: Accuracy of cause-and-effect relationships.
- **Cognitive Profile Impact**: How this reconstruction demonstrates mastery or pinpoints blind spots.

7. At the very end of your response, output a strict JSON block wrapped in <!-- RECONSTRUCTION_DIAGNOSIS: ... -->:
<!-- RECONSTRUCTION_DIAGNOSIS:
{
  "score": <integer from 0 to 100>,
  "reconstructed_model": "<concise 2-3 sentence synthesis of the mental model assembled by the student>",
  "required_model": "<concise canonical physical mechanism that dynamical laws require>",
  "missing_causal_links": ["<specific missing intermediate physical or mathematical link>", "<another missing step if any>"],
  "incorrect_assumptions": ["<specific directionality flaw or unfounded premise if any>"],
  "recovered_understanding": ["<core first-principles axiom or causal relationship correctly reconstructed from memory>", "<another solid link>"]
}
-->

${flawContext.prompt_injection}`;

      const result = await queryGemini({ prompt, temperature: 0.15 });
      const now = new Date().toISOString();
      const id = 'recon_' + Date.now();

      // Extract numerical score from response
      let evaluatedScore = 80;
      const scoreMatch = result.text.match(/SCORE:\s*(\d{1,3})/i);
      if (scoreMatch && scoreMatch[1]) {
        const parsed = parseInt(scoreMatch[1], 10);
        if (parsed >= 0 && parsed <= 100) {
          evaluatedScore = parsed;
        }
      }

      // Parse structured breakdown if present
      let reconstructedModel = '';
      let requiredModel = mech ? mech.canonical_mechanism : '';
      let missingLinks: string[] = [];
      let incorrectAssumptions: string[] = [];
      let recoveredUnderstanding: string[] = [];

      const diagnosisMatch = result.text.match(/<!--\s*RECONSTRUCTION_DIAGNOSIS:\s*(\{.*?\})\s*-->/s);
      if (diagnosisMatch && diagnosisMatch[1]) {
        try {
          const parsed = JSON.parse(diagnosisMatch[1]);
          if (parsed.reconstructed_model) reconstructedModel = parsed.reconstructed_model;
          if (parsed.required_model) requiredModel = parsed.required_model;
          if (Array.isArray(parsed.missing_causal_links)) missingLinks = parsed.missing_causal_links;
          if (Array.isArray(parsed.incorrect_assumptions)) incorrectAssumptions = parsed.incorrect_assumptions;
          if (Array.isArray(parsed.recovered_understanding)) recoveredUnderstanding = parsed.recovered_understanding;
          if (typeof parsed.score === 'number' && parsed.score >= 0 && parsed.score <= 100) {
            evaluatedScore = parsed.score;
          }
        } catch (e) {
          // Fallback parsing
        }
      }

      // Clean critique text removing the SCORE header and JSON block if present
      let cleanCritique = result.text
        .replace(/<!--\s*RECONSTRUCTION_DIAGNOSIS:.*?-->/s, '')
        .replace(/^SCORE:\s*\d{1,3}\s*\n?/i, '')
        .trim();

      const evaluation = {
        score: evaluatedScore,
        critique: cleanCritique,
        canonical_comparison: mech ? mech.canonical_mechanism : requiredModel,
        reconstructed_model: reconstructedModel,
        required_model: requiredModel || (mech ? mech.canonical_mechanism : ''),
        missing_causal_links: missingLinks,
        incorrect_assumptions: incorrectAssumptions,
        recovered_understanding: recoveredUnderstanding,
      };

      const userId = getAuthenticatedUserId(req);
      db.prepare(`
        INSERT INTO reconstructions (
          id, user_id, topic_id, source_mechanism, user_reconstruction, evaluation, score, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        topic_id,
        mech ? mech.canonical_mechanism : '',
        JSON.stringify({
          explanation_mode,
          paragraph_explanation,
          causal_chain,
          directionality,
          critical_variables,
          discriminator,
          exception,
        }),
        JSON.stringify(evaluation),
        evaluatedScore,
        now
      );

      // Emit to central adaptive evidence architecture
      processAdaptiveEvidence({
        user_id: userId,
        feature: 'reconstruction',
        topic_id: topic_id,
        topic_name: topic?.name,
        reconstruction_score: evaluatedScore,
        robust_mechanism: evaluatedScore >= 75,
        correct_reasoning: evaluatedScore >= 70,
        discriminator_identified: evaluatedScore >= 75,
        evidence_summary: `Close-Book Reconstruction on ${topic?.name || 'Topic'}: Score ${evaluatedScore}%. Evaluated physical causal flow, directionality, and discriminators.`,
        created_at: now,
      });

      res.json({
        success: true,
        data: { id, score: evaluatedScore, evaluation },
        metadata: { provider: result.provider, model: result.model, timestamp: result.timestamp },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // History aggregator
  app.get('/api/history', (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const recentDoubts = db.prepare(`
        SELECT c.id, c.title, c.created_at, t.name as topic_name
        FROM chat_conversations c
        LEFT JOIN topics t ON c.topic_id = t.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
        LIMIT 10
      `).all(userId);

      const recentMechanisms = db.prepare(`
        SELECT m.id, m.title, m.created_at, e.overall_score, t.name as topic_name
        FROM mechanisms m
        LEFT JOIN mechanism_evaluations e ON e.mechanism_id = m.id
        JOIN topics t ON m.topic_id = t.id
        WHERE m.user_id = ?
        ORDER BY m.created_at DESC
        LIMIT 10
      `).all(userId);

      const recentSimulations = db.prepare(`
        SELECT a.id, s.title, a.created_at, a.overanalyzed, a.confidence, a.hypotheses, a.outcome, a.model_update, t.name as topic_name
        FROM simulation_attempts a
        JOIN simulations s ON a.simulation_id = s.id
        LEFT JOIN topics t ON s.topic_id = t.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT 10
      `).all(userId);

      const recentReconstructions = db.prepare(`
        SELECT r.id, t.name as topic_name, r.score, r.created_at, r.user_reconstruction
        FROM reconstructions r
        JOIN topics t ON r.topic_id = t.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `).all(userId);

      const recentQuestions = db.prepare(`
        SELECT qa.id, qa.created_at, qa.correct, qa.confidence, qa.time_taken, qa.reasoning, qa.reasoning_error,
               q.question_text, q.mode, q.difficulty, t.name as topic_name
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        JOIN topics t ON q.topic_id = t.id
        WHERE qa.user_id = ?
        ORDER BY qa.created_at DESC
        LIMIT 15
      `).all(userId);

      res.json({
        success: true,
        data: {
          recentDoubts,
          recentMechanisms,
          recentSimulations,
          recentReconstructions,
          recentQuestions,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Settings endpoint
  app.get('/api/settings', (req: Request, res: Response) => {
    try {
      const tableCountResult = db.prepare(`SELECT count(*) as count FROM sqlite_master WHERE type='table'`).get() as any;
      res.json({
        success: true,
        data: {
          provider: AI_PROVIDER,
          model: CURRENT_MODEL,
          hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
          environment: process.env.NODE_ENV || 'development',
          databaseDriver: 'Node.js Native SQLite (node:sqlite DatabaseSync)',
          databasePath: './data/mechanism.db',
          tableCount: tableCountResult?.count || 17,
          foreignKeys: 'PRAGMA foreign_keys = ON (Enforced)',
          journalMode: 'WAL (Write-Ahead Logging)',
          sdk: '@google/genai (Interactions API)',
          securityProtocol: 'Strict Server-Side Key Encapsulation',
          costControl: 'Single Request per Query / Zero Duplicate Calls',
          engineVersion: 'MECHANISM v2.4.0',
        },
      });
    } catch (err: any) {
      res.json({
        success: true,
        data: {
          provider: AI_PROVIDER,
          model: CURRENT_MODEL,
          hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
        },
      });
    }
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MECHANISM server running on http://0.0.0.0:${PORT} [Model: ${CURRENT_MODEL}]`);
  });
}

startServer();
