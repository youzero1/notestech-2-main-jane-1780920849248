
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.18.0?target=deno'
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

console.log('Starting create-membership-checkout function');

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized');
console.log(`Supabase URL: ${supabaseUrl.substring(0, 8)}...`);
console.log(`Stripe API configured: ${!!Deno.env.get('STRIPE_SECRET_KEY')}`);

serve(async (req) => {
  console.log('Received request to create-membership-checkout');
  console.log(`Request method: ${req.method}`);
  console.log(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parsing request body');
    const { priceId, customerEmail, userId } = await req.json();
    console.log(`Request data: priceId=${priceId}, email=${customerEmail}, userId=${userId}`);

    try {

      //cancel membership if it exists
      const { data: membershipData, error } = await supabase
        .from('user_memberships')
        .select('stripe_subscription_id')
        .eq('profile_id', userId).maybeSingle();
        
      if (membershipData && membershipData.stripe_subscription_id) {
        const { error: cancelError } = await stripe.subscriptions.cancel(membershipData.stripe_subscription_id);
        if (cancelError) {
          console.error('Error canceling Stripe subscription:', cancelError);
        }
      }
        
      // Create a customer
      console.log('Creating Stripe customer');
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: userId,
        },
      });
      console.log(`Stripe customer created with ID: ${customer.id}`);
  
      // Create a subscription
      console.log('Creating Stripe subscription');
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete', // Required for subscriptions
        expand: ['latest_invoice.payment_intent'], // Expand to get the Payment Intent
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        collection_method: 'charge_automatically', // This is the key setting
        default_payment_method: customer.default_payment_method // If you have this already set
      });
      console.log(`Stripe subscription created with ID: ${subscription.id}`);
      console.log(`Payment intent ID: ${subscription.latest_invoice.payment_intent.id}`);
      console.log(`Payment intent status: ${subscription.latest_invoice.payment_intent.status}`);

      console.log('Preparing response with client secret');
      return new Response(
        JSON.stringify({
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          subscriptionId: subscription.id,
          customerId: customer.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error('Error creating Stripe resources:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
