import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import generalPermissionRoutes from "./routes/generalPermissionRoutes.js";

const app = express();

/* ---------------- MIDDLEWARE ---------------- */

// Parse JSON body
app.use(express.json());

// ✅ CORS for localhost development
app.use(
  cors({
    origin: true, // Allow all origins for development
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle preflight requests


/* ---------------- ROUTES ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/general-permission", generalPermissionRoutes);

/* ---------------- DATABASE ---------------- */

const mongoURL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart";

mongoose
  .connect(mongoURL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
