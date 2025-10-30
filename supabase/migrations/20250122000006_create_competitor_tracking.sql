
CREATE TABLE IF NOT EXISTS competitor_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'keyword')),
  target_value TEXT NOT NULL,
  schedule TEXT NOT NULL CHECK (schedule IN ('daily', 'weekly', 'monthly')),
  engagement_targets JSONB NOT NULL DEFAULT '["commenters", "reactors"]'::jsonb,
  time_filter TEXT NOT NULL DEFAULT 'week' CHECK (time_filter IN ('24h', 'week', 'month', '3months')),
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  total_profiles_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_tracking_user_id ON competitor_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_tracking_is_active ON competitor_tracking(is_active);
CREATE INDEX IF NOT EXISTS idx_competitor_tracking_next_run ON competitor_tracking(next_run_at);

CREATE TRIGGER update_competitor_tracking_updated_at 
    BEFORE UPDATE ON competitor_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

alter publication supabase_realtime add table competitor_tracking;
