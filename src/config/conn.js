/**
 * ### `src/config/conn.js`
 * - Encapsulates database connection logic.
 * - Exports `connectDatabase(mongoUri)` using `mongoose.connect`.
 */
import mongoose from "mongoose";

export async function connectDatabase(mongoUri) {
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}
