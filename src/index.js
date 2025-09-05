import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./db/connection.js";
import userRoutes from "./routes/userRoutes.js";
import adRoutes from "./routes/adRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:8080",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/wishlist", wishlistRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "OLX Backend API is running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
