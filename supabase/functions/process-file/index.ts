
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's JWT token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing or invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    
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
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    const { fileData, fileName, fileType, fileSize, sessionId, message } = await req.json();

    if (!fileData || !fileName || !sessionId) {
      return new Response(
        JSON.stringify({ error: "File data, name, and session ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert base64 to Buffer/Uint8Array
    const base64Data = fileData.split(',')[1];
    const fileBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to storage
    const filePath = `${userId}/${sessionId}/${fileName}`;
    const { error: uploadError } = await supabase
      .storage
      .from('chat_attachments')
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL for the file
    const { data: publicUrlData } = await supabase
      .storage
      .from('chat_attachments')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || "";
    
    // Verify the URL is accessible
    console.log("Generated public URL:", publicUrl);
    
    // Create a record in chat_attachments
    const { error: dbError } = await supabase
      .from('chat_attachments')
      .insert({
        session_id: sessionId,
        user_id: userId,
        filename: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_path: filePath,
        public_url: publicUrl
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to save attachment record: ${dbError.message}`);
    }

    // Prepare file content for AI analysis
    let fileContent = "";
    let fileContext = "";
    let openAIMessages = [
      {
        role: "system",
        content: "You are an AI assistant that helps analyze uploaded files. Provide detailed insights about the file content, extracting key information and highlighting important aspects. Be concise but thorough in your analysis."
      }
    ];
    
    // For text-based files, extract content
    if (fileType.startsWith("text/") || 
        fileType.includes("json") || 
        fileType.includes("csv") || 
        fileType.includes("xml")) {
      // For text files, we can decode the content
      fileContent = new TextDecoder().decode(fileBuffer);
      fileContext = `This is the content of the file "${fileName}": ${fileContent.substring(0, 10000)}`;
      
      if (fileContent.length > 10000) {
        fileContext += "... (content truncated)";
      }
      
      openAIMessages.push({ 
        role: "user", 
        content: `${fileContext}\n\n${message ? `The user's question or comment about this file: "${message}"` : `Please analyze this file and provide insights.`}` 
      });
    } else if (fileType.startsWith("image/")) {
      // For images, use OpenAI's vision capability
      openAIMessages.push({ 
        role: "user", 
        content: [
          { type: "text", text: message || "Please analyze this image and describe what you see." },
          {
            type: "image_url",
            image_url: {
              url: fileData, // Send the base64 image data directly
              detail: "high" // Request high detail analysis for images
            }
          }
        ] 
      });
    } else {
      // For other file types
      fileContext = `The user has uploaded a file named "${fileName}" of type ${fileType} and size ${fileSize} bytes.`;
      openAIMessages.push({ 
        role: "user", 
        content: `${fileContext}\n\n${message ? `The user's question or comment about this file: "${message}"` : `Please provide information about this type of file and how it might be used.`}` 
      });
    }

    // Generate summary with OpenAI
    let summary = "";
    let aiResponse = null;
    let userMessageId = null;
    let aiMessageId = null;

    if (openAIMessages.length > 1) {
      console.log("Sending to OpenAI with model: gpt-4o");
      
      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Use gpt-4o for vision capabilities
          messages: openAIMessages,
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (openAIResponse.ok) {
        const aiData = await openAIResponse.json();
        summary = aiData.choices[0].message.content;
        console.log("Generated summary:", summary);
      } else {
        const errorText = await openAIResponse.text();
        console.error("Error generating summary:", errorText);
        summary = "I couldn't generate a summary for this file. What would you like to know about it?";
      }
    } else {
      summary = `File "${fileName}" has been uploaded. What would you like to know about it?`;
    }

    // Save the user's message first
    const { data: userMessageData, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        content: `I've uploaded a file: ${fileName}. ${message || "Please analyze this file."}`,
        role: 'user'
      })
      .select('id')
      .single();

    if (userMessageError) {
      console.error("Error saving user message:", userMessageError);
    } else {
      userMessageId = userMessageData.id;
    }

    // Then save the AI's response
    const { data: aiMessageData, error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        content: summary,
        role: 'assistant'
      })
      .select('id, content, created_at')
      .single();

    if (aiMessageError) {
      console.error("Error saving AI message:", aiMessageError);
    } else {
      aiMessageId = aiMessageData.id;
      aiResponse = {
        id: aiMessageData.id,
        content: aiMessageData.content,
        role: 'assistant',
        created_at: aiMessageData.created_at
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        filePath, 
        fileName,
        fileType,
        publicUrl,
        summary,
        userMessageId,
        aiMessageId,
        aiResponse
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing file:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
