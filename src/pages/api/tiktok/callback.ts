import type { APIRoute } from "astro";
import { getTikTokAccessToken } from "@services/tiktok";

export const GET: APIRoute = async ({ request, cookies }) => {
  // Provide a base URL in case request.url is relative (common in some serverless environments)
  const url = new URL(request.url, "http://localhost");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  const storedState = cookies.get("tiktok_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    console.error("CSRF warning: state mismatch");
    return new Response("Invalid state parameter (CSRF)", { status: 400 });
  }

  if (error) {
    console.error("TikTok Error:", error);
    return new Response(`Error from TikTok: ${error}`, { status: 400 });
  }

  if (!code) {
    console.error("No code provided");
    return new Response("No code provided", { status: 400 });
  }

  try {
    const data = await getTikTokAccessToken(code);
    
    // Display a sanitized response to the user without exposing the raw token fully
    return new Response(
      `<html>
        <head><title>TikTok Token</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 2rem;">
          <h1>TikTok Access Token Generated</h1>
          <p>The token has been generated successfully. Please check your secure backend to retrieve it.</p>
          <p>Token preview: <code>${data.access_token.substring(0, 10)}...</code></p>
        </body>
      </html>`,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (err: any) {
    console.error("Error in callback:", err);
    return new Response(`Error exchanging code: ${err.message}`, { status: 500 });
  }
};
