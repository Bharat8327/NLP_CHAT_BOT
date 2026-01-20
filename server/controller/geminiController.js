import { GoogleGenerativeAI } from '@google/generative-ai';

// WebSocket Controller (Socket.IO)
const handleGeminiStream = (socket) => {
  socket.on('send_message', async ({ text }) => {
    if (!text) {
      socket.emit('chat_error', 'Missing user message');
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: `${process.env.MODEL}` });

      const result = await model.generateContentStream(text);
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        socket.emit('chat_chunk', chunkText); // stream chunks to client
      }

      socket.emit('chat_done'); // final signal
    } catch (error) {
      console.error('Gemini error:', error);
      socket.emit('chat_error', error.message || 'Failed to generate response');
    }
  });
};

export default { handleGeminiStream };
