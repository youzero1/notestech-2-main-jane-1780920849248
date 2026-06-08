
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

interface RequestBody {
  prompt: string;
  style?: string;
  mood?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader?.split(' ')[1] ?? '');

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, style, mood } = await req.json() as RequestBody;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google AI API key from environment variables
    const googleApiKey = Deno.env.get('GOOGLE_AI_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    // Generate lyrics using Google's Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': googleApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a professional songwriter. Create song lyrics based on these details:
              Topic: ${prompt}
              ${style ? `Style: ${style}` : ''}
              ${mood ? `Mood: ${mood}` : ''}
              
              Please write structured song lyrics with verses and chorus. Make them creative and meaningful.
              Format the output with clear verse and chorus labels.`
          }]
        }]
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error response:', await response.text());
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Google AI response:', JSON.stringify(data, null, 2));

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response structure:', data);
      throw new Error('Invalid response structure from Gemini API');
    }

    const generatedLyrics = data.candidates[0].content.parts[0].text;

    // Generate production advice
    const productionResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': googleApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `As a music producer, provide detailed production advice for a song with these lyrics:

              ${generatedLyrics}

              Style: ${style || 'Not specified'}
              Mood: ${mood || 'Not specified'}

              Give specific suggestions about:
              1. Instrumentation
              2. Arrangement
              3. Sound design
              4. Mixing tips
              
              Be specific and technical but also creative.`
          }]
        }]
      }),
    });

    if (!productionResponse.ok) {
      console.error('Production advice API error:', await productionResponse.text());
      throw new Error(`Production advice API request failed: ${productionResponse.status} ${productionResponse.statusText}`);
    }

    const productionData = await productionResponse.json();
    console.log('Production advice response:', JSON.stringify(productionData, null, 2));

    if (!productionData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid production advice response structure:', productionData);
      throw new Error('Invalid response structure from production advice API');
    }

    const productionAdvice = productionData.candidates[0].content.parts[0].text;

    // Store the generated lyrics
    const { data: lyricsData, error: lyricsError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        type: 'lyrics',
        prompt,
        content: generatedLyrics,
        metadata: { style, mood }
      })
      .select()
      .single();

    if (lyricsError) {
      console.error('Database error storing lyrics:', lyricsError);
      throw lyricsError;
    }

    // Store the production advice
    const { data: productionData2, error: productionError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        type: 'production',
        prompt: `Production advice for "${prompt}"`,
        content: productionAdvice,
        metadata: { style, mood, lyrics_id: lyricsData.id }
      })
      .select()
      .single();

    if (productionError) {
      console.error('Database error storing production advice:', productionError);
      throw productionError;
    }

    return new Response(JSON.stringify({ 
      lyrics: lyricsData,
      production: productionData2
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
