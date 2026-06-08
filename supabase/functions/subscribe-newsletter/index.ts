
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists
    const { data: existingSubscriber, error: queryError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" error code
      console.error("Error checking for existing subscriber:", queryError);
      throw new Error(`Database error: ${queryError.message}`);
    }

    if (existingSubscriber) {
      if (existingSubscriber.verified) {
        return new Response(
          JSON.stringify({ message: "You're already subscribed to our newsletter." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Update existing unverified subscriber to be verified
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            verified: true, 
            verification_token: null,
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingSubscriber.id);
        
        if (updateError) {
          console.error("Error updating subscriber:", updateError);
          throw new Error(`Failed to update subscriber: ${updateError.message}`);
        }
      }
    } else {
      // Create new subscriber as already verified
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([{ 
          email, 
          verification_token: null,
          verified: true
        }]);

      if (insertError) {
        console.error("Error creating new subscriber:", insertError);
        throw new Error(`Failed to create subscriber: ${insertError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ message: "Thank you for subscribing to our newsletter!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in subscribe-newsletter function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
