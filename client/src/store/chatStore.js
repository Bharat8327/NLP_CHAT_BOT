import { create } from 'zustand';
import api from '../lib/axiosInstance';

const DEFAULT_WELCOME = {
  id: 'welcome-1',
  type: 'bot',
  content: "Hello! I'm your AI assistant. How can I help you today?",
  timestamp: new Date().toLocaleTimeString(),
};

const EMPTY_MESSAGES = [];

// Sync debounce timer reference
let syncDebounceTimer = null;
const SYNC_DEBOUNCE_MS = 1500; // Wait 1.5s after last message before syncing
const MAX_SYNC_RETRIES = 3;

const useChatStore = create((set, get) => ({
      // ── UI Mode ────────────────────────────────────────
      uiMode: 'classic', // classic | voice | dashboard | avatar
      setUIMode: (mode) => set({ uiMode: mode }),

      // ── Sync lock ──────────────────────────────────────
      _isSyncing: false,

      // ── Chats ──────────────────────────────────────────
      chats: {
        '1': {
          id: '1',
          title: 'Welcome conversation',
          timestamp: new Date().toISOString().slice(0, 10),
          messages: [DEFAULT_WELCOME],
        },
      },
      activeChatId: '1',

      setActiveChat: (id) => set({ activeChatId: id }),

      createChat: () => {
        const id = Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7);
        set((s) => ({
          chats: {
            ...s.chats,
            [id]: {
              id,
              title: 'New conversation',
              timestamp: new Date().toISOString().slice(0, 10),
              messages: [
                {
                  ...DEFAULT_WELCOME,
                  id: `welcome-${id}`,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ],
            },
          },
          activeChatId: id,
        }));
        return id;
      },

      deleteChat: (id) =>
        set((s) => {
          const copy = { ...s.chats };
          const cloudId = copy[id]?.cloudId; // Check if we have a Mongo ID attached!
          delete copy[id];
          
          const remaining = Object.keys(copy);
          
          if (cloudId) {
            const deleteConfig = { headers: { 'X-Background-Sync': 'true' } };
            api.delete(`/api/chat/${cloudId}`, deleteConfig).catch(err => console.warn('Failed cloud chat deletion', err));
          }

          return {
            chats: copy,
            activeChatId:
              s.activeChatId === id
                ? remaining[0] || ''
                : s.activeChatId,
          };
        }),

      addMessage: (chatId, message) =>
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          return {
            chats: {
              ...s.chats,
              [chatId]: {
                ...chat,
                messages: [...chat.messages, message],
              },
            },
          };
        }),

      updateLastBotMessage: (chatId, content) =>
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          const msgs = [...chat.messages];
          const tempIdx = msgs.findIndex((m) => m.type === 'bot-temp');
          if (tempIdx >= 0) {
            msgs[tempIdx] = { ...msgs[tempIdx], content };
          } else {
            msgs.push({
              id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
              type: 'bot-temp',
              content,
              timestamp: new Date().toLocaleTimeString(),
            });
          }
          return {
            chats: { ...s.chats, [chatId]: { ...chat, messages: msgs } },
          };
        }),

      finalizeBotMessage: (chatId, content) =>
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          const msgs = chat.messages.filter((m) => m.type !== 'bot-temp');
          msgs.push({
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
            type: 'bot',
            content,
            timestamp: new Date().toLocaleTimeString(),
          });
          
          // Debounced sync — waits for rapid messages to settle before syncing
          if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
          syncDebounceTimer = setTimeout(() => get().syncCurrentChat(), SYNC_DEBOUNCE_MS);

          return {
            chats: { ...s.chats, [chatId]: { ...chat, messages: msgs } },
          };
        }),

      renameChat: (id, title) =>
        set((s) => ({
          chats: {
            ...s.chats,
            [id]: { ...s.chats[id], title },
          },
        })),

      // ── Active messages helper ─────────────────────────
      getActiveMessages: () => {
        const s = get();
        return s.chats[s.activeChatId]?.messages || EMPTY_MESSAGES;
      },

      // ── Voice Settings ─────────────────────────────────
      voiceSettings: {
        language: 'en-US',
        speed: 1,
        volume: 1,
        voiceURI: '',
        autoPlay: false,
      },
      updateVoiceSettings: (patch) =>
        set((s) => ({
          voiceSettings: { ...s.voiceSettings, ...patch },
        })),

      // ── Session metrics ────────────────────────────────
      metrics: {
        totalMessages: 0,
        avgResponseTime: 0,
        sessionsCount: 0,
        languagesUsed: [],
      },
      bumpMetric: (key, value) =>
        set((s) => ({
          metrics: { ...s.metrics, [key]: value },
        })),

      // ── Typing indicator ───────────────────────────────
      isTyping: false,
      setTyping: (v) => set({ isTyping: v }),

      // ── Last bot message (for TTS) ─────────────────────
      lastBotMessage: null,
      setLastBotMessage: (msg) => set({ lastBotMessage: msg }),

      // ── Cloud Database Synchronization Orchestration ───
      fetchCloudChats: async () => {
        try {
          const { data } = await api.get('/api/chat', { headers: { 'X-Background-Sync': 'true' } });
          if (data.sessions && data.sessions.length > 0) {
            set((s) => {
              const newChats = { ...s.chats };
              data.sessions.forEach(session => {
                // Attach remote chats locally. We map backend tracking to local keys
                newChats[session.id] = {
                  id: session.id, // Using Mongo ObjectID inherently
                  cloudId: session.id, 
                  title: session.title,
                  timestamp: session.timestamp,
                  messages: session.messages,
                };
              });
              // Auto-mount the most recent Cloud chat if the user is currently staring at a blank placeholder
              let resolvedId = s.activeChatId;
              if (s.activeChatId === '1' && data.sessions.length > 0) {
                resolvedId = data.sessions[0].id;
              }
              
              return { chats: newChats, activeChatId: resolvedId };
            });
          }
        } catch (err) {
          console.warn('Failed to fetch cloud chats', err.message || err);
        }
      },

      syncCurrentChat: async (retryCount = 0) => {
        const s = get();
        
        // Prevent concurrent syncs
        if (s._isSyncing) return;
        
        const chat = s.chats[s.activeChatId];
        if (!chat || chat.messages.length <= 1) return; // Don't upload empty default welcomes

        set({ _isSyncing: true });

        try {
          const payload = {
            title: chat.title,
            messages: chat.messages,
            uiMode: s.uiMode,
            chatId: chat.cloudId // Only provided if it already exists remotely!
          };

          // Mark as background sync so axios interceptor won't force logout on 401
          const config = { headers: { 'X-Background-Sync': 'true' } };
          const { data } = await api.post('/api/chat', payload, config);
          
          // If this was a virgin chat, map the returned Mongo ID to our local object!
          if (!chat.cloudId && data.id) {
            set(state => ({
              chats: {
                ...state.chats,
                [s.activeChatId]: { ...state.chats[s.activeChatId], cloudId: data.id }
              }
            }));
          }
        } catch (err) {
          console.warn(`Chat sync failed (attempt ${retryCount + 1})`, err.message || err);
          
          // Retry with exponential backoff (max 3 retries)
          if (retryCount < MAX_SYNC_RETRIES) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            setTimeout(() => {
              set({ _isSyncing: false }); // Unlock before retry
              get().syncCurrentChat(retryCount + 1);
            }, delay);
            return; // Don't unlock yet — the retry will handle it
          }
        } finally {
          set({ _isSyncing: false });
        }
      }
    })
);

export default useChatStore;
