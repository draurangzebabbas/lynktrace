
CREATE TABLE IF NOT EXISTS user_saved_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES linkedin_profiles(id) ON DELETE CASCADE,
  company_profile_id UUID REFERENCES linkedin_company_profiles(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('personal', 'company')),
  personal_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_profile_reference CHECK (
    (profile_type = 'personal' AND profile_id IS NOT NULL AND company_profile_id IS NULL) OR
    (profile_type = 'company' AND company_profile_id IS NOT NULL AND profile_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_user_saved_profiles_user_id ON user_saved_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_profiles_profile_id ON user_saved_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_profiles_company_profile_id ON user_saved_profiles(company_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_profiles_tags ON user_saved_profiles USING GIN (tags);

CREATE TRIGGER update_user_saved_profiles_updated_at 
    BEFORE UPDATE ON user_saved_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

alter publication supabase_realtime add table user_saved_profiles;
