
# CCAPDEV Machine Project – Phase 2  
**Course:** CCAPDEV Term 1, AY 2023–2024  
**Phase:** Back-End Development  
**Weight:** 20% of final grade  

---

## Project Overview

This repository contains the Phase 2 submission for Animo Commons using Node.js, Express, MongoDB (Mongoose), and Handlebars.
For this phase, the group is required to develop the back-end logic of the chosen web application.
The README.md file at the root directory of the repository should contain instructions on how to set-up and to run the application locally through a Node.js server.

--- 
## Grading Rubric (Total: 75 pts)

| Criteria | Excellent | Very Good | Good | Developing | No Marks | Points |
|---|---|---|---|---|---|---|
| **Database** | **20 pts** – Implemented database model is 100% complete. | **12 pts** – Implemented database model is partially complete (>75%). | **7 pts** – Implemented database model is partially complete (>50%). | **3 pts** – Implemented database model is sparsely complete (>25%). | **0 pts** – Database is not implemented. | **20** |
| **Views** | **15 pts** – All views needed for all features are complete and navigable from the index page. | – | **7 pts** – Not all views are navigable within the site; some require direct URL access. Views are not in proper folder. | – | **0 pts** – Views are still in HTML; project is not implemented with a template engine. | **15** |
| **Controller** | **20 pts** – Properly routes all incoming requests to the correct response/data. | **15 pts** – Properly routes most incoming requests (1–2 missed routes). | **10 pts** – Properly routes most incoming requests (3–4 missed routes). | **5 pts** – Properly routes most incoming requests (>5 missed routes). | **0 pts** – Does not accomplish the app’s intent. | **20** |
| **Content Organization** | **5 pts** – Information presentation, access, and manipulation are clear and appropriate to the feature. | – | **2 pts** – Presentation is acceptable but could be more appropriate. | – | **0 pts** – Content cannot be accessed or manipulated. | **5** |
| **Navigation** | **5 pts** – App is easy to navigate. | – | **2 pts** – Users are sometimes confused by navigation. | – | **0 pts** – Users cannot navigate without developer help. | **5** |
| **Visual Design** | **5 pts** – View aligns with all features; users can complete tasks easily. | – | **2 pts** – View aligns with some features; task steps may be confusing. | – | **0 pts** – Users cannot complete tasks without developer help. | **5** |
| **Graphics** | **5 pts** – Graphics/icons are appropriate, clear, and supported with text if needed. | – | **2 pts** – Graphics fit app purpose but are low quality. | – | **0 pts** – Graphics are absent or distracting. | **5** |

## Project Structure

- `backend/src/model/` – Mongoose models and database entities
- `backend/src/controllers/` – Route handlers/business logic
- `backend/src/routes/` – API and view routes
- `backend/src/views/` – Handlebars views
- `backend/src/views/layouts/` – Handlebars layouts
- `backend/src/views/partials/` – Reusable template partials
- `backend/public/` – Static CSS/JS/assets

## Requirements

- Node.js 18+
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/animo_commons`)

## Quick Start

If setup is already done, run the backend with:

```bash
npm --prefix backend run dev
```

## First-Time Setup

From the repository root:

1. Install backend dependencies:
   - `npm --prefix backend install`
2. Seed sample data:
   - `npm --prefix backend run seed`
3. Start development server:
   - `npm --prefix backend run dev`

Server runs at:
- `http://localhost:3000`

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

- Handlebars layout flags control page-specific CSS/JS includes in `backend/src/views/layouts/main.hbs`.
- Home page runtime logic is loaded from `backend/public/home.js` (extracted from inline script).
- Index page styling is loaded from `backend/public/index.css` (extracted from inline style).
