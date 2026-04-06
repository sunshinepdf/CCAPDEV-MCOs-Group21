/**
 * ### `src/routes/authRoutes.js`
 * - Auth route definitions.
 * - `POST /register` → `register`
 * - `POST /login` → `login`
 * - Uses express-validator for input validation
 */

// Import necessary modules and controller functions
import { Router } from "express";
import { forgotPassword, login, register } from "../controllers/authController.js";
import { validateRegister, validateLogin, validateForgotPassword } from "../middleware/validators.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);

export default router;
