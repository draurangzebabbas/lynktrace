export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          credits_remaining: number | null
          failure_count: number | null
          id: string
          last_failed_at: string | null
          last_used_at: string | null
          provider: string
          status: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          credits_remaining?: number | null
          failure_count?: number | null
          id?: string
          last_failed_at?: string | null
          last_used_at?: string | null
          provider?: string
          status?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          credits_remaining?: number | null
          failure_count?: number | null
          id?: string
          last_failed_at?: string | null
          last_used_at?: string | null
          provider?: string
          status?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_tracking: {
        Row: {
          created_at: string | null
          engagement_targets: Json
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          schedule: string
          target_type: string
          target_value: string
          time_filter: string
          total_profiles_found: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          engagement_targets?: Json
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          schedule: string
          target_type: string
          target_value: string
          time_filter?: string
          total_profiles_found?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          engagement_targets?: Json
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          schedule?: string
          target_type?: string
          target_value?: string
          time_filter?: string
          total_profiles_found?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_company_profiles: {
        Row: {
          affiliated_organizations_by_employees: Json | null
          affiliated_organizations_by_showcases: Json | null
          call_to_action: Json | null
          company_id: number | null
          company_name: string | null
          created_at: string | null
          cropped_cover_image: string | null
          crunchbase_funding_data: Json | null
          description: string | null
          employee_count: number | null
          employee_count_range: Json | null
          follower_count: number | null
          founded_on: Json | null
          hashtag: string | null
          headquarter: Json | null
          id: string
          industry: string | null
          industry_v2_taxonomy: string | null
          locations: Json | null
          logo_resolution_result: string | null
          original_cover_image: string | null
          similar_organizations: Json | null
          specialities: Json | null
          tagline: string | null
          universal_name: string | null
          updated_at: string | null
          url: string
          website_url: string | null
        }
        Insert: {
          affiliated_organizations_by_employees?: Json | null
          affiliated_organizations_by_showcases?: Json | null
          call_to_action?: Json | null
          company_id?: number | null
          company_name?: string | null
          created_at?: string | null
          cropped_cover_image?: string | null
          crunchbase_funding_data?: Json | null
          description?: string | null
          employee_count?: number | null
          employee_count_range?: Json | null
          follower_count?: number | null
          founded_on?: Json | null
          hashtag?: string | null
          headquarter?: Json | null
          id?: string
          industry?: string | null
          industry_v2_taxonomy?: string | null
          locations?: Json | null
          logo_resolution_result?: string | null
          original_cover_image?: string | null
          similar_organizations?: Json | null
          specialities?: Json | null
          tagline?: string | null
          universal_name?: string | null
          updated_at?: string | null
          url: string
          website_url?: string | null
        }
        Update: {
          affiliated_organizations_by_employees?: Json | null
          affiliated_organizations_by_showcases?: Json | null
          call_to_action?: Json | null
          company_id?: number | null
          company_name?: string | null
          created_at?: string | null
          cropped_cover_image?: string | null
          crunchbase_funding_data?: Json | null
          description?: string | null
          employee_count?: number | null
          employee_count_range?: Json | null
          follower_count?: number | null
          founded_on?: Json | null
          hashtag?: string | null
          headquarter?: Json | null
          id?: string
          industry?: string | null
          industry_v2_taxonomy?: string | null
          locations?: Json | null
          logo_resolution_result?: string | null
          original_cover_image?: string | null
          similar_organizations?: Json | null
          specialities?: Json | null
          tagline?: string | null
          universal_name?: string | null
          updated_at?: string | null
          url?: string
          website_url?: string | null
        }
        Relationships: []
      }
      linkedin_profiles: {
        Row: {
          about: string | null
          address_country_only: string | null
          address_with_country: string | null
          address_without_country: string | null
          company_founded_in: string | null
          company_industry: string | null
          company_linkedin: string | null
          company_name: string | null
          company_size: string | null
          company_website: string | null
          connections: number | null
          courses: Json | null
          created_at: string | null
          current_job_duration: string | null
          current_job_duration_in_yrs: number | null
          educations: Json | null
          email: string | null
          experiences: Json | null
          first_name: string | null
          followers: number | null
          full_name: string | null
          headline: string | null
          highlights: Json | null
          honors_and_awards: Json | null
          id: string
          interests: Json | null
          job_title: string | null
          languages: Json | null
          last_name: string | null
          license_and_certificates: Json | null
          linkedin_url: string
          mobile_number: string | null
          open_connection: boolean | null
          organizations: Json | null
          patents: Json | null
          profile_pic: string | null
          profile_pic_all_dimensions: Json | null
          profile_pic_high_quality: string | null
          projects: Json | null
          promos: Json | null
          public_identifier: string | null
          publications: Json | null
          recommendations: Json | null
          skills: Json | null
          test_scores: Json | null
          top_skills_by_endorsements: Json | null
          updated_at: string | null
          updates: Json | null
          urn: string | null
          verifications: Json | null
          volunteer_and_awards: Json | null
          volunteer_causes: Json | null
        }
        Insert: {
          about?: string | null
          address_country_only?: string | null
          address_with_country?: string | null
          address_without_country?: string | null
          company_founded_in?: string | null
          company_industry?: string | null
          company_linkedin?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          connections?: number | null
          courses?: Json | null
          created_at?: string | null
          current_job_duration?: string | null
          current_job_duration_in_yrs?: number | null
          educations?: Json | null
          email?: string | null
          experiences?: Json | null
          first_name?: string | null
          followers?: number | null
          full_name?: string | null
          headline?: string | null
          highlights?: Json | null
          honors_and_awards?: Json | null
          id?: string
          interests?: Json | null
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          license_and_certificates?: Json | null
          linkedin_url: string
          mobile_number?: string | null
          open_connection?: boolean | null
          organizations?: Json | null
          patents?: Json | null
          profile_pic?: string | null
          profile_pic_all_dimensions?: Json | null
          profile_pic_high_quality?: string | null
          projects?: Json | null
          promos?: Json | null
          public_identifier?: string | null
          publications?: Json | null
          recommendations?: Json | null
          skills?: Json | null
          test_scores?: Json | null
          top_skills_by_endorsements?: Json | null
          updated_at?: string | null
          updates?: Json | null
          urn?: string | null
          verifications?: Json | null
          volunteer_and_awards?: Json | null
          volunteer_causes?: Json | null
        }
        Update: {
          about?: string | null
          address_country_only?: string | null
          address_with_country?: string | null
          address_without_country?: string | null
          company_founded_in?: string | null
          company_industry?: string | null
          company_linkedin?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          connections?: number | null
          courses?: Json | null
          created_at?: string | null
          current_job_duration?: string | null
          current_job_duration_in_yrs?: number | null
          educations?: Json | null
          email?: string | null
          experiences?: Json | null
          first_name?: string | null
          followers?: number | null
          full_name?: string | null
          headline?: string | null
          highlights?: Json | null
          honors_and_awards?: Json | null
          id?: string
          interests?: Json | null
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          license_and_certificates?: Json | null
          linkedin_url?: string
          mobile_number?: string | null
          open_connection?: boolean | null
          organizations?: Json | null
          patents?: Json | null
          profile_pic?: string | null
          profile_pic_all_dimensions?: Json | null
          profile_pic_high_quality?: string | null
          projects?: Json | null
          promos?: Json | null
          public_identifier?: string | null
          publications?: Json | null
          recommendations?: Json | null
          skills?: Json | null
          test_scores?: Json | null
          top_skills_by_endorsements?: Json | null
          updated_at?: string | null
          updates?: Json | null
          urn?: string | null
          verifications?: Json | null
          volunteer_and_awards?: Json | null
          volunteer_causes?: Json | null
        }
        Relationships: []
      }
      scraping_logs: {
        Row: {
          actor_id: string
          batch_id: string | null
          completed_at: string | null
          created_at: string | null
          credits_used: number | null
          error_message: string | null
          id: string
          items_scraped: number | null
          status: string
          target_url: string | null
          user_id: string
        }
        Insert: {
          actor_id: string
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_used?: number | null
          error_message?: string | null
          id?: string
          items_scraped?: number | null
          status: string
          target_url?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_used?: number | null
          error_message?: string | null
          id?: string
          items_scraped?: number | null
          status?: string
          target_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraping_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_profiles: {
        Row: {
          company_profile_id: string | null
          created_at: string | null
          id: string
          personal_notes: string | null
          profile_id: string | null
          profile_type: string
          tags: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_profile_id?: string | null
          created_at?: string | null
          id?: string
          personal_notes?: string | null
          profile_id?: string | null
          profile_type: string
          tags?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_profile_id?: string | null
          created_at?: string | null
          id?: string
          personal_notes?: string | null
          profile_id?: string | null
          profile_type?: string
          tags?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_profiles_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "linkedin_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "linkedin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          image_url: string | null
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          image_url?: string | null
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          image_url?: string | null
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string | null
          events: Json
          id: string
          is_active: boolean | null
          secret_key: string | null
          updated_at: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          events?: Json
          id?: string
          is_active?: boolean | null
          secret_key?: string | null
          updated_at?: string | null
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          events?: Json
          id?: string
          is_active?: boolean | null
          secret_key?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
