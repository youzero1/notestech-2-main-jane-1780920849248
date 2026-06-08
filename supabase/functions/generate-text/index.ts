
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

interface RequestBody {
  prompt: string;
  tool: string;
  temperature: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { prompt, tool, temperature } = await req.json() as RequestBody;

    if (!prompt || !tool) {
      return new Response(JSON.stringify({ error: 'Prompt and tool are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create system message based on the tool
    let systemMessage = "You are a creative writing assistant.";
    switch(tool) {
      case 'simile':
        systemMessage = "You create creative and unique similes. Respond with only the simile, no explanation.";
        break;
      case 'rhyme':
        systemMessage = "You generate rhyming words and phrases. Respond with only the rhyme, no explanation.";
        break;
      case 'alliteration':
        systemMessage = "You create alliterative phrases. Respond with only the alliteration, no explanation.";
        break;
      case 'wordplay':
        systemMessage = "You generate creative word play and puns. Respond with only the wordplay, no explanation.";
        break;
      case 'link':
        systemMessage = "You connect ideas with creative transitions. Respond with only the connection, no explanation.";
        break;
      case 'combine':
        systemMessage = "You merge different concepts together. Respond with only the merged concept, no explanation.";
        break;
      case 'rap':
        systemMessage = "You generate rap-style lyrics. Respond with only the rap lyrics, no explanation.";
        break;
      case 'flow':
        systemMessage = "You create smooth flowing phrases. Respond with only the flowing phrase, no explanation.";
        break;
      case 'image':
        systemMessage = "You generate descriptive imagery. Respond with only the descriptive imagery, no explanation.";
        break;
    }

    // Generate text using OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Create a ${tool} for: ${prompt}` }
        ],
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: generatedText.trim() 
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
