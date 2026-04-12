import { parseVoiceCommand } from '../services/voiceCommandService.js';
import { streamResponse, buildContextualPrompt } from '../services/streamingService.js';
import logger from '../utils/logger.js';

// In-memory conversation history per socket (last 10 turns)
const conversationHistory = new Map();
const MAX_HISTORY = 10;

/**
 * Get or create conversation history for a socket.
 */
function getHistory(socketId) {
  if (!conversationHistory.has(socketId)) {
    conversationHistory.set(socketId, []);
  }
  return conversationHistory.get(socketId);
}

/**
 * Add a message to conversation history.
 */
function addToHistory(socketId, role, content) {
  const history = getHistory(socketId);
  history.push({ role, content });
  // Keep only the last MAX_HISTORY pairs
  if (history.length > MAX_HISTORY * 2) {
    conversationHistory.set(socketId, history.slice(-MAX_HISTORY * 2));
  }
}

/**
 * WebSocket Controller (Socket.IO)
 * Handles: send_message, stop_generation, get_history, clear_history
 */
const handleGeminiStream = (socket, rateLimiter) => {
  let abortSignal = { aborted: false };

  // ── Handle stop generation ────────────────────────
  socket.on('stop_generation', () => {
    logger.info('Generation stopped by client', { socketId: socket.id });
    abortSignal.aborted = true;
    socket.emit('chat_done');
  });

  // ── Handle get conversation history ───────────────
  socket.on('get_history', () => {
    const history = getHistory(socket.id);
    socket.emit('history_data', history);
  });

  // ── Handle clear conversation history ─────────────
  socket.on('clear_history', () => {
    conversationHistory.delete(socket.id);
    logger.info('History cleared', { socketId: socket.id });
    socket.emit('history_cleared');
  });

  // ── Handle send message ───────────────────────────
  socket.on('send_message', async ({ text, lang }) => {
    if (!text) {
      socket.emit('chat_error', 'Missing user message');
      return;
    }

    // Rate limit check
    if (rateLimiter && !rateLimiter(socket.id)) {
      socket.emit('chat_error', 'You are sending messages too fast. Please slow down.');
      return;
    }

    // Reset abort signal for new message
    abortSignal = { aborted: false };

    try {
      const history = getHistory(socket.id);

      // Parse for voice commands
      const { isCommand, command, modifiedPrompt } = parseVoiceCommand(
        text,
        history
      );

      if (isCommand) {
        logger.info(`Voice command detected: ${command}`, {
          socketId: socket.id,
          originalText: text,
        });
      }

      // Add user message to history
      addToHistory(socket.id, 'user', text);

      // Build prompt with conversation context
      const fullPrompt = buildContextualPrompt(
        history.slice(0, -1), // exclude the just-added user message
        modifiedPrompt,
        {
          systemInstruction: lang && lang !== 'en-US'
            ? `The user is communicating in ${lang}. Respond in the same language when appropriate.`
            : undefined,
        }
      );

      // Stream the response
      const fullResponse = await streamResponse({
        prompt: fullPrompt,
        socket,
        abortSignal,
      });

      // Save AI response to history
      if (fullResponse) {
        addToHistory(socket.id, 'assistant', fullResponse);
      }

      socket.emit('chat_done');
    } catch (error) {
      if (error.name === 'AbortError') {
        logger.info('Generation aborted', { socketId: socket.id });
        return;
      }

      logger.error('Gemini streaming error', {
        socketId: socket.id,
        error: error.message,
        stack: error.stack?.split('\n')[0],
      });

      // Provide user-friendly error messages
      let errorMsg = 'Failed to generate response';
      if (error.message?.includes('SAFETY')) {
        errorMsg = 'Response blocked by safety filters. Please rephrase your message.';
      } else if (error.message?.includes('fetch failed')) {
        errorMsg = 'Network error: Failed to connect to the AI service. Please check your internet connection or try again later.';
      } else if (error.message?.includes('quota') || error.message?.includes('429')) {
        errorMsg = 'API rate limit reached. Please wait a moment and try again.';
      } else if (error.message?.includes('API_KEY')) {
        errorMsg = 'AI service configuration error. Please contact the administrator.';
      }

      socket.emit('chat_error', errorMsg);
    }
  });

  // ── Cleanup on disconnect ─────────────────────────
  socket.on('disconnect', () => {
    conversationHistory.delete(socket.id);
    logger.info('Client history cleaned up', { socketId: socket.id });
  });
};

export default { handleGeminiStream };
