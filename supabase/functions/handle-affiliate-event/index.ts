
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AffiliateEvent {
  linkId: string;
  eventType: 'click' | 'sale' | 'lead' | 'subscription';
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { linkId, eventType, metadata } = await req.json() as AffiliateEvent

    // Validate input
    if (!linkId || !eventType) {
      throw new Error('Missing required fields')
    }

    console.log(`Processing ${eventType} event for link ${linkId}`)

    switch (eventType) {
      case 'click':
        const { data: clickResult, error: clickError } = await supabaseClient.rpc(
          'track_affiliate_click',
          { link_id: linkId }
        )
        if (clickError) throw clickError
        break;

      case 'sale':
      case 'lead':
      case 'subscription':
        // Insert the performance record directly
        const { error: perfError } = await supabaseClient
          .from('affiliate_performance')
          .insert({
            link_id: linkId,
            trigger_type: eventType,
            status: 'completed',
            metadata
          })
        if (perfError) throw perfError
        break;

      default:
        throw new Error(`Unsupported event type: ${eventType}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error processing affiliate event:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})
