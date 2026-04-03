/** 
 * ### `src/controllers/postController.js`
 * - Core posts/comments/votes business logic.
 * - Post endpoints:
 *   - list with filtering/search/sort/pagination
 *   - get by ID (optional view increment)
 *   - create/update/delete (owner-protected)
 *   - vote toggle behavior with score recomputation
 * - Comment endpoints:
 *   - add/update/delete (owner checks)
 *   - vote toggle behavior
 * - Uses `applyPostSort` to centralize sorting modes (`recent`, `top`, `trending`, `hot`).
*/

// Import necessary modules and models
import mongoose from "mongoose";
import Post from "../model/Post.js";
import HttpError from "../utils/httpError.js";
import { applyPostSort } from "../utils/sortPosts.js";

// Helper function to validate and normalize post category
function assertValidCategory(category) {
  const normalized = String(category || "discussion").toLowerCase();
  if (!["discussion", "help", "news"].includes(normalized)) {
    throw new HttpError(400, "Invalid category");
  }
  return normalized;
}

// Helper function to calculate the score of a post based on upvotes and downvotes
function getScore(post) {
  return (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);
}

// Helper function to map a post document to a JSON object with score included
function mapPost(post) {
  const json = post.toJSON();
  return {
    ...json,
    score: getScore(post)
  };
}

// Controller function to list posts with optional filtering, searching, sorting, and pagination
export async function listPosts(req, res, next) {
  try {
    const {
      sortBy = "recent",
      category,
      college,
      authorId,
      q,
      page = "1",
      limit = "20"
    } = req.query;

    const query = {};
    if (category) {
      query.category = assertValidCategory(category);
    }
    if (college) {
      query.college = String(college);
    }
    if (authorId) {
      if (!mongoose.Types.ObjectId.isValid(authorId)) {
        throw new HttpError(400, "Invalid authorId");
      }
      query.authorId = authorId;
    }
    if (q) {
      query.$or = [
        { title: { $regex: String(q), $options: "i" } },
        { content: { $regex: String(q), $options: "i" } }
      ];
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));

    const posts = await Post.find(query).populate("authorId", "username photo");
    const withScore = posts.map((post) => ({
      ...mapPost(post),
      createdAt: post.createdAt,
      lastUpvotedAt: post.lastUpvotedAt,
      lastInteraction: post.lastInteraction,
      views: post.views
    }));

    const sorted = applyPostSort(withScore, String(sortBy));
    const start = (safePage - 1) * safeLimit;
    const paged = sorted.slice(start, start + safeLimit);

    res.json({
      success: true,
      page: safePage,
      limit: safeLimit,
      total: sorted.length,
      posts: paged
    });
  } catch (error) {
    next(error);
  }
}

// Controller function to get a single post by ID, with optional view increment
export async function getPostById(req, res, next) {
  try {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new HttpError(400, "Invalid postId");
    }

    const post = await Post.findById(postId).populate("authorId", "username photo");
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    const incrementView = String(req.query.incrementView || "true").toLowerCase() === "true";
    if (incrementView) {
      post.views = (Number(post.views) || 0) + 1;
      post.lastInteraction = new Date();
      await post.save();
    }

    res.json({ success: true, post: mapPost(post) });
  } catch (error) {
    next(error);
  }
}

// Controller function to create a new post, with validation and ownership assignment
export async function createPost(req, res, next) {
  try {
    const { title, content, category, college } = req.body;
    if (!title || !content) {
      throw new HttpError(400, "title and content are required");
    }

    const post = await Post.create({
      authorId: req.user._id,
      category: assertValidCategory(category),
      college: college || "",
      title: String(title).trim(),
      content: String(content).trim(),
      lastInteraction: new Date()
    });

    res.status(201).json({ success: true, post: mapPost(post) });
  } catch (error) {
    next(error);
  }
}

// Controller function to update an existing post, with ownership check and field validation
export async function updatePost(req, res, next) {
  try {
    const { postId } = req.params;
    const { title, content, category, college } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    if (String(post.authorId) !== String(req.user._id)) {
      throw new HttpError(403, "You can only edit your own posts");
    }

    const nextTitle = title != null ? String(title).trim() : post.title;
    const nextContent = content != null ? String(content).trim() : post.content;
    const nextCategory = category != null ? assertValidCategory(category) : post.category;
    const nextCollege = college != null ? String(college) : post.college;

    const titleChanged = title != null && nextTitle !== post.title;
    const contentChanged = content != null && nextContent !== post.content;
    const categoryChanged = category != null && nextCategory !== post.category;
    const collegeChanged = college != null && nextCollege !== post.college;

    if (!titleChanged && !contentChanged && !categoryChanged && !collegeChanged) {
      return res.json({ success: true, post: mapPost(post) });
    }

    if (titleChanged) post.title = nextTitle;
    if (contentChanged) post.content = nextContent;
    if (categoryChanged) post.category = nextCategory;
    if (collegeChanged) post.college = nextCollege;
    if (titleChanged || contentChanged) {
      post.editedAt = new Date();
    }
    post.lastInteraction = new Date();

    await post.save();
    res.json({ success: true, post: mapPost(post) });
  } catch (error) {
    next(error);
  }
}

// Controller function to delete a post, with ownership check
export async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    if (String(post.authorId) !== String(req.user._id)) {
      throw new HttpError(403, "You can only delete your own posts");
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    next(error);
  }
}

// Controller function to toggle an upvote/downvote on a post, with score recalculation and idempotent behavior
export async function votePost(req, res, next) {
  try {
    const { direction } = req.body;
    if (!["up", "down"].includes(String(direction))) {
      throw new HttpError(400, "direction must be 'up' or 'down'");
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    const key = String(req.user._id);
    const currentVote = post.votes.get(key) || null;

    let newVote = null;
    if (direction === "up") {
      if (currentVote === "up") {
        post.upvotes = Math.max(0, post.upvotes - 1);
      } else if (currentVote === "down") {
        post.downvotes = Math.max(0, post.downvotes - 1);
        post.upvotes += 1;
        newVote = "up";
      } else {
        post.upvotes += 1;
        newVote = "up";
      }
    }

    if (direction === "down") {
      if (currentVote === "down") {
        post.downvotes = Math.max(0, post.downvotes - 1);
      } else if (currentVote === "up") {
        post.upvotes = Math.max(0, post.upvotes - 1);
        post.downvotes += 1;
        newVote = "down";
      } else {
        post.downvotes += 1;
        newVote = "down";
      }
    }

    if (newVote) post.votes.set(key, newVote);
    else post.votes.delete(key);

    if (newVote === "up") {
      post.lastUpvotedAt = new Date();
    }

    post.lastInteraction = new Date();
    await post.save();

    res.json({
      success: true,
      vote: newVote,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      score: getScore(post)
    });
  } catch (error) {
    next(error);
  }
}

// Helper function to find a comment by ID within a post's comments array
function findComment(post, commentId) {
  return post.comments.id(commentId);
}

// Helper function to calculate the score of a comment based on its votes map
function commentScore(comment) {
  const values = Array.from(comment.votes.values());
  return values.reduce((acc, vote) => {
    if (vote === "up") return acc + 1;
    if (vote === "down") return acc - 1;
    return acc;
  }, 0);
}

// Controller function to add a comment to a post, with validation and optional parentId for replies
export async function addComment(req, res, next) {
  try {
    const { text, parentId = null } = req.body;
    if (!text || !String(text).trim()) {
      throw new HttpError(400, "Comment text is required");
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    if (parentId && !post.comments.id(parentId)) {
      throw new HttpError(400, "Invalid parentId for reply");
    }

    post.comments.push({
      userId: req.user._id,
      text: String(text).trim(),
      parentId: parentId || null
    });
    post.lastInteraction = new Date();
    await post.save();

    const createdComment = post.comments[post.comments.length - 1];
    res.status(201).json({
      success: true,
      comment: {
        ...createdComment.toObject(),
        id: createdComment._id.toString(),
        score: 0
      }
    });
  } catch (error) {
    next(error);
  }
}

// Controller function to update a comment, with ownership check and text validation
export async function updateComment(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      throw new HttpError(400, "Comment text is required");
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    const comment = findComment(post, req.params.commentId);
    if (!comment) {
      throw new HttpError(404, "Comment not found");
    }

    if (String(comment.userId) !== String(req.user._id)) {
      throw new HttpError(403, "You can only edit your own comments");
    }

    const nextText = String(text).trim();
    if (nextText === comment.text) {
      return res.json({ success: true, comment: { ...comment.toObject(), score: commentScore(comment) } });
    }

    comment.text = nextText;
    comment.editedAt = new Date();
    post.lastInteraction = new Date();
    await post.save();

    res.json({ success: true, comment: { ...comment.toObject(), score: commentScore(comment) } });
  } catch (error) {
    next(error);
  }
}

// Controller function to delete a comment, with ownership check
export async function deleteComment(req, res, next) {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    const comment = findComment(post, req.params.commentId);
    if (!comment) {
      throw new HttpError(404, "Comment not found");
    }

    if (String(comment.userId) !== String(req.user._id)) {
      throw new HttpError(403, "You can only delete your own comments");
    }

    comment.deleteOne();
    post.lastInteraction = new Date();
    await post.save();

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
}

// Controller function to toggle a vote on a comment, with score recalculation
export async function voteComment(req, res, next) {
  try {
    const { direction } = req.body;
    if (!["up", "down"].includes(String(direction))) {
      throw new HttpError(400, "direction must be 'up' or 'down'");
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    const comment = findComment(post, req.params.commentId);
    if (!comment) {
      throw new HttpError(404, "Comment not found");
    }

    const key = String(req.user._id);
    const currentVote = comment.votes.get(key) || null;

    let newVote = null;
    if (direction === "up") {
      newVote = currentVote === "up" ? null : "up";
    } else {
      newVote = currentVote === "down" ? null : "down";
    }

    if (newVote) comment.votes.set(key, newVote);
    else comment.votes.delete(key);

    post.lastInteraction = new Date();
    await post.save();

    res.json({ success: true, vote: newVote, score: commentScore(comment) });
  } catch (error) {
    next(error);
  }
}
