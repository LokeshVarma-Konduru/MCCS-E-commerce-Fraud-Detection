import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser'; 
import cors from 'cors';
import MainRoutes from "./routes/index.js"

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use("/mccs", MainRoutes);

app.get("/api/test", async (req, res) => {
    res.json({ message: "Hello from express " });
  });
  
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      app.listen(process.env.PORT, () => {
        console.log(
          `Server Started at PORT - ${process.env.PORT}, Connection to Database Done`
        );
      });
    })
    .catch((error) => {
      console.log(`Error Connecting to Database : ${error}`);
    });
}

export default app;