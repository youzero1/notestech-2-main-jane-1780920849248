
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Order = Database['public']['Tables']['orders']['Row'];

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrderByPaymentIntent(paymentIntentId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string, paymentError?: string) {
  const updates: any = { 
    status,
    updated_at: new Date()
  };
  
  if (status === 'completed') {
    updates.payment_date = new Date();
  }
  
  if (paymentError) {
    updates.payment_error = paymentError;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
