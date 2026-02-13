import type { APIRoute } from "astro";
import { getTikTokAccessToken } from "@utils/tiktok-auth";

export const GET: APIRoute = async ({ request, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const codeVerifier = cookies.get("tiktok_code_verifier")?.value;

  if (error) {
    return new Response(`Error from TikTok: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  if (!codeVerifier) {
    return new Response("No code verifier found in cookies. Please try logging in again.", { status: 400 });
  }

  try {
    const data = await getTikTokAccessToken(code, codeVerifier);
    
    // Clean up cookie
    cookies.delete("tiktok_code_verifier", { path: "/" });
    
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
    return new Response(`Error exchanging code: ${err.message}`, { status: 500 });
  }
};
