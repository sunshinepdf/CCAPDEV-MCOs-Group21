/** 
 * ### `src/middleware/errorHandler.js`
 * - Global error handling utilities.
 * - `notFoundHandler`: creates a route-not-found `HttpError(404)`.
 * - `errorHandler`: converts thrown errors to JSON `{ success: false, message }`, logs 5xx errors.
 */
import HttpError from "../utils/httpError.js";

export function notFoundHandler(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message = err.message || "Internal server error";

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}
