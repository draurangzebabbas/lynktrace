# LynkTrace Setup Guide

A complete guide to set up LynkTrace with Clerk authentication and Supabase database integration.

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Get Your Keys

#### Clerk Keys
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **API Keys** section
3. Copy your **Publishable Key** and **Secret Key**

#### Supabase Keys
1. Go to your [Supabase Project](https://supabase.com/dashboard)
2. Navigate to **Settings** → **API**
3. Copy your **Project URL**, **anon key**, and **service role key**

#### Clerk Webhook Secret
1. In Clerk Dashboard, go to **Webhooks**
2. Create a new webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **webhook secret**

### 3. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create users table to sync with Clerk
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-update trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Security policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (current_setting('role') = 'service_role');
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## 🔧 Features Included

- ✅ **Clerk Authentication**: Complete sign-in/sign-up with Clerk
- ✅ **User Management**: UserButton component for authenticated users
- ✅ **Database Sync**: Automatic user data synchronization with Supabase
- ✅ **Webhook Integration**: Real-time user updates via webhooks
- ✅ **Security**: Row Level Security (RLS) policies for data protection
- ✅ **Modern UI**: Beautiful components with Tailwind CSS and shadcn/ui

## 📁 Project Structure

```
lynktrace/
├── app/
│   ├── api/webhooks/clerk/    # Webhook handler for Clerk events
│   ├── dashboard/             # Protected dashboard pages
│   └── layout.tsx            # Root layout with ClerkProvider
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── header.tsx            # Navigation header
│   └── hero-section.tsx      # Landing page hero
├── lib/
│   ├── auth.ts               # Authentication utilities
│   ├── supabase.ts          # Supabase client configuration
│   └── supabase-server.ts   # Server-side Supabase client
├── supabase/
│   └── migrations/           # Database migration files
└── middleware.ts            # Clerk middleware for route protection
```

## 🛠️ How It Works

1. **User Signs Up**: User creates account through Clerk
2. **Webhook Triggered**: Clerk sends webhook to your app
3. **Database Sync**: User data is automatically stored in Supabase
4. **Real-time Updates**: Any user changes are synced via webhooks
5. **Secure Access**: RLS policies ensure users only see their own data

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
- Ensure your webhook URL is publicly accessible
- Use HTTPS (required for Clerk webhooks)
- Set all environment variables in your deployment platform

## 🔍 Troubleshooting

### Webhook Not Working?
- ✅ Check webhook URL is accessible: `https://your-domain.com/api/webhooks/clerk`
- ✅ Verify webhook secret matches your `.env.local`
- ✅ Ensure HTTPS is enabled (required by Clerk)
- ✅ Check deployment logs for webhook activity

### Database Issues?
- ✅ Verify Supabase service role key is correct
- ✅ Check RLS policies are properly configured
- ✅ Ensure database migrations have run

### Authentication Issues?
- ✅ Verify Clerk keys are correct
- ✅ Check middleware configuration
- ✅ Ensure protected routes are properly configured

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🎯 Next Steps

After setup is complete:
1. Customize your dashboard components
2. Add more user data fields as needed
3. Implement additional features
4. Deploy to production

---

**Need Help?** Check the troubleshooting section above or review the error logs in your deployment platform.