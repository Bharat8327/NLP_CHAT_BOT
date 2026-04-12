import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

/**
 * Streaming service — manages Gemini AI streaming responses with
 * interruption support, context building, and error handling.
 */

// Singleton GenAI instance (connection reuse)
let genAIInstance = null;

function getGenAI() {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAIInstance;
}

/**
 * Get the configured Gemini model.
 */
function getModel() {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({
    model: process.env.MODEL || 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
    },
  });
}

/**
 * Stream a prompt to the AI and emit chunks via socket.
 *
 * @param {object} options
 * @param {string} options.prompt - The full prompt text
 * @param {object} options.socket - Socket.io socket instance
 * @param {object} options.abortSignal - An object with { aborted: boolean }
 * @returns {Promise<string>} The full response text
 */
export async function streamResponse({ prompt, socket, abortSignal }) {
  const timer = logger.startTimer('stream-response');

  try {
    const model = getModel();
    const result = await model.generateContentStream(prompt);
    let fullResponse = '';
    let chunkCount = 0;

    for await (const chunk of result.stream) {
      // Support interruption
      if (abortSignal?.aborted) {
        logger.info('Stream interrupted by client', {
          socketId: socket.id,
          chunksSent: chunkCount,
        });
        break;
      }

      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        chunkCount++;
        socket.emit('chat_chunk', chunkText);
      }
    }

    timer.end({
      socketId: socket.id,
      responseLength: fullResponse.length,
      chunkCount,
    });

    return fullResponse;
  } catch (error) {
    timer.end({ socketId: socket.id, error: error.message });
    throw error;
  }
}

/**
 * Build a contextual prompt from conversation history.
 *
 * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
 * @param {string} userMessage - The current user message
 * @param {object} options - Additional options
 * @param {string} options.systemInstruction - Optional system instruction
 * @returns {string} The full prompt with context
 */
export function buildContextualPrompt(history, userMessage, options = {}) {
  const parts = [];

  // System instruction
  if (options.systemInstruction) {
    parts.push(`System: ${options.systemInstruction}\n`);
  }

  // Add conversation history
  if (history.length > 0) {
    parts.push('Previous conversation:');
    for (const entry of history) {
      const role = entry.role === 'user' ? 'User' : 'Assistant';
      parts.push(`${role}: ${entry.content}`);
    }
    parts.push(''); // blank line separator
  }

  // Current message
  parts.push(`User: ${userMessage}`);
  parts.push('\nAssistant:');

  return parts.join('\n');
}

/**
 * Generate a single (non-streaming) response.
 *
 * @param {string} prompt - The prompt text
 * @returns {Promise<string>} The response text
 */
export async function generateResponse(prompt) {
  const timer = logger.startTimer('generate-response');

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    timer.end({ responseLength: text.length });
    return text;
  } catch (error) {
    timer.end({ error: error.message });
    throw error;
  }
}

export default { streamResponse, buildContextualPrompt, generateResponse };
