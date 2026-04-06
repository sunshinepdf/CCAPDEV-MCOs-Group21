/**
 * ### `src/server.js`
 * - Backend entry point.
 * - Connects to MongoDB using `connectDatabase`, then starts the Express app on configured port.
 * - Fails fast (`process.exit(1)`) if startup/connection fails.
 */

// Import necessary modules and configurations
import env from "./config/env.js";
import app from "./app.js";
import { connectDatabase } from "./config/conn.js";

// Function to start the server after connecting to the database
async function startServer() {
  try {
    await connectDatabase(env.mongoUri);
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
