
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APIFY_POST_COMMENTS_ACTOR = 'ZI6ykbLlGS3APaPE8'
const APIFY_POST_REACTIONS_ACTOR = 'S6mgSO5lezSZKi0zN'
const APIFY_PERSONAL_PROFILE_ACTOR = '2SyF0bVxmgGr8IVCZ'

interface ScrapeEngagementRequest {
  postUrls: string[]
  scrapingType: 'comments' | 'reactions' | 'both'
  enrichProfiles: boolean
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

    const body: ScrapeEngagementRequest = await req.json()
    const { postUrls, scrapingType, enrichProfiles, userNotes, userTags } = body

    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .order('last_used_at', { ascending: true, nullsFirst: true })

    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('No active API keys found')
    }

    const allEngagers = []

    for (const postUrl of postUrls) {
      if (scrapingType === 'comments' || scrapingType === 'both') {
        const comments = await scrapeComments(postUrl, apiKeys[0].api_key)
        allEngagers.push(...comments.map((c: any) => ({
          type: 'commenter',
          profileUrl: c.actor?.linkedinUrl,
          data: c,
        })))
      }

      if (scrapingType === 'reactions' || scrapingType === 'both') {
        const reactions = await scrapeReactions(postUrl, apiKeys[0].api_key)
        allEngagers.push(...reactions.map((r: any) => ({
          type: 'reactor',
          profileUrl: r.actor?.linkedinUrl,
          data: r,
        })))
      }
    }

    const uniqueProfileUrls = [...new Set(allEngagers.map(e => e.profileUrl).filter(Boolean))]

    if (!enrichProfiles) {
      return new Response(
        JSON.stringify({
          success: true,
          engagers: allEngagers,
          totalEngagers: allEngagers.length,
          uniqueProfiles: uniqueProfileUrls.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const enrichedProfiles = []
    const batchSize = 20
    let keyIndex = 0

    for (let i = 0; i < uniqueProfileUrls.length; i += batchSize) {
      const batch = uniqueProfileUrls.slice(i, i + batchSize)
      const currentKey = apiKeys[keyIndex % apiKeys.length]

      for (const profileUrl of batch) {
        try {
          const { data: existingProfile } = await supabase
            .from('linkedin_profiles')
            .select('*')
            .eq('linkedin_url', profileUrl)
            .single()

          let profileData

          if (existingProfile) {
            profileData = existingProfile
          } else {
            const scrapedData = await scrapePersonalProfile(profileUrl, currentKey.api_key)
            
            const { data: savedProfile } = await supabase
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
                job_title: scrapedData.jobTitle,
                company_name: scrapedData.companyName,
                profile_pic: scrapedData.profilePic,
                about: scrapedData.about,
                experiences: scrapedData.experiences,
                skills: scrapedData.skills,
                educations: scrapedData.educations,
              }, { onConflict: 'linkedin_url' })
              .select()
              .single()

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

          enrichedProfiles.push(profileData)

        } catch (error) {
          console.error(`Error enriching profile ${profileUrl}:`, error)
        }
      }

      keyIndex++
    }

    return new Response(
      JSON.stringify({
        success: true,
        engagers: allEngagers,
        enrichedProfiles,
        totalEngagers: allEngagers.length,
        profilesEnriched: enrichedProfiles.length,
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

async function scrapeComments(postUrl: string, apiKey: string) {
  const response = await fetch(`https://api.apify.com/v2/acts/${APIFY_POST_COMMENTS_ACTOR}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      posts: [postUrl],
    }),
  })

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`)
  }

  const runData = await response.json()
  const runId = runData.data.id

  await waitForRun(runId, apiKey)

  const resultsResponse = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_POST_COMMENTS_ACTOR}/runs/${runId}/dataset/items`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }
  )

  return await resultsResponse.json()
}

async function scrapeReactions(postUrl: string, apiKey: string) {
  const response = await fetch(`https://api.apify.com/v2/acts/${APIFY_POST_REACTIONS_ACTOR}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      posts: [postUrl],
    }),
  })

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`)
  }

  const runData = await response.json()
  const runId = runData.data.id

  await waitForRun(runId, apiKey)

  const resultsResponse = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_POST_REACTIONS_ACTOR}/runs/${runId}/dataset/items`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }
  )

  return await resultsResponse.json()
}

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
