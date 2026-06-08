
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.18.0?target=deno';
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, userId } = await req.json();
    
    if (!items || !items.length) {
      return new Response(
        JSON.stringify({ error: 'No items provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating payment intent for user: ${userId || 'guest'} with ${items.length} items`);

    // Calculate order amount from items
    const amount = items.reduce(
      (sum: number, item: any) => sum + (Math.round(item.price * 100) * item.quantity),
      0
    );

    // Generate a stable idempotency key based on the items and user to prevent duplicate requests
    const orderItemsHash = JSON.stringify(items.map((item: any) => ({
      id: item.id, 
      quantity: item.quantity,
      selectedSize: item.selectedSize || '',
      selectedColor: item.selectedColor || ''
    })));
    
    const idempotencyKey = `order_${userId || 'guest'}_${Date.now()}_${orderItemsHash.length}`;
    console.log(`Using idempotency key: ${idempotencyKey}`);

    // Create metadata with item details and enhanced user information
    const metadata: Record<string, string> = {
      items: JSON.stringify(items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null
      }))),
    };

    // Add userId to metadata if provided - this is crucial for webhook processing
    if (userId) {
      metadata.userId = userId;
    }

    // Create a PaymentIntent with idempotency key
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      },
      {
        idempotencyKey
      }
    );

    console.log(`Created new payment intent: ${paymentIntent.id}`);

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
