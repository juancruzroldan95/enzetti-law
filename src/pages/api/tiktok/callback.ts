import type { APIRoute } from "astro";
import { getTikTokAccessToken } from "@utils/tiktok-auth";

export const GET: APIRoute = async ({ request }) => {
  // Provide a base URL in case request.url is relative (common in some serverless environments)
  const url = new URL(request.url, "http://localhost");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  console.log("Raw Request URL:", request.url);
  console.log("Parsed Search Params:", Object.fromEntries(url.searchParams));
  console.log("TikTok Callback received:", { code, error });

  if (error) {
    console.error("TikTok Error:", error);
    return new Response(`Error from TikTok: ${error}`, { status: 400 });
  }

  if (!code) {
    console.error("No code provided");
    return new Response("No code provided", { status: 400 });
  }

  try {
    console.log("Exchanging code for token...");
    const data = await getTikTokAccessToken(code);
    console.log("Token exchange successful:", data);
    
    // Display the token to the user
    return new Response(
      `<html>
        <head><title>TikTok Token</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 2rem;">
          <h1>TikTok Access Token</h1>
          <p>Add this to your .env file as <code>TIKTOK_ACCESS_TOKEN</code></p>
          <pre style="background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto;">${data.access_token}</pre>
          <h3>Full Response:</h3>
          <pre style="background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
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
