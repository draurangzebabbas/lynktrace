# LinkedIn Scraper Backend API

This is the backend API for the LinkedIn scraper application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add backend environment variables to your existing `.env.local` file in the root directory:
```bash
# Add these to your existing .env.local file
PORT=3001
NODE_ENV=production
# Optional: Add SUPABASE_SERVICE_ROLE_KEY for enhanced permissions

# Frontend will need this to communicate with backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001  # For local development
# NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com  # For production
```

3. The backend will automatically use your existing Supabase credentials from `.env.local`.

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

### Backend Environment Variables (in backend folder)
The backend will automatically use your existing Supabase credentials from `.env.local`:

- `SUPABASE_URL`: Your Supabase project URL (from existing .env.local)
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key (from existing .env.local)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (optional, for enhanced permissions)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

### Frontend Environment Variables (in root .env.local)
Your frontend will need this to communicate with the backend:

- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL (NEXT_PUBLIC_ prefix required for client-side access)
  - Local development: `http://localhost:3001`
  - Production: `https://your-backend-url.onrender.com`

## API Endpoints

- `POST /api/scrape-linkedin` - Scrape LinkedIn profiles
- `POST /api/scrape-post-comments` - Scrape post comments
- `POST /api/scrape-mixed` - Mixed scraping (posts + profiles)
- `GET /api/saved-profiles` - Get user's saved profiles
- `POST /api/save-profile` - Save a profile
- `DELETE /api/save-profile/:id` - Remove saved profile
- `PUT /api/save-profile/:id` - Update saved profile
- `POST /api/update-profile` - Update single profile
- `POST /api/update-profiles` - Update multiple profiles
- `GET /health` - Health check
- `GET /api/test` - Test endpoint

## Deployment

This backend is designed to be deployed on Render.com. Make sure to set all environment variables in your Render dashboard.
