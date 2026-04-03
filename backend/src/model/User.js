/**
 * ### `src/model/User.js`
 * - Mongoose schema/model for users.
 * - Stores account fields + profile metadata (photo/year/pronouns/major/bio/tags).
 * - `toJSON` transform:
 *   - exposes `id`
 *   - removes `_id`, `__v`, and `passwordHash`
 */

// Import mongoose for schema definition
import mongoose from "mongoose";

// Define the user schema with fields for authentication and profile information
const userSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true },
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    photo: { type: String, default: "assets/profile-icon-default.png" },
    year: { type: String, default: "" },
    pronouns: { type: String, default: "" },
    major: { type: String, default: "" },
    bio: { type: String, default: "Hello! I'm a student at De La Salle University sharing my thoughts on Animo Commons." },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Define a toJSON transform to map _id to id and clean up the output by removing sensitive fields
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});

const User = mongoose.model("User", userSchema);
export default User;
