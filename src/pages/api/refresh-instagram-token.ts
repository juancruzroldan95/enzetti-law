import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const currentToken = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const vercelToken = import.meta.env.VERCEL_TOKEN;
  const projectId = import.meta.env.VERCEL_PROJECT_ID;
  const envId = import.meta.env.VERCEL_INSTAGRAM_ENV_ID;
  const appId = import.meta.env.META_APP_ID;
  const appSecret = import.meta.env.META_APP_SECRET;

  if (!currentToken || !vercelToken || !projectId || !envId || !appId || !appSecret) {
    return new Response("Missing required environment variables", { status: 500 });
  }

  // Step 1: Refresh the long-lived token via Facebook OAuth (fb_exchange_token)
  let newToken: string;
  try {
    const igRes = await fetch(
      `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`
    );
    const igData = await igRes.json();

    if (!igRes.ok || !igData.access_token) {
      console.error("Instagram refresh failed:", igData);
      return new Response(
        JSON.stringify({ error: "Instagram token refresh failed", details: igData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    newToken = igData.access_token;
    console.log("Instagram token refreshed successfully. Expires in:", igData.expires_in, "seconds");
  } catch (err: any) {
    console.error("Error calling Instagram API:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Update the token in Vercel
  try {
    const vercelRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env/${envId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: newToken }),
      }
    );

    const vercelData = await vercelRes.json();

    if (!vercelRes.ok) {
      console.error("Vercel env update failed:", vercelData);
      return new Response(
        JSON.stringify({ error: "Vercel env update failed", details: vercelData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Vercel INSTAGRAM_ACCESS_TOKEN updated successfully");
  } catch (err: any) {
    console.error("Error calling Vercel API:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, message: "Instagram token refreshed and updated in Vercel" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
