import express, { Router } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser'; 
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import MainRoutes from "./routes/index.js"
import { logApiCall } from "./controllers/apiLogController.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS settings
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Apply API logging middleware to all /mccs routes
app.use("/mccs", logApiCall, MainRoutes);

app.get("/api/test", async (req, res) => {
    res.json({ message: "Hello from express " });
  });
  
// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      httpServer.listen(process.env.PORT, () => {
        console.log(
          `Server Started at PORT - ${process.env.PORT}, Connection to Database Done`
        );
        console.log('Socket.io server ready for real-time alerts');
      });
    })
    .catch((error) => {
      console.log(`Error Connecting to Database : ${error}`);
    });
}

export default app;