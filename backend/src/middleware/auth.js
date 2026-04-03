/**
 * ### `src/middleware/auth.js`
 * - Session auth gate for protected routes.
 * - Extracts `userId` from session, loads user, and assigns `req.user`.
 * - Returns 401 errors for missing/invalid sessions.
*/

// Import necessary modules and models
import User from "../model/User.js";
import HttpError from "../utils/httpError.js";

// Middleware function to require authentication on protected routes
export async function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy();
      return next(new HttpError(401, "User not found"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new HttpError(401, "Invalid session"));
  }
}
