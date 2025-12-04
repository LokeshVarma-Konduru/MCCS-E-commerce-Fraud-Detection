import express, { Router } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import MainRoutes from "./routes/index.js";
import { logApiCall } from "./controllers/apiLogController.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const trimmed = cookie.trim();
    if (!trimmed) {
      return acc;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return acc;
    }
    const name = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    try {
      acc[name] = decodeURIComponent(value);
    } catch (_error) {
      acc[name] = value;
    }
    return acc;
  }, {});
};

// Initialize Socket.io with CORS settings
export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://prod-mccs.discovery.cs.vt.edu"],
    credentials: true,
    methods: ["GET", "POST"]
  }
});

io.use(async (socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie || "");
    const token = cookies.authonlycookie;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("role storeID");

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.user = {
      id: user._id.toString(),
      role: user.role,
      storeID: user.storeID || null
    };

    return next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    return next(new Error("Unauthorized"));
  }
});

app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "https://prod-mccs.discovery.cs.vt.edu"],
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
  const { user } = socket;
  const userLabel = user ? `${user.id} (${user.role})` : "unknown user";

  if (user?.role === "Admin" || user?.role === "Developer") {
    socket.join("alerts:all");
  }

  if (user?.role === "StoreManager" && user.storeID) {
    socket.join(`store:${user.storeID}`);
  }

  if (user?.id) {
    socket.join(`user:${user.id}`);
  }

  console.log("Client connected:", socket.id, "->", userLabel);
  
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
