/**
 * ### `src/config/env.js`
 * - Loads environment variables via `dotenv`.
 * - Normalizes runtime config into one object (`env`) with defaults.
 * - Central source for app port, Mongo URI, JWT secret, and JWT expiry.
*/

// Import the `dotenv` package to load environment variables from a `.env` file
import dotenv from "dotenv";

dotenv.config();

// Define the `env` object with configuration values, using environment variables or defaults
const env = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/animo_commons",
  sessionSecret: process.env.SESSION_SECRET || "development-session-secret",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d"
};

export default env;
