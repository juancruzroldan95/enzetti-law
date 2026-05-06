import * as Sentry from "@sentry/astro";
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
      const error = new Error(`Instagram token refresh failed: ${JSON.stringify(igData)}`);
      Sentry.captureException(error, { extra: { details: igData } });
      console.error("Instagram refresh failed:", igData);
      return new Response(
        JSON.stringify({ error: "Instagram token refresh failed", details: igData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    newToken = igData.access_token;
    console.log("Instagram token refreshed successfully. Expires in:", igData.expires_in, "seconds");
  } catch (err: any) {
    Sentry.captureException(err);
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
      const error = new Error(`Vercel env update failed: ${JSON.stringify(vercelData)}`);
      Sentry.captureException(error, { extra: { details: vercelData } });
      console.error("Vercel env update failed:", vercelData);
      return new Response(
        JSON.stringify({ error: "Vercel env update failed", details: vercelData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Vercel INSTAGRAM_ACCESS_TOKEN updated successfully");
  } catch (err: any) {
    Sentry.captureException(err);
    console.error("Error calling Vercel API:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Get the latest production deployment and redeploy to pick up the new env var
  try {
    const deploymentsRes = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&target=production&limit=1`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );
    const deploymentsData = await deploymentsRes.json();
    const latestDeployment = deploymentsData.deployments?.[0];
    const latestDeploymentId = latestDeployment?.uid;
    const projectName = latestDeployment?.name;

    if (!latestDeploymentId || !projectName) {
      const error = new Error("Could not find latest Vercel deployment to redeploy");
      Sentry.captureException(error, { extra: { deploymentsData } });
      console.error("Could not find latest deployment:", deploymentsData);
      return new Response(
        JSON.stringify({ error: "Could not find latest deployment to redeploy" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const redeployRes = await fetch(
      `https://api.vercel.com/v13/deployments?forceNew=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deploymentId: latestDeploymentId, name: projectName }),
      }
    );

    const redeployData = await redeployRes.json();

    if (!redeployRes.ok) {
      const error = new Error(`Vercel redeploy failed: ${JSON.stringify(redeployData)}`);
      Sentry.captureException(error, { extra: { details: redeployData } });
      console.error("Vercel redeploy failed:", redeployData);
      return new Response(
        JSON.stringify({ error: "Vercel redeploy failed", details: redeployData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Vercel redeploy triggered successfully:", redeployData.id);
  } catch (err: any) {
    Sentry.captureException(err);
    console.error("Error triggering Vercel redeploy:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, message: "Instagram token refreshed, Vercel env updated, and redeploy triggered" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
