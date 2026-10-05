# NepalCan Blog

A full-stack blogging platform for discovering, writing, and managing blog posts.

## Live Demo

https://blog-ncc19.vercel.app/

## About / Purpose

NepalCan Blog gives readers a place to browse writing and gives registered users tools to publish and manage their own posts. It supports authenticated community interactions such as likes, comments, and replies. Administrators can moderate blogs and manage users and categories from a separate dashboard.

## Key Features

- Browse paginated blogs with search and category filters.
- Read published posts and view author profiles.
- Register, verify email, log in, refresh sessions, and reset forgotten passwords.
- Create, edit, draft, publish, unpublish, and delete blog posts with optional images.
- Like posts and add or remove comments and replies.
- Edit a user profile, including avatar, bio, and social links.
- Admin dashboard for users, blogs, categories, and submitted-blog moderation.

## Tech Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript
- **Styling and UI:** Tailwind CSS 4, Material UI, Emotion, React Icons
- **Editing and feedback:** Tiptap, Sonner
- **API:** Express 5, TypeScript, Mongoose
- **Data and auth:** MongoDB, JWT access/refresh tokens, cookie-parser, bcrypt
- **HTTP and validation:** Axios, Joi, Yup
- **Media and email:** Multer, local or Cloudinary storage, Brevo integrations
- **Deployment:** Vercel and render

## Architecture

The repository is an npm workspace containing separate frontend and API applications. The Next.js App Router renders public, authenticated, and admin pages. Client-side API modules use Axios to call the Express routes. The API validates requests, applies JWT authentication and role checks, and persists users, blogs, categories, profiles, comments, and replies through Mongoose.

Authentication state is held in a React context. Blog, category, profile, comment, and admin data is fetched through dedicated API client modules and stored in page/component state. Images use local uploads in development by default and Cloudinary when the configured production storage driver is used.

```text
.
+-- apps/
|   +-- frontend/
|   |   +-- app/             # App Router pages, layouts, auth, main, and admin routes
|   |   +-- components/      # Shared page, form, navigation, and dashboard components
|   |   +-- context/         # React authentication context
|   |   +-- lib/             # Axios client and domain API modules
|   +-- api/
|       +-- module/          # Express routes, controllers, models, and validation
|       +-- config/          # MongoDB and environment configuration
|       +-- services/        # Email and error-handling services
|       +-- storage/         # Local and Cloudinary upload drivers
+-- shared/                  # Workspace package reserved for shared code
+-- vercel.json              # Frontend/API services and request rewrites
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB
- Email provider credentials for the API
- Cloudinary credentials if using Cloudinary storage

### Install

```bash
npm install
```

Create environment files for the frontend and API. Use these variable names only; do not commit their values:

**`apps/frontend/.env`**

```text
NEXT_PUBLIC_API_URL
```

**`apps/api/.env`**

```text
PORT
NODE_ENV
MONGO_URI
JWT_SECRET
RESEND_API_KEY
FRONTEND_URL
REFRESH_SECRET
STORAGE_DRIVER
BACKEND_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
BREVO_API_KEY
```

### Run

Start both applications in development:

```bash
npm run dev
```

Build both workspaces:

```bash
npm run build
```

Start the built applications separately:

```bash
npm run start -w frontend
npm run start -w api
```

The frontend development server runs on port 3000 and the API listens on port 5000.

## Deployment

The project is configured for Vercel with for `frontend` (Next.js) and `api` (Express) services on render.
