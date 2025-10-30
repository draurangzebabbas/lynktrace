CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS linkedin_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  linkedin_url TEXT UNIQUE NOT NULL,
  public_identifier TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  headline TEXT,
  connections INTEGER,
  followers INTEGER,
  email TEXT,
  mobile_number TEXT,
  job_title TEXT,
  company_name TEXT,
  company_industry TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  company_founded_in TEXT,
  company_size TEXT,
  current_job_duration TEXT,
  current_job_duration_in_yrs NUMERIC,
  top_skills_by_endorsements JSONB,
  address_country_only TEXT,
  address_with_country TEXT,
  address_without_country TEXT,
  profile_pic TEXT,
  profile_pic_high_quality TEXT,
  about TEXT,
  open_connection BOOLEAN,
  urn TEXT,
  experiences JSONB,
  updates JSONB,
  skills JSONB,
  profile_pic_all_dimensions JSONB,
  educations JSONB,
  license_and_certificates JSONB,
  honors_and_awards JSONB,
  languages JSONB,
  volunteer_and_awards JSONB,
  verifications JSONB,
  promos JSONB,
  highlights JSONB,
  projects JSONB,
  publications JSONB,
  patents JSONB,
  courses JSONB,
  test_scores JSONB,
  organizations JSONB,
  volunteer_causes JSONB,
  interests JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_url ON linkedin_profiles(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_public_identifier ON linkedin_profiles(public_identifier);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_email ON linkedin_profiles(email);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_company_name ON linkedin_profiles(company_name);

CREATE TRIGGER update_linkedin_profiles_updated_at 
    BEFORE UPDATE ON linkedin_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

alter publication supabase_realtime add table linkedin_profiles;