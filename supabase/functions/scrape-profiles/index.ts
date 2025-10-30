
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APIFY_PERSONAL_PROFILE_ACTOR = '2SyF0bVxmgGr8IVCZ'
const APIFY_COMPANY_PROFILE_ACTOR = 'AjfNXEI9qTA2IdaAX'

interface ScrapeProfileRequest {
  profileUrls: string[]
  profileType: 'personal' | 'company'
  userNotes?: string
  userTags?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (!userData) {
      throw new Error('User not found')
    }

    const body: ScrapeProfileRequest = await req.json()
    const { profileUrls, profileType, userNotes, userTags } = body

    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .order('last_used_at', { ascending: true, nullsFirst: true })

    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('No active API keys found')
    }

    const results = []
    const errors = []

    for (const profileUrl of profileUrls) {
      try {
        let profileData

        if (profileType === 'personal') {
          const { data: existingProfile } = await supabase
            .from('linkedin_profiles')
            .select('*')
            .eq('linkedin_url', profileUrl)
            .single()

          if (existingProfile) {
            profileData = existingProfile
          } else {
            const scrapedData = await scrapePersonalProfile(profileUrl, apiKeys[0].api_key)
            
            const { data: savedProfile, error: saveError } = await supabase
              .from('linkedin_profiles')
              .upsert({
                linkedin_url: scrapedData.linkedinUrl,
                public_identifier: scrapedData.publicIdentifier,
                first_name: scrapedData.firstName,
                last_name: scrapedData.lastName,
                full_name: scrapedData.fullName,
                headline: scrapedData.headline,
                connections: scrapedData.connections,
                followers: scrapedData.followers,
                email: scrapedData.email,
                mobile_number: scrapedData.mobileNumber,
                job_title: scrapedData.jobTitle,
                company_name: scrapedData.companyName,
                company_industry: scrapedData.companyIndustry,
                company_website: scrapedData.companyWebsite,
                company_linkedin: scrapedData.companyLinkedin,
                company_founded_in: scrapedData.companyFoundedIn,
                company_size: scrapedData.companySize,
                current_job_duration: scrapedData.currentJobDuration,
                current_job_duration_in_yrs: scrapedData.currentJobDurationInYrs,
                top_skills_by_endorsements: scrapedData.topSkillsByEndorsements,
                address_country_only: scrapedData.addressCountryOnly,
                address_with_country: scrapedData.addressWithCountry,
                address_without_country: scrapedData.addressWithoutCountry,
                profile_pic: scrapedData.profilePic,
                profile_pic_high_quality: scrapedData.profilePicHighQuality,
                about: scrapedData.about,
                open_connection: scrapedData.openConnection,
                urn: scrapedData.urn,
                experiences: scrapedData.experiences,
                skills: scrapedData.skills,
                educations: scrapedData.educations,
                license_and_certificates: scrapedData.licenseAndCertificates,
                projects: scrapedData.projects,
                languages: scrapedData.languages,
              }, { onConflict: 'linkedin_url' })
              .select()
              .single()

            if (saveError) throw saveError
            profileData = savedProfile
          }

          await supabase
            .from('user_saved_profiles')
            .upsert({
              user_id: userData.id,
              profile_id: profileData.id,
              profile_type: 'personal',
              personal_notes: userNotes,
              tags: userTags || [],
            }, { onConflict: 'user_id,profile_id' })

        } else {
          const { data: existingProfile } = await supabase
            .from('linkedin_company_profiles')
            .select('*')
            .eq('url', profileUrl)
            .single()

          if (existingProfile) {
            profileData = existingProfile
          } else {
            const scrapedData = await scrapeCompanyProfile(profileUrl, apiKeys[0].api_key)
            
            const { data: savedProfile, error: saveError } = await supabase
              .from('linkedin_company_profiles')
              .upsert({
                url: scrapedData.url,
                company_name: scrapedData.companyName,
                website_url: scrapedData.websiteUrl,
                industry: scrapedData.industry,
                employee_count: scrapedData.employeeCount,
                follower_count: scrapedData.followerCount,
                universal_name: scrapedData.universalName,
                tagline: scrapedData.tagline,
                description: scrapedData.description,
                company_id: scrapedData.companyId,
                hashtag: scrapedData.hashtag,
                industry_v2_taxonomy: scrapedData.industryV2Taxonomy,
                call_to_action: scrapedData.callToAction,
                employee_count_range: scrapedData.employeeCountRange,
                headquarter: scrapedData.headquarter,
                founded_on: scrapedData.foundedOn,
                logo_resolution_result: scrapedData.logoResolutionResult,
                original_cover_image: scrapedData.originalCoverImage,
                cropped_cover_image: scrapedData.croppedCoverImage,
                specialities: scrapedData.specialities,
                locations: scrapedData.locations,
              }, { onConflict: 'url' })
              .select()
              .single()

            if (saveError) throw saveError
            profileData = savedProfile
          }

          await supabase
            .from('user_saved_profiles')
            .upsert({
              user_id: userData.id,
              company_profile_id: profileData.id,
              profile_type: 'company',
              personal_notes: userNotes,
              tags: userTags || [],
            }, { onConflict: 'user_id,company_profile_id' })
        }

        results.push(profileData)

      } catch (error) {
        errors.push({ url: profileUrl, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors,
        total: profileUrls.length,
        successful: results.length,
        failed: errors.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function scrapePersonalProfile(profileUrl: string, apiKey: string) {
  const response = await fetch(`https://api.apify.com/v2/acts/${APIFY_PERSONAL_PROFILE_ACTOR}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      profileUrls: [profileUrl],
    }),
  })

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`)
  }

  const runData = await response.json()
  const runId = runData.data.id

  await waitForRun(runId, apiKey)

  const resultsResponse = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_PERSONAL_PROFILE_ACTOR}/runs/${runId}/dataset/items`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }
  )

  const results = await resultsResponse.json()
  return results[0]
}

async function scrapeCompanyProfile(profileUrl: string, apiKey: string) {
  const response = await fetch(`https://api.apify.com/v2/acts/${APIFY_COMPANY_PROFILE_ACTOR}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      profileUrls: [profileUrl],
    }),
  })

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`)
  }

  const runData = await response.json()
  const runId = runData.data.id

  await waitForRun(runId, apiKey)

  const resultsResponse = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_COMPANY_PROFILE_ACTOR}/runs/${runId}/dataset/items`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }
  )

  const results = await resultsResponse.json()
  return results[0]
}

async function waitForRun(runId: string, apiKey: string) {
  let status = 'RUNNING'
  let attempts = 0
  const maxAttempts = 60

  while (status === 'RUNNING' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      }
    )
    
    const statusData = await statusResponse.json()
    status = statusData.data.status
    attempts++
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Scraping failed with status: ${status}`)
  }
}
