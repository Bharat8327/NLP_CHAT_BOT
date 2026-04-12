/**
 * Voice command parser — detects special commands in text input
 * and returns structured command objects.
 */

const COMMANDS = [
  {
    pattern: /^(summarize|summary)\b/i,
    command: 'summarize',
    description: 'Summarize the conversation',
    buildPrompt: (text, context) =>
      `Please provide a concise summary of our conversation so far:\n\n${context.map((c) => `${c.role}: ${c.content}`).join('\n')}`,
  },
  {
    pattern: /^translate\s+(?:to\s+)?(\w+)\s*[:\-]?\s*(.*)/i,
    command: 'translate',
    description: 'Translate text to another language',
    buildPrompt: (text, _context, match) =>
      `Translate the following to ${match[1]}: "${match[2] || 'the last message'}"`,
  },
  {
    pattern: /^explain\b\s*(.*)/i,
    command: 'explain',
    description: 'Explain a concept in detail',
    buildPrompt: (text, _context, match) =>
      `Please explain in detail: ${match[1] || text}`,
  },
  {
    pattern: /^search\b\s*(.*)/i,
    command: 'search',
    description: 'Search for information',
    buildPrompt: (text, _context, match) =>
      `Search and provide information about: ${match[1] || text}`,
  },
  {
    pattern: /^simplify\b\s*(.*)/i,
    command: 'simplify',
    description: 'Simplify the explanation',
    buildPrompt: (text) =>
      `Please simplify this explanation and make it easy to understand: ${text}`,
  },
  {
    pattern: /^(code|write code)\b\s*(.*)/i,
    command: 'code',
    description: 'Generate code',
    buildPrompt: (text, _context, match) =>
      `Write code for: ${match[2] || text}`,
  },
];

/**
 * Parse text for voice commands.
 * @param {string} text - The input text
 * @param {Array} conversationHistory - Array of {role, content}
 * @returns {{ isCommand: boolean, command?: string, modifiedPrompt: string }}
 */
export function parseVoiceCommand(text, conversationHistory = []) {
  if (!text) return { isCommand: false, modifiedPrompt: text };

  for (const cmd of COMMANDS) {
    const match = text.match(cmd.pattern);
    if (match) {
      return {
        isCommand: true,
        command: cmd.command,
        modifiedPrompt: cmd.buildPrompt(text, conversationHistory, match),
        originalText: text,
      };
    }
  }

  return { isCommand: false, modifiedPrompt: text };
}

/**
 * Get available commands for help text.
 */
export function getAvailableCommands() {
  return COMMANDS.map((c) => ({
    command: c.command,
    description: c.description,
  }));
}

export default { parseVoiceCommand, getAvailableCommands };
