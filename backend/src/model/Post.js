/**
 * ### `src/model/Post.js`
 * - Mongoose schema/model for posts with embedded comments.
 * - Includes:
 *   - post metadata (author/category/title/content)
 *   - interaction fields (upvotes/downvotes/views/lastInteraction)
 *   - vote maps for posts and comments
 *   - threaded-ready comment structure (`parentId`)
  - Adds text index on `title` + `content`.
  - `toJSON` transform maps `_id` fields to stable `id` values for post/comments.
 */

// Import mongoose for schema definition
import mongoose from "mongoose";

// Define the comment subdocument schema
const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    editedAt: { type: Date, default: null },
    votes: {
      type: Map,
      of: { type: String, enum: ["up", "down"] },
      default: {}
    }
  },
  { timestamps: true }
);

// Define the main post schema
const postSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      enum: ["discussion", "help", "news", "CLA", "SOE", "COS", "GCOE", "CCS", "RVRCOB", "BAGCED", "SIS"],
      default: "discussion",
      index: true
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    editedAt: { type: Date, default: null },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    lastUpvotedAt: { type: Date, default: null },
    lastInteraction: { type: Date, default: Date.now },
    votes: {
      type: Map,
      of: { type: String, enum: ["up", "down"] },
      default: {}
    },
    comments: { type: [commentSchema], default: [] }
  },
  { timestamps: true }
);

// Create a text index on title and content for search functionality
postSchema.index({ title: "text", content: "text" });

// Define a toJSON transform to map _id to id and clean up the output
postSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.comments = (ret.comments || []).map((comment) => {
      const mapped = { ...comment };
      mapped.id = mapped._id.toString();
      delete mapped._id;
      return mapped;
    });
    return ret;
  }
});

const Post = mongoose.model("Post", postSchema);
export default Post;
