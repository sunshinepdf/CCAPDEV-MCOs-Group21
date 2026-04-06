/**
 * ### `src/routes/postRoutes.js`
 * - Post/comment route definitions.
 * - Public read routes + protected write/mutate routes.
 * - Applies `requireAuth` to create/edit/delete/vote operations.
 * - Uses express-validator for input validation
 */

// Import necessary modules and controller functions
import { Router } from "express";
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  getPostById,
  listPosts,
  updateComment,
  updatePost,
  voteComment,
  votePost
} from "../controllers/postController.js";
import { requireAuth } from "../middleware/auth.js";
import {
  validateCreatePost,
  validateUpdatePost,
  validatePostId,
  validateAddComment,
  validateUpdateComment,
  validateDeleteComment,
  validateVote
} from "../middleware/validators.js";

const router = Router();

// Public routes
router.get("/", listPosts);
router.get("/:postId", validatePostId, getPostById);

// Protected routes
router.post("/", requireAuth, validateCreatePost, createPost);
router.patch("/:postId", requireAuth, validateUpdatePost, updatePost);
router.delete("/:postId", requireAuth, validatePostId, deletePost);

// Voting routes
router.post("/:postId/vote", requireAuth, validatePostId, validateVote, votePost);

// Comment routes
router.post("/:postId/comments", requireAuth, validateAddComment, addComment);
router.patch("/:postId/comments/:commentId", requireAuth, validateUpdateComment, updateComment);
router.delete("/:postId/comments/:commentId", requireAuth, validateDeleteComment, deleteComment);
router.post("/:postId/comments/:commentId/vote", requireAuth, validatePostId, validateVote, voteComment);

export default router;
