import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

console.log("Starting email service...");

// SMTP Configuration
const client = new SMTPClient({
  connection: {
    hostname: "sandbox.smtp.mailtrap.io",
    port: 587,
    tls: true,
    auth: {
      username: "3e85c3b9e9ed3c",
      password: "0395e6b45597b3",
    },
  },
});

console.log("SMTP client configured");

serve(async (req) => {
  console.log("Received request:", req.method);
  console.log("Request URL:", req.url);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { email, token, frontendUrl } = body;
    console.log("Extracted data:", { email, token: token?.substring(0, 8) + "...", frontendUrl });

    if (!email || !token) {
      console.log("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Email and verification token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = frontendUrl || new URL(req.url).origin.replace("functions.", "");
    console.log("Base URL for verification link:", baseUrl);

    const verificationUrl = `${baseUrl}/verify-subscription?token=${token}`;
    console.log("Complete verification URL:", verificationUrl);

    console.log("Attempting to send email...");
    // Send email using SMTPClient
    await client.send({
      from: "Notes Newsletter <newsletter@yourdomain.com>",
      to: email,
      subject: "Confirm Your Newsletter Subscription",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Confirm Your Newsletter Subscription</h2>
          <p>Thank you for subscribing! To complete your subscription, please confirm your email address by clicking the link below:</p>
          <p style="margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #987D4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm Subscription</a>
          </p>
          <p>If you didn't request this subscription, you can safely ignore this email.</p>
          <p>This link will expire in 48 hours.</p>
        </div>
      `,
    });

    console.log("Email sent successfully!");

    return new Response(
      JSON.stringify({ 
        message: "Verification email sent successfully",
        debug: {
          email,
          baseUrl,
          verificationUrl: verificationUrl.replace(token, "TOKEN_HIDDEN")
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Detailed error information:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: {
          name: error.name,
          stack: error.stack
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
