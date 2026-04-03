/**
 * ### `src/routes/authRoutes.js`
 * - Auth route definitions.
 * - `POST /register` → `register`
 * - `POST /login` → `login`
 */

// Import necessary modules and controller functions
import { Router } from "express";
import { forgotPassword, login, logout, register, checkAvailability } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/check-availability", checkAvailability);

export default router;
