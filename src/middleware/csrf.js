import crypto from "crypto";
import HttpError from "../utils/httpError.js";

function safeTokenCompare(expected, received) {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(String(expected), "utf8");
  const receivedBuffer = Buffer.from(String(received), "utf8");
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function issueCsrfToken(req, res, next) {
  try {
    if (!req.session) {
      throw new HttpError(500, "Session middleware is required before CSRF token issuance");
    }

    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    res.json({ success: true, csrfToken: req.session.csrfToken });
  } catch (error) {
    next(error);
  }
}

export function requireCsrf(req, res, next) {
  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  if (!req.session || !req.session.csrfToken) {
    return next(new HttpError(403, "Missing CSRF session token"));
  }

  const csrfFromHeader = req.get("x-csrf-token");
  if (!safeTokenCompare(req.session.csrfToken, csrfFromHeader)) {
    return next(new HttpError(403, "Invalid CSRF token"));
  }

  return next();
}