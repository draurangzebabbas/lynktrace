
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'add') {
      const { apiKey } = await req.json()

      const isValid = await testApiKey(apiKey)
      
      if (!isValid) {
        throw new Error('Invalid API key')
      }

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userData.id,
          api_key: apiKey,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, apiKey: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, apiKeys: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (action === 'refresh') {
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userData.id)

      const updates = []

      for (const key of apiKeys || []) {
        const isValid = await testApiKey(key.api_key)
        
        const newStatus = isValid ? 'active' : 'failed'
        
        if (newStatus !== key.status) {
          updates.push(
            supabase
              .from('api_keys')
              .update({ status: newStatus })
              .eq('id', key.id)
          )
        }
      }

      await Promise.all(updates)

      const { data: updatedKeys } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userData.id)

      return new Response(
        JSON.stringify({ success: true, apiKeys: updatedKeys }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (action === 'delete') {
      const { keyId } = await req.json()

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', userData.id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')

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

async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    return response.ok
  } catch {
    return false
  }
}
