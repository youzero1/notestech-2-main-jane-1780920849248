
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for required environment variables
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set");
    return new Response(
      JSON.stringify({ error: "API configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
    return new Response(
      JSON.stringify({ error: "Database configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get the user's JWT token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No valid Authorization header found");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing or invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    console.log("Received auth token:", token ? "Valid token present" : "No token");

    // Create supabase client with user's JWT token
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verify the user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token", details: authError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData || !authData.user) {
      console.error("No user found in auth data");
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    console.log("Authenticated user ID:", userId);

    const requestData = await req.json();
    const { message, sessionId, useSearch } = requestData;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing request for user ${userId}, session: ${sessionId || 'new'}, useSearch: ${useSearch}`);

    // Create a new session if sessionId is not provided
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        console.log("Creating new chat session for user:", userId);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: message.substring(0, 30) + (message.length > 30 ? "..." : ""),
            search_enabled: !!useSearch
          })
          .select("id")
          .single();

        if (sessionError) {
          console.error("Error creating session:", sessionError);
          throw new Error(`Failed to create chat session: ${sessionError.message}`);
        }

        if (!sessionData || !sessionData.id) {
          console.error("No session ID returned after session creation");
          throw new Error("Failed to create chat session: No session ID returned");
        }

        currentSessionId = sessionData.id;
        console.log(`Created new session with ID: ${currentSessionId}`);
      } catch (sessionCreationError) {
        console.error("Session creation error:", sessionCreationError);
        return new Response(
          JSON.stringify({ error: sessionCreationError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (useSearch !== undefined) {
      // Update existing session with search preference if provided
      await supabase
        .from("chat_sessions")
        .update({ search_enabled: !!useSearch })
        .eq("id", currentSessionId);
    }

    // Get any file attachments for this session
    const { data: attachments, error: attachmentsError } = await supabase
      .from("chat_attachments")
      .select("filename, file_type, file_path, public_url")
      .eq("session_id", currentSessionId)
      .order("created_at", { ascending: false });
    
    if (attachmentsError) {
      console.error("Error fetching attachments:", attachmentsError);
    }

    console.log("Attachments for session:", attachments);

    // Save the user message to the database
    try {
      console.log(`Saving user message to session ${currentSessionId}`);
      const { error: saveUserMsgError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: currentSessionId,
          content: message,
          role: "user",
          user_id: userId,
        });

      if (saveUserMsgError) {
        console.error("Error saving user message:", saveUserMsgError);
        throw new Error(`Failed to save user message: ${saveUserMsgError.message}`);
      }
    } catch (saveMessageError) {
      console.error("Save message error:", saveMessageError);
      return new Response(
        JSON.stringify({ error: saveMessageError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the current search_enabled status for the session
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from("chat_sessions")
      .select("search_enabled")
      .eq("id", currentSessionId)
      .single();
    
    if (sessionFetchError) {
      console.error("Error fetching session data:", sessionFetchError);
    }

    const isSearchEnabled = sessionData?.search_enabled || false;
    console.log("Search enabled for session:", isSearchEnabled);

    // Get previous messages for context - only fetch the 10 most recent messages
    const { data: previousMessages, error: previousMessagesError } = await supabase
      .from("chat_messages")
      .select("content, role")
      .eq("session_id", currentSessionId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (previousMessagesError) {
      console.error("Error fetching previous messages:", previousMessagesError);
    }

    console.log("Calling OpenAI API...");
    
    // Prepare system message based on search and attachments
    let systemContent = "You are ASK Notes, an AI business consultant specialized in business strategy, marketing, content creation, market analysis, customer acquisition, brand development, and business metrics. Provide actionable, practical advice for entrepreneurs and business professionals. Focus on modern business practices and digital marketing strategies. Your knowledge cutoff is 2023. Always format your responses with clear headers, bullet points where appropriate, and concise paragraphs. Provide specific, actionable steps when giving recommendations.";
    
    if (isSearchEnabled) {
      systemContent += " You have access to search the web for the latest information. When you use this capability, make sure to cite your sources.";
    }

    // Enhanced file handling - add file context
    let fileContext = "";
    if (attachments && attachments.length > 0) {
      systemContent += ` The user has uploaded ${attachments.length} file(s): ${attachments.map(a => a.filename).join(", ")}. Refer to these files when they're relevant to the conversation.`;
      
      // Add file details to the context
      fileContext = "Files available in this conversation:\n";
      attachments.forEach(attachment => {
        fileContext += `- ${attachment.filename} (${attachment.file_type})`;
        if (attachment.public_url) {
          fileContext += ` - Available at: ${attachment.public_url}`;
        }
        fileContext += "\n";
      });
    }

    // Build conversation history for context - reverse the array to get chronological order
    const conversationHistory = previousMessages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })).reverse() || [];
    
    // Create messages array with file context if available
    const messages = [
      { role: "system", content: systemContent },
      ...conversationHistory
    ];
    
    // Add file context as an assistant message if available
    if (fileContext) {
      // Insert file context before the user's latest message
      messages.push({ 
        role: "assistant", 
        content: "Let me provide information about the files that have been uploaded to this conversation so I can reference them in my responses:\n" + fileContext 
      });
    }
    
    // Add user's current message
    messages.push({ role: "user", content: message });
    
    console.log("Sending message history to OpenAI:", messages.length, "messages");

    // Call OpenAI API with updated system prompt and model
    try {
      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Use GPT-4o for better quality responses
          messages: messages,
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (!openAIResponse.ok) {
        const errorText = await openAIResponse.text();
        console.error("OpenAI API error status:", openAIResponse.status);
        console.error("OpenAI API error response:", errorText);
        throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
      }

      const aiData = await openAIResponse.json();
      
      if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
        console.error("Unexpected OpenAI response format:", JSON.stringify(aiData));
        throw new Error("Invalid response from AI service");
      }
      
      const aiResponseContent = aiData.choices[0].message.content;
      console.log("Received AI response successfully");

      // Save the AI response to the database
      console.log(`Saving AI response to session ${currentSessionId}`);
      const { error: saveAIMsgError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: currentSessionId,
          content: aiResponseContent,
          role: "assistant",
          user_id: userId,
        });

      if (saveAIMsgError) {
        console.error("Error saving AI response:", saveAIMsgError);
        throw new Error(`Failed to save AI response: ${saveAIMsgError.message}`);
      }

      // Update the session updated_at timestamp
      console.log(`Updating session timestamp for session ${currentSessionId}`);
      const { error: updateSessionError } = await supabase
        .from("chat_sessions")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSessionId);

      if (updateSessionError) {
        console.error("Error updating session timestamp:", updateSessionError);
      }

      // Return the response
      return new Response(
        JSON.stringify({
          response: aiResponseContent,
          sessionId: currentSessionId,
          searchEnabled: isSearchEnabled
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (openAIError) {
      console.error("OpenAI error:", openAIError);
      return new Response(
        JSON.stringify({ error: openAIError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
