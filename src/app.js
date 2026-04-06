/**
 * ### `src/app.js`
 * - Express app composition file.
 * - Configures:
 *   - CORS
 *   - JSON parser (`2mb` limit)
 *   - Handlebars engine (`.hbs`, layout/partials dirs)
 *   - Static asset serving from `../public`
 * - Mounts routes:
 *   - View routes at `/`
 *   - API routes at `/api`
 * - Applies terminal handlers: `notFoundHandler`, then `errorHandler`.
*/

// Import necessary modules and middleware
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import * as exphbs from "express-handlebars";
import env from "./config/env.js";
import routes from "./routes/index.js";
import viewRoutes from "./routes/viewRoutes.js";
import { requireCsrf } from "./middleware/csrf.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Initialize Express app and set up paths for views and static files
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsPath = path.join(__dirname, "views");
const layoutsPath = path.join(viewsPath, "layouts");
const partialsPath = path.join(viewsPath, "partials");
const publicPath = path.join(__dirname, "..", "public");

// Trust proxy for reverse proxies (Railway, Heroku, etc.) - must be set before session middleware
app.set("trust proxy", 1);

// Configure middleware for CORS, JSON parsing, and Handlebars templating
app.use(cors({
  origin: true,
  credentials: true
})); // Enable CORS for all routes with credentials
app.use(express.json({ limit: "2mb" })); // Limit JSON payload size to prevent abuse

// Configure Session Middleware
const isProduction = process.env.NODE_ENV === "production";
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: env.mongoUri,
      collectionName: "sessions"
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax"
    }
  })
);

app.engine(
	// Set up Handlebars as the view engine with custom configuration
	"hbs",
	exphbs.engine({
		extname: ".hbs",
		defaultLayout: "main",
		layoutsDir: layoutsPath,
		partialsDir: partialsPath
	})
);

// Set the view engine and views directory
app.set("view engine", "hbs");
app.set("views", viewsPath);

// Define routes for views and API endpoints, and set up error handling middleware
app.use("/", viewRoutes);
app.use(express.static(publicPath));

// API routes are prefixed with /api to separate them from view routes
app.use("/api", requireCsrf, routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
