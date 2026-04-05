/**
 * ### `src/routes/viewRoutes.js`
 * - Server-rendered page routing for Handlebars views.
 * - Root behavior:
 *   - `/` redirects to `/index`
 * - Renders pages with route-specific flags that control CSS/JS includes in layout.
 * - Includes compatibility redirects from legacy `.html` routes to clean URLs.
 */

// Import necessary modules
import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize router and define common view options for app pages
const router = Router();
const appViewOptions = {
  includeAppStyles: true,
  includeAppScripts: true
};

// Helper function to preserve query parameters when redirecting from legacy .html routes to clean URLs
function withQuery(req, targetPath) {
  var queryIndex = req.originalUrl.indexOf("?");
  if (queryIndex === -1) return targetPath;
  return targetPath + req.originalUrl.slice(queryIndex);
}

// Define routes for server-rendered views, applying specific flags for CSS/JS includes as needed
router.get("/", (req, res) => {
  res.redirect("/home");
});

// Home route with specific includes for home page styles and scripts
router.get("/home", (req, res) => {
  res.render("home", {
    ...appViewOptions,
    title: "Home",
    includeHomeCss: true,
    includeHomeScript: true
  });
});

// Legacy route redirect for /home.html to maintain compatibility with old links or bookmarks
router.get("/home.html", (req, res) => {
  res.redirect(withQuery(req, "/home"));
});

router.get("/popular", (req, res) => {
  res.render("popular", {
    ...appViewOptions,
    title: "Popular",
    includeHomeCss: true,
    includePopularCss: true,
    includePopularScript: true
  });
});

// Legacy route redirect for /popular.html to maintain compatibility with old links or bookmarks
router.get("/popular.html", (req, res) => {
  res.redirect(withQuery(req, "/popular"));
});

router.get("/discover", (req, res) => {
  res.render("discover", {
    ...appViewOptions,
    title: "Discover",
    includeHomeCss: true,
    includeDiscoverCss: true,
    includeSearchScript: true,
    includeDiscoverScript: true
  });
});

// Legacy route redirect for /discover.html to maintain compatibility with old links or bookmarks
router.get("/discover.html", (req, res) => {
  res.redirect(withQuery(req, "/discover"));
});

router.get("/about", (req, res) => {
  const aboutFile = path.join(__dirname, "..", "..", "public", "about.html");
  res.sendFile(aboutFile);
});

// Legacy route redirect for /about.html to maintain compatibility with old links or bookmarks
router.get("/about.html", (req, res) => {
  res.redirect(withQuery(req, "/about"));
});


router.get("/profile", (req, res) => {
  res.render("profile", {
    ...appViewOptions,
    title: "Profile",
    includeHomeCss: true,
    includeProfileCss: true,
    includeSearchScript: true,
    includeProfileScript: true,
    includeProfileComponentsScript: true
  });
});

// Legacy route redirect for /profile.html to maintain compatibility with old links or bookmarks
router.get("/profile.html", (req, res) => {
  res.redirect(withQuery(req, "/profile"));
});

router.get("/edit-profile", (req, res) => {
  res.render("edit-profile", {
    ...appViewOptions,
    title: "Edit Profile",
    includeProfileCss: true,
    includeDataScript: false,
    includePostsScript: false,
    includeAlertScript: true,
    includeHeaderScript: true,
    includeGlobalSidebarScript: true,
    includeNavbarScript: true,
    includeEditProfileScript: true
  });
});

// Legacy route redirect for /edit-profile.html to maintain compatibility with old links or bookmarks
router.get("/edit-profile.html", (req, res) => {
  res.redirect(withQuery(req, "/edit-profile"));
});

router.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    includeBaseStyleCss: true,
    includeLoginCss: true,
    includeAlertCss: true,
    includeDataScript: true,
    includeAlertScript: true,
    includeLoginScript: true
  });
});

// Legacy route redirect for /login.html to maintain compatibility with old links or bookmarks
router.get("/login.html", (req, res) => {
  res.redirect(withQuery(req, "/login"));
});

router.get("/sign-up", (req, res) => {
  res.render("sign-up", {
    title: "Sign Up",
    includeBaseStyleCss: true,
    includeSignUpCss: true,
    includeAlertCss: true,
    includeDataScript: true,
    includeAlertScript: true,
    includeSignUpScript: true
  });
});

// Legacy route redirect for /sign-up.html to maintain compatibility with old links or bookmarks
router.get("/sign-up.html", (req, res) => {
  res.redirect(withQuery(req, "/sign-up"));
});

export default router;
