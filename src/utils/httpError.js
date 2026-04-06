/**
 * Custom error class for HTTP errors
 * Includes a status code and message
 * Used throughout the app for consistent error handling
 *
 * Example usage:
 * throw new HttpError(400, "Bad request");
 * next(new HttpError(404, "Not found"));
 */
export default class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}
