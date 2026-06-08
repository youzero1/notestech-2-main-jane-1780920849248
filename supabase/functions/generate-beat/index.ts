
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  prompt: string;
  genre?: string;
  bpm?: number;
}

interface BeatovenResponse {
  id: string;
  status: string;
  url?: string;
}

// Base URL for Beatoven API
const BEATOVEN_BASE_URL = "https://public-api.beatoven.ai";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, genre, bpm } = await req.json() as RequestBody;
    const apiKey = Deno.env.get('BEATOVEN_API_KEY');

    if (!apiKey) {
      console.error('Missing API key');
      throw new Error('Beatoven API key not configured');
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map our genres to Beatoven genres
    const beatovenGenre = mapGenreToBeatoven(genre || 'trap');
    
    console.log('Starting music generation with params:', {
      genre: beatovenGenre,
      bpm: bpm || 120,
      duration: 60,
    });

    // First, validate the API key
    try {
      const testResponse = await fetch(`${BEATOVEN_BASE_URL}/user/me`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
      });

      if (!testResponse.ok) {
        const testError = await testResponse.text();
        console.error('API key validation failed:', testError);
        throw new Error('Invalid API key');
      }

      console.log('API key validated successfully');
    } catch (error) {
      console.error('API key validation error:', error);
      throw new Error('Failed to validate API key');
    }

    // Create music generation request
    const requestBody = {
      duration: 60,
      genre: beatovenGenre,
      bpm: bpm || 120,
      notes: prompt,
      mood: "energetic"
    };

    let createResponse;
    try {
      createResponse = await fetch(`${BEATOVEN_BASE_URL}/music/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Music generation request failed:', errorText);
        throw new Error('Failed to initiate music generation');
      }
    } catch (error) {
      console.error('Music generation request error:', error);
      throw new Error('Failed to connect to Beatoven API');
    }

    const createData = await createResponse.json() as BeatovenResponse;
    console.log('Music generation initiated:', createData);

    // Poll for completion
    let musicData = createData;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && musicData.status !== 'COMPLETED') {
      console.log(`Checking status (attempt ${attempts + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks

      try {
        const statusResponse = await fetch(`${BEATOVEN_BASE_URL}/music/${musicData.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
        });

        if (!statusResponse.ok) {
          console.error('Status check failed:', await statusResponse.text());
          attempts++;
          continue;
        }

        musicData = await statusResponse.json() as BeatovenResponse;
        console.log('Status check result:', {
          attempt: attempts,
          status: musicData.status,
          url: musicData.url
        });

        if (musicData.status === 'FAILED') {
          throw new Error('Music generation failed on Beatoven servers');
        }
      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
      }
    }

    if (musicData.status !== 'COMPLETED' || !musicData.url) {
      throw new Error('Music generation timed out or failed');
    }

    console.log('Music generation completed successfully:', musicData);
    
    return new Response(JSON.stringify({
      data: {
        audioUrl: musicData.url,
        duration: 60,
        prompt,
        genre,
        bpm
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function mapGenreToBeatoven(genre: string): string {
  // Map our genres to Beatoven's supported genres
  const genreMap: { [key: string]: string } = {
    'trap': 'Hip Hop',
    'boombap': 'Hip Hop',
    'lofi': 'Lo-Fi',
    'drill': 'Hip Hop',
  };
  return genreMap[genre.toLowerCase()] || 'Hip Hop';
}
