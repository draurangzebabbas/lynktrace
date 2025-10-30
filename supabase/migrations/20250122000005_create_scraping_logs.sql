
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  target_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  items_scraped INTEGER DEFAULT 0,
  credits_used NUMERIC DEFAULT 0,
  batch_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_scraping_logs_user_id ON scraping_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_status ON scraping_logs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_batch_id ON scraping_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_created_at ON scraping_logs(created_at DESC);

alter publication supabase_realtime add table scraping_logs;
