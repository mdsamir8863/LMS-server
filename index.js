// Load environment variables early
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import Stripe from "stripe";

// Check essential environment variables
const requiredEnv = ["STRIPE_SECRET_KEY", "FRONTEND_URL", "MONGO_URI"];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`❌ Missing environment variable: ${env}`);
    process.exit(1);
  }
});

// Connect to the database
connectDB();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Default middlewares
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

// Allow requests from frontend (deployed + local)
const allowedOrigins = [
  process.env.FRONTEND_URL, // Deployed frontend URL
  "http://localhost:5173", // Local development
];

// Configure CORS properly
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// API Routes
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);

// Test endpoint
app.use("/api/v1/dev", (req, res) => {
  res.json({
    created_by: "MD SAMIR ANSARI",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

// Graceful Shutdown
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
  server.close(() => process.exit(1));
});

process.on("SIGINT", async () => {
  console.log("🔌 Shutting down gracefully...");
  await mongoose.disconnect();
  process.exit(0);
});
