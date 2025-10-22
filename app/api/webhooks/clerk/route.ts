import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  console.log('Webhook received:', new Date().toISOString())
  
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers')
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.text()
  console.log('Webhook payload received')

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
    console.log('Webhook verified successfully, event type:', evt.type)
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred during verification', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    console.log('Creating user in Supabase:', { id, email: email_addresses[0]?.email_address })

    // Create user in Supabase using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: id,
        email: email_addresses[0]?.email_address,
        first_name: first_name,
        last_name: last_name,
        image_url: image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('Error creating user in Supabase:', error)
      return new Response(`Error creating user: ${error.message}`, {
        status: 500,
      })
    }
    
    console.log('User created successfully in Supabase:', data)
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    console.log('Updating user in Supabase:', { id })

    // Update user in Supabase using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('users')
      .update({
        email: email_addresses[0]?.email_address,
        first_name: first_name,
        last_name: last_name,
        image_url: image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', id)
      .select()

    if (error) {
      console.error('Error updating user in Supabase:', error)
      return new Response(`Error updating user: ${error.message}`, {
        status: 500,
      })
    }
    
    console.log('User updated successfully in Supabase:', data)
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data
    console.log('Deleting user from Supabase:', { id })

    // Delete user from Supabase using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', id)
      .select()

    if (error) {
      console.error('Error deleting user from Supabase:', error)
      return new Response(`Error deleting user: ${error.message}`, {
        status: 500,
      })
    }
    
    console.log('User deleted successfully from Supabase:', data)
  }

  console.log('Webhook processed successfully')
  return new Response('', { status: 200 })
}
