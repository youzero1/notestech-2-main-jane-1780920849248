
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, sessionId } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use a simple web search API (replace with Google/Bing API in production)
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    
    console.log("Sending search request to:", searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`);
    }
    
    const searchResults = await searchResponse.json();
    console.log("Received search results");

    // Send search results to OpenAI for processing
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that answers questions based on web search results. Include relevant citations in your answers using markdown format. Format your response in a clear, helpful way with headers and bullet points where appropriate. Focus on being accurate and informative."
          },
          { 
            role: "user", 
            content: `I searched for: "${query}". Here are the search results: ${JSON.stringify(searchResults)}. Please provide a comprehensive answer based on these results.` 
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiData = await openAIResponse.json();
    const aiResponseContent = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        response: aiResponseContent,
        sources: searchResults.RelatedTopics?.slice(0, 5) || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
