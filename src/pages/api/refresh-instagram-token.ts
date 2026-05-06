import type { APIRoute } from "astro";
import { captureException } from "@services/sentry";
import { refreshInstagramToken } from "@services/instagram";
import { updateEnvVar, redeployLatestProduction } from "@services/vercel";

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const envId = import.meta.env.VERCEL_INSTAGRAM_ENV_ID;
  if (!envId) {
    return new Response("Missing VERCEL_INSTAGRAM_ENV_ID", { status: 500 });
  }

  // Step 1: Refresh the Instagram long-lived token
  let newToken: string;
  try {
    newToken = await refreshInstagramToken();
    console.log("Instagram token refreshed successfully");
  } catch (err: any) {
    captureException(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Update the token in Vercel
  try {
    await updateEnvVar(envId, newToken);
    console.log("Vercel INSTAGRAM_ACCESS_TOKEN updated successfully");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Redeploy to pick up the new token
  try {
    await redeployLatestProduction();
    console.log("Vercel redeploy triggered successfully");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Instagram token refreshed, Vercel env updated, and redeploy triggered",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
