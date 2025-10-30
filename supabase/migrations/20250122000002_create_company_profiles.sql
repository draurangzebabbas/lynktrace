
CREATE TABLE IF NOT EXISTS linkedin_company_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  company_name TEXT,
  website_url TEXT,
  industry TEXT,
  employee_count INTEGER,
  follower_count INTEGER,
  universal_name TEXT,
  tagline TEXT,
  description TEXT,
  company_id BIGINT,
  hashtag TEXT,
  industry_v2_taxonomy TEXT,
  call_to_action JSONB,
  employee_count_range JSONB,
  headquarter JSONB,
  founded_on JSONB,
  logo_resolution_result TEXT,
  original_cover_image TEXT,
  cropped_cover_image TEXT,
  specialities JSONB,
  crunchbase_funding_data JSONB,
  similar_organizations JSONB,
  affiliated_organizations_by_employees JSONB,
  affiliated_organizations_by_showcases JSONB,
  locations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_profiles_url ON linkedin_company_profiles(url);
CREATE INDEX IF NOT EXISTS idx_company_profiles_name ON linkedin_company_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_company_profiles_universal_name ON linkedin_company_profiles(universal_name);

CREATE TRIGGER update_company_profiles_updated_at 
    BEFORE UPDATE ON linkedin_company_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

alter publication supabase_realtime add table linkedin_company_profiles;
