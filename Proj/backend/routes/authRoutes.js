import express from "express";
import { signupUser, loginUser, getUserById } from "../controllers/authController.js";

const router = express.Router();

// Register route
router.post("/register", signupUser);

// Login route
router.post("/login", loginUser);

// Get user by ID
router.get("/user/:id", getUserById);

export default router;
