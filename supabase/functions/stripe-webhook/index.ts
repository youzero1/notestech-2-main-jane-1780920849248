
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.18.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

console.log('Starting stripe-webhook function');

// CORS headers to make the function public
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Stripe and Supabase clients initialized');
console.log(`Supabase URL: ${supabaseUrl.substring(0, 8)}...`);

serve(async (req) => {
  console.log('Received webhook request');
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }
  
  const signature = req.headers.get('stripe-signature');
  
  console.log(`Headers received: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);
  
  if (!signature) {
    console.error('Missing stripe signature');
    return new Response('Missing stripe signature', { 
      status: 400,
      headers: corsHeaders 
    });
  }
  
  try {
    console.log('Reading request body');
    const body = await req.text();
    console.log(`Request body length: ${body.length} characters`);
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret');
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }
    
    console.log(`Webhook secret configured: ${webhookSecret.substring(0, 4)}...`);
    console.log(`Stripe signature received: ${signature.substring(0, 20)}...`);
    
    // Use constructEventAsync instead of constructEvent
    console.log('Verifying webhook signature...');
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      console.log('✅ Webhook signature verified successfully');
    } catch (err) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }
    
    console.log(`Event type: ${event.type}`);
    console.log(`Event ID: ${event.id}`);
    console.log(`Event API version: ${event.api_version}`);
    
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        console.log('======= Processing invoice.payment_succeeded event =======');
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log(`Invoice ID: ${invoice.id}`);
        console.log(`Invoice Amount: ${invoice.amount_paid / 100} ${invoice.currency}`);
        console.log(`Invoice Status: ${invoice.status}`);
        console.log(`Subscription ID: ${subscriptionId}`);
        
        if (subscriptionId) {
          // Retrieve the subscription details
          console.log(`Retrieving subscription details for: ${subscriptionId}`);
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer;
          
          console.log(`Customer ID: ${customerId}`);
          console.log(`Subscription status: ${subscription.status}`);
          console.log(`Subscription interval: ${subscription.items.data[0]?.plan?.interval || 'unknown'}`);
          console.log(`Subscription created: ${new Date(subscription.created * 1000).toISOString()}`);
          
          if (customerId) {
            // Fetch the membership record from Supabase
            console.log(`Fetching membership for subscription: ${subscriptionId}`);
            const { data: membership, error: fetchError } = await supabase
              .from('user_memberships')
              .select('*')
              .eq('stripe_subscription_id', subscriptionId)
              .single();
            
            if (fetchError) {
              console.error('Error fetching membership:', fetchError);
              console.log('Will attempt to create new membership record instead');
              // You could add logic here to create a new membership if needed
            } else if (!membership) {
              console.log('No existing membership found with this subscription ID');
            } else {
              console.log(`Found membership for profile ID: ${membership.profile_id}`);
              console.log(`Current membership type: ${membership.type}`);
              console.log(`Current valid until: ${membership.valid_until}`);
              
              // Calculate the new `valid_until` date based on the subscription interval
              const now = new Date();
              let validUntil = new Date();
              let interval = subscription.items.data[0]?.plan?.interval;
              
              console.log(`Using subscription interval: ${interval}`);
              
              if (interval === 'month' || interval === 'daily') {
                validUntil.setMonth(now.getMonth() + 1); // Add 1 month
                console.log(`Setting valid_until to 1 month from now: ${validUntil.toISOString()}`);
              } else if (interval === 'year') {
                validUntil.setFullYear(now.getFullYear() + 1); // Add 1 year
                console.log(`Setting valid_until to 1 year from now: ${validUntil.toISOString()}`);
              } else {
                console.log(`Unknown interval: ${interval}, using default of 1 month`);
                validUntil.setMonth(now.getMonth() + 1);
              }
              
              // Update the membership in Supabase
              console.log(`Updating membership for subscription: ${subscriptionId}`);
              const { error: updateError } = await supabase
                .from('user_memberships')
                .update({
                  valid_until: validUntil.toISOString(),
                })
                .eq('stripe_subscription_id', subscriptionId);
              
              if (updateError) {
                console.error('Error updating membership:', updateError);
                return new Response('Error updating membership', { 
                  status: 500,
                  headers: corsHeaders 
                });
              }
              
              console.log('Membership updated successfully');
              
              // Insert a new invoice record for the renewal
              console.log('Creating invoice record in Supabase');
              const membershipType = membership?.type || "basic";
              const invoiceData = {
                profile_id: membership.profile_id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: invoice.payment_intent,
                amount: invoice.amount_paid / 100, // Convert to dollars
                currency: invoice.currency,
                membership_type: membershipType,
                status: 'succeeded',
                payment_date: now.toISOString()
              };
              
              console.log('Invoice data being inserted:', JSON.stringify(invoiceData));
              
              const { data: insertedInvoice, error: invoiceError } = await supabase
                .from('user_invoices')
                .insert(invoiceData)
                .select();
              
              if (invoiceError) {
                console.error('Error creating renewal invoice record:', invoiceError);
              } else {
                console.log('Invoice record created successfully:', insertedInvoice);
              }
              
              console.log('Membership renewed successfully for subscription:', subscriptionId);
            }
          } else {
            console.log('No customer ID found in subscription');
          }
        } else {
          console.log('No subscription ID found in invoice');
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        console.log('======= Processing customer.subscription.deleted event =======');
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        console.log(`Subscription ID: ${subscriptionId}`);
        console.log(`Cancellation reason: ${subscription.cancellation_details?.reason || 'unknown'}`);
        
        if (subscriptionId) {
          // Fetch the membership to log current state
          const { data: currentMembership, error: fetchError } = await supabase
            .from('user_memberships')
            .select('*')
            .eq('stripe_subscription_id', subscriptionId)
            .single();
            
          if (fetchError) {
            console.error('Error fetching current membership:', fetchError);
          } else if (currentMembership) {
            console.log(`Current membership found: ${JSON.stringify(currentMembership)}`);
          } else {
            console.log('No membership found with this subscription ID');
          }
        
          // Update the membership to "free" when the subscription is canceled
          console.log(`Cancelling membership for subscription: ${subscriptionId}`);
          const { data: updatedMembership, error } = await supabase
            .from('user_memberships')
            .update({
              type: 'free',
              valid_until: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
            .select();
          
          if (error) {
            console.error('Error cancelling membership:', error);
            return new Response('Error cancelling membership', { 
              status: 500,
              headers: corsHeaders 
            });
          }
          
          console.log('Membership cancelled successfully:', updatedMembership);
        } else {
          console.log('No subscription ID found in event');
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        console.log(`No specific handler for this event type`);
    }
    
    console.log('Webhook processed successfully');
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    console.error(err.stack);
    return new Response(`Webhook Error: ${err.message}`, { 
      status: 400,
      headers: corsHeaders 
    });
  }
});
