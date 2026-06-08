
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export async function createProduct(product: ProductInsert) {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: ProductUpdate) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function listProducts(type?: 'direct' | 'affiliate') {
  let query = supabase.from('products').select('*');
  
  if (type) {
    query = query.eq('type', type);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('productId', productId);

  try {
    // Use the constants directly from the client file
    const response = await supabase.functions.invoke('upload-product-image', {
      method: 'POST',
      body: formData,
    });

    if (response.error) {
      throw new Error(`Failed to upload image: ${response.error.message}`);
    }

    const result = response.data;

    if (!result?.publicUrl) {
      throw new Error('No public URL returned from upload');
    }

    return result.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
