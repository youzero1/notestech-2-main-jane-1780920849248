
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, userId, paymentIntentId, amount } = await req.json();
    
    if (!items || !items.length || !userId || !paymentIntentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating completed order for user: ${userId} with ${items.length} items and payment intent: ${paymentIntentId}`);

    // Determine if this is a single product or a cart purchase
    const isSingleProduct = items.length === 1;
    const productId = isSingleProduct ? items[0].id : null;
    
    // Create a new order record with status 'completed'
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        profile_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        amount: amount / 100, // Convert back to dollars for storage
        currency: 'usd',
        status: 'completed', // Set status as completed immediately
        items: items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null
        })),
        product_id: productId,
        payment_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created new order record with ID: ${order.id}`);

    return new Response(
      JSON.stringify({ success: true, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
