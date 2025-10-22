# Clerk Authentication Setup

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Clerk Authentication Keys
# Get these from your Clerk Dashboard: https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY

# Supabase Configuration
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Clerk Webhook Secret (for Supabase integration)
# Get this from your Clerk webhook configuration
CLERK_WEBHOOK_SECRET=YOUR_CLERK_WEBHOOK_SECRET
```

## Setup Steps

1. **Get Clerk Keys:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Navigate to API Keys section
   - Copy your Publishable Key and Secret Key

2. **Get Supabase Keys:**
   - Go to your Supabase project settings
   - Navigate to API section
   - Copy your Project URL, anon key, and service role key

3. **Set up Clerk Webhook (for Supabase integration):**
   - In Clerk Dashboard, go to Webhooks
   - Create a new webhook endpoint pointing to your Supabase project
   - Copy the webhook secret

4. **Create .env.local file:**
   - Copy the template above
   - Replace all `YOUR_*` placeholders with your actual keys
   - Make sure `.env.local` is in your `.gitignore` file

## Supabase Database Setup

1. **Run the SQL schema:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run the contents of `supabase-schema.sql` to create the users table

2. **Set up Clerk Webhook:**
   - In Clerk Dashboard, go to Webhooks
   - Create a new webhook endpoint with URL: `https://your-domain.com/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy the webhook secret to your `.env.local` file

## Next Steps

After setting up the environment variables and database:

1. Run `npm run dev` to start your development server
2. Navigate to your app - you should see Clerk authentication components
3. Test sign-in and sign-up functionality
4. Check your Supabase database to verify user data is being synced

## Features Included

- ✅ Clerk authentication with modal sign-in/sign-up
- ✅ UserButton component for authenticated users
- ✅ Automatic user data synchronization with Supabase
- ✅ Webhook integration for real-time user updates
- ✅ Server-side user data fetching utilities
- ✅ Row Level Security (RLS) policies for data protection
