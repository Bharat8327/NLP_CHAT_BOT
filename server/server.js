import express from 'express';
import dotenv from 'dotenv';
import dbConnect from './config/dbConnect.js';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { AccessToken } from 'livekit-server-sdk';
import { Server } from 'socket.io';

// Assuming you have this file
import geminiController from './controller/geminiController.js';

dotenv.config();

// 🚨 CRITICAL CHECK: Ensure variables are loaded and are of type string
const livekitApiKey = process.env.LIVEKIT_API_KEY;
const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

if (typeof livekitApiKey !== 'string' || typeof livekitApiSecret !== 'string') {
  console.error(
    '❌ FATAL ERROR: LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not a valid string.',
  );
  console.error(
    `API Key Type: ${typeof livekitApiKey}, API Secret Type: ${typeof livekitApiSecret}`,
  );
  process.exit(1);
}

const app = express();

app.use(express.json());
app.use(morgan('common'));
app.use(cookieParser());

const origin = process.env.CLIENT_URL;
app.use(cors({ credentials: true, origin }));

// Root endpoint for a basic health check
app.get('/', (req, res) => {
  res.status(200).send('Server is running! 🚀');
});

// Endpoint to generate a LiveKit token
app.get('/token', (req, res) => {
  try {
    const identity =
      req.query.identity || 'user_' + Math.random().toString(36).slice(2, 8);
    const room = req.query.room || 'default-room';

    console.log(`Generating token for identity: ${identity} in room: ${room}`);
    console.log(identity);

    const at = new AccessToken(
      'API9HMdGuDwQXea',
      'bvdcSB0MUI2grJPj1tpQLeIedrQcLnLLfIXihjsZ6K0B',
      { identity },
    );

    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    const token = at.toJwt();
    console.log('Token generated successfully.');
    res.status(200).json({ token });
  } catch (err) {
    console.error('🚨 Error creating token:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create and configure the HTTP and Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Assuming this function handles Gemini stream logic
  geminiController.handleGeminiStream(socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const Port = process.env.PORT || 3001;

// Start the server and connect to the database
server.listen(Port, async () => {
  await dbConnect();
  console.log(`✅ Server running on Port ${Port}`);
});
