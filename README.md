
# CCAPDEV Machine Project – Phase 3
**Course:** CCAPDEV Term 2, AY 2025–2026  
**Phase:** Web App Deployment
**Weight:** 30% of final grade  

---

## Project Overview

This project is the Phase 3 deployment submission for Animo Commons, a forum-style campus community web application built with Node.js, Express, MongoDB, and Handlebars using the MVC architecture. The web app is fully functional with the minimum required features implemented, including user authentication with persistent sessions, password hashing, complete CRUD operations reflected in the database, front-end and back-end form validation, and sample records loaded for the supported features. The deployment is hosted on Railway and uses MongoDB Atlas as the cloud database, and the application is expected to stay aligned with the Phase 2 feedback while providing at least five sample data entries for each applicable feature. The About page must also list the NPM packages and third-party libraries used in the project.

--- 

## Project Structure

- `src/model/` - Mongoose models and database entities
- `src/controllers/` - Route handlers and business logic
- `src/routes/` - API and view routes
- `src/views/` - Handlebars views
- `src/views/layouts/` - Handlebars layouts
- `src/views/partials/` - Reusable template partials
- `public/` - Static CSS, JavaScript, and assets
- `scripts/` - Utility scripts (seed, free-port)

## Requirements

- Node.js 18+
- npm 9+
- MongoDB Atlas cluster (cloud) or local MongoDB

## Quick Start

If setup is already done, run the app with:

```bash
npm run dev
```

## First-Time Setup (Local Startup)

From the repository root:

1. Install dependencies:
   - `npm install`
2. Seed sample data:
   - `npm run seed`
3. Start development server:
   - `npm run dev`

Server runs at:
- `http://localhost:3000`

## Environment Variables

Create a `.env` file in the project root and define the following:

```env
PORT=3000
MONGODB_URI=<your-mongodb-atlas-connection-string>
SESSION_SECRET=<strong-random-session-secret>
JWT_SECRET=<strong-random-jwt-secret>
JWT_EXPIRES_IN=7d
```

Notes:
- `MONGODB_URI` defaults to `mongodb://127.0.0.1:27017/animo_commons` if not set.
- For production, always use a secure Atlas URI and strong secrets.

## Main Routes

- Entry route: `/` (redirects to `/index`)
- App home: `/home`
- Index page: `/index`
- Popular: `/popular`
- Discover: `/discover`
- Profile: `/profile`
- Edit Profile: `/edit-profile`
- Login: `/login`
- Sign Up: `/sign-up`
- API health: `/api/health`

## API Summary

- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Posts + Comments + Votes: `/api/posts/*`

## Deployment

This project is deployed on Railway and uses MongoDB Atlas as the cloud database.

### Production URL

The live deployment is available at:

- https://animocommons.up.railway.app

### Railway

1. Connect this GitHub repository to a Railway project.
2. Railway uses the `Procfile` (`web: npm start`) to run the app.
3. Set the environment variables in Railway:
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `SESSION_SECRET`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (optional, defaults to `7d`)
   - `PORT` is automatically provided by Railway.

### MongoDB Atlas

1. Create a cluster in MongoDB Atlas.
2. Create a database user with read/write access.
3. Add Railway egress IPs to Atlas network access (or allow `0.0.0.0/0` temporarily for testing).
4. Copy the Atlas connection string and set it as `MONGODB_URI` in Railway.

Example URI format:

```text
mongodb+srv://<username>:<password>@<cluster-url>/animo_commons?retryWrites=true&w=majority
```

## Routing Notes

- Legacy `.html` paths are still supported and redirected to clean routes:
   - `/home.html` → `/home`
   - `/popular.html` → `/popular`
   - `/discover.html` → `/discover`
   - `/profile.html` → `/profile`
   - `/edit-profile.html` → `/edit-profile`
   - `/login.html` → `/login`
   - `/sign-up.html` → `/sign-up`

## View Layer Notes

- Handlebars layout flags control page-specific CSS/JS includes in `src/views/layouts/main hbs`.
- Home page runtime logic is loaded from `public/home.js`.
- Index page styling is loaded from `public/index.css`.
