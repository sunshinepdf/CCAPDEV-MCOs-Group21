/**
 * ### `src/routes/authRoutes.js`
 * - Auth route definitions.
 * - `POST /register` → `register`
 * - `POST /login` → `login`
 * - Uses express-validator for input validation
 */

// Import necessary modules and controller functions
import { Router } from "express";
import { checkAvailability, forgotPassword, login, logout, register } from "../controllers/authController.js";
import { validateRegister, validateLogin, validateForgotPassword } from "../middleware/validators.js";
import { issueCsrfToken } from "../middleware/csrf.js";

const router = Router();

router.get("/csrf-token", issueCsrfToken);
router.post("/check-availability", checkAvailability);
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.post("/forgot-password", validateForgotPassword, forgotPassword);

export default router;
