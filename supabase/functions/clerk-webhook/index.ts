
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import { Webhook } from 'https://esm.sh/svix@1.77.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('CLERK_WEBHOOK_SECRET not configured')
    }

    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)

    const wh = new Webhook(webhookSecret)
    const evt = wh.verify(payload, headers) as ClerkWebhookEvent

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (evt.type) {
      case 'user.created':
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data

        const { error } = await supabase
          .from('users')
          .upsert({
            clerk_id: id,
            email: email_addresses?.[0]?.email_address || null,
            first_name: first_name || null,
            last_name: last_name || null,
            image_url: image_url || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'clerk_id'
          })

        if (error) throw error
        break
      }

      case 'user.deleted': {
        const { id } = evt.data

        const { error } = await supabase
          .from('users')
          .delete()
          .eq('clerk_id', id)

        if (error) throw error
        break
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
