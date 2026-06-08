
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import nodemailer from "npm:nodemailer"; // Import Nodemailer

// Supabase setup
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",  // e.g., smtp.gmail.com
  port: 587, // Use 465 for SSL, 587 for TLS
  secure: false, // Use `false` for STARTTLS, `true` for SSL
  auth: {
    user: "3e85c3b9e9ed3c", // Your email address
    pass: "0395e6b45597b3", // Your email password or app password
  },
  logger: true,  // Enable debugging logs
  debug: true    // Enable debug output
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Function called with method:", req.method);
  console.log("Request headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

  try {
    // First try to get the raw body for debugging
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);
    
    // Check if the request body is empty
    if (!rawBody || rawBody.trim() === '') {
      console.error("Empty request body received");
      return new Response(
        JSON.stringify({ error: "Empty request body", status: "error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to parse the JSON from the raw body
    let data;
    try {
      // Try to parse the raw body first
      data = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse raw body as JSON:", parseError);
      
      // If JSON parsing fails, check if it's already an object (might have been auto-parsed)
      if (typeof rawBody === 'object' && rawBody !== null) {
        console.log("Body appears to already be parsed as an object");
        data = rawBody;
      } else {
        return new Response(
          JSON.stringify({ 
            error: "Invalid JSON in request body", 
            details: parseError.message, 
            status: "error"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Extract newsletterId from the data object
    let newsletterId;
    if (data.newsletterId) {
      newsletterId = data.newsletterId;
    } else if (data.body && data.body.newsletterId) {
      // Try to access nested body property (sometimes happens with invoke)
      newsletterId = data.body.newsletterId;
    } else {
      console.error("Missing required field: newsletterId in data:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: "Newsletter ID is required", 
          receivedData: JSON.stringify(data),
          status: "error" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing newsletter ID:", newsletterId);

    // Fetch the newsletter content
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      console.error("Error fetching newsletter:", newsletterError);
      return new Response(
        JSON.stringify({ error: "Newsletter not found", details: newsletterError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found newsletter:", newsletter.title);

    // Fetch all subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('*');

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscribers", details: subscribersError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers found");
      return new Response(
        JSON.stringify({ message: "No subscribers to send to", status: "success" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscribers.length} subscribers to send to`);

    // Send emails to each subscriber
    const successfulSends = [];
    const failedSends = [];

    for (const subscriber of subscribers) {
      console.log(`Sending email to subscriber: ${subscriber.email}`);
      
      try {
        const mailOptions = {
          from: 'no.reply@notes.com', // Sender info
          to: subscriber.email, // Recipient
          subject: newsletter.title, // Newsletter title as subject
          html: `
            <h2>${newsletter.title}</h2>
            <p>${newsletter.content}</p>
            <p>Thank you for subscribing!</p>
          `, // Newsletter content as email body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${subscriber.email}. MessageId: ${info.messageId}`);
        successfulSends.push(subscriber.email);
      } catch (emailError) {
        console.error(`Error sending email to ${subscriber.email}:`, emailError);
        failedSends.push({email: subscriber.email, error: emailError.message});
        // Continue with other subscribers even if one fails
      }
    }

    // Mark newsletter as published
    if (newsletter.status !== 'published') {
      const { error: updateError } = await supabase
        .from('newsletters')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', newsletterId);
        
      if (updateError) {
        console.error("Error updating newsletter status:", updateError);
      } else {
        console.log("Newsletter marked as published");
      }
    }

    // Build response based on the results
    const response = {
      message: `Newsletter emails sent successfully to ${successfulSends.length} subscribers`,
      subscriberCount: subscribers.length,
      successCount: successfulSends.length,
      failCount: failedSends.length,
      status: "success"
    };

    if (failedSends.length > 0) {
      response.failedEmails = failedSends;
    }

    console.log("Function completed successfully", response);
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error processing request:", error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        status: "error",
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
