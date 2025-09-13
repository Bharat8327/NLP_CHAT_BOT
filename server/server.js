import express from 'express';
import dotenv from 'dotenv';
import dbConnect from './config/dbConnect.js';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import geminiController from './controller/geminiController.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use(morgan('common'));
app.use(cookieParser());

const origin = 'http://localhost:5173';
app.use(cors({ credentials: true, origin }));

app.get('/', (req, res) => {
  res.status(200).send('server is start');
});

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
  geminiController.handleGeminiStream(socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const Port = process.env.PORT || 3000;
server.listen(Port, async () => {
  await dbConnect();
  console.log('Server running on Port', Port);
});
