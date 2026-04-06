/**
 * ### `src/middleware/validators.js`
 * - Express-validator validation chains for API routes.
 * - Centralizes all input validation to keep controllers clean.
 * - Each export is a validation chain array that can be spread in route definitions.
 */

import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware to handle validation errors from express-validator.
 * Extracts error messages and returns 400 status with error details.
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: errors.array()[0].msg 
    });
  }
  next();
}

/**
 * Validation chain for user registration
 */
export const validateRegister = [
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 20 }).withMessage("Username must be 3-20 characters long")
    .matches(/^[a-zA-Z0-9_.-]*$/).withMessage("Username can only contain letters, numbers, dots, underscores, and hyphens"),
  
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .matches(/^[^\s@]+@dlsu\.edu\.ph$/).withMessage("Please provide a valid DLSU email address (name@dlsu.edu.ph)"),
  
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  
  body("year")
    .optional()
    .trim(),
  
  body("major")
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9\s.,&-]*$/).withMessage("Major contains invalid characters"),
  
  body("pronouns")
    .optional()
    .trim()
    .matches(/^[a-zA-Z\s/-]*$/).withMessage("Pronouns can only contain letters, spaces, slashes, and hyphens"),
  
  body("photo")
    .optional()
    .isString().withMessage("Photo must be a string"),
  
  handleValidationErrors
];

/**
 * Validation chain for user login
 */
export const validateLogin = [
  body("usernameOrEmail")
    .trim()
    .notEmpty().withMessage("Username or email is required"),
  
  body("password")
    .notEmpty().withMessage("Password is required"),
  
  handleValidationErrors
];

/**
 * Validation chain for password forget/reset flow
 */
export const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address"),
  
  handleValidationErrors
];

/**
 * Validation chain for creating a post
 */
export const validateCreatePost = [
  body("title")
    .trim()
    .notEmpty().withMessage("Post title is required")
    .isLength({ min: 1 }).withMessage("Post title cannot be empty"),
  
  body("content")
    .trim()
    .notEmpty().withMessage("Post content is required")
    .isLength({ min: 1 }).withMessage("Post content cannot be empty"),
  
  body("category")
    .optional()
    .trim()
    .isIn(["discussion", "help", "news"]).withMessage("Category must be 'discussion', 'help', or 'news'"),
  
  body("college")
    .optional()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validation chain for updating a post
 */
export const validateUpdatePost = [
  param("postId")
    .trim()
    .isMongoId().withMessage("Invalid post ID"),
  
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage("Post title cannot be empty"),
  
  body("content")
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage("Post content cannot be empty"),
  
  body("category")
    .optional()
    .trim()
    .isIn(["discussion", "help", "news"]).withMessage("Category must be 'discussion', 'help', or 'news'"),
  
  body("college")
    .optional()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validation chain for adding a comment to a post
 */
export const validateAddComment = [
  param("postId")
    .trim()
    .isMongoId().withMessage("Invalid post ID"),
  
  body("text")
    .trim()
    .notEmpty().withMessage("Comment text is required")
    .isLength({ min: 1 }).withMessage("Comment text cannot be empty"),
  
  body("parentId")
    .optional()
    .isMongoId().withMessage("Invalid parent comment ID"),
  
  handleValidationErrors
];

/**
 * Validation chain for updating a comment
 */
export const validateUpdateComment = [
  param("postId")
    .trim()
    .isMongoId().withMessage("Invalid post ID"),
  
  param("commentId")
    .trim()
    .isMongoId().withMessage("Invalid comment ID"),
  
  body("text")
    .trim()
    .notEmpty().withMessage("Comment text is required")
    .isLength({ min: 1 }).withMessage("Comment text cannot be empty"),
  
  handleValidationErrors
];

/**
 * Validation chain for deleting a comment
 */
export const validateDeleteComment = [
  param("postId")
    .trim()
    .isMongoId().withMessage("Invalid post ID"),
  
  param("commentId")
    .trim()
    .isMongoId().withMessage("Invalid comment ID"),
  
  handleValidationErrors
];

/**
 * Validation chain for voting on a post or comment
 */
export const validateVote = [
  body("direction")
    .trim()
    .notEmpty().withMessage("Vote direction is required")
    .isIn(["up", "down"]).withMessage("Direction must be 'up' or 'down'"),
  
  handleValidationErrors
];

/**
 * Validation chain for post ID parameter
 */
export const validatePostId = [
  param("postId")
    .trim()
    .isMongoId().withMessage("Invalid post ID"),
  
  handleValidationErrors
];

/**
 * Validation chain for user ID parameter
 */
export const validateUserId = [
  param("userId")
    .trim()
    .isMongoId().withMessage("Invalid user ID"),
  
  handleValidationErrors
];

/**
 * Validation chain for updating user profile
 */
export const validateUpdateUser = [
  body("photo")
    .optional()
    .isString().withMessage("Photo must be a string"),
  
  body("year")
    .optional()
    .trim(),
  
  body("pronouns")
    .optional()
    .trim()
    .matches(/^[a-zA-Z\s/-]*$/).withMessage("Pronouns can only contain letters, spaces, slashes, and hyphens"),
  
  body("major")
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9\s.,&-]*$/).withMessage("Major contains invalid characters"),
  
  body("bio")
    .optional()
    .trim(),
  
  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),
  
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage("Username must be 3-20 characters long")
    .matches(/^[a-zA-Z0-9_.-]*$/).withMessage("Username can only contain letters, numbers, dots, underscores, and hyphens"),
  
  body("currentPassword")
    .optional()
    .notEmpty().withMessage("Current password is required when changing password"),
  
  body("newPassword")
    .optional()
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
  
  body("confirmNewPassword")
    .optional()
    .custom((value, { req }) => {
      if (req.body.newPassword && value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }).withMessage("Password confirmation does not match"),
  
  handleValidationErrors
];
