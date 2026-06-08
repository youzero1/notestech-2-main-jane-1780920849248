
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const productId = formData.get('productId')

    if (!file) {
      throw new Error('No file uploaded')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create storage bucket if it doesn't exist
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .createBucket('products', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError
    }

    // Prepare file for upload
    const timestamp = new Date().getTime()
    const fileExt = (file as File).name.split('.').pop()
    const filePath = `${productId}/${timestamp}.${fileExt}`

    // Upload file
    const { error: uploadError } = await supabase
      .storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('products')
      .getPublicUrl(filePath)

    return new Response(
      JSON.stringify({
        message: 'Upload successful',
        publicUrl
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during upload'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
})
