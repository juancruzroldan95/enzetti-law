import { captureException, logger, type LogAttributes } from "@services/sentry";
import type { VercelAPIResponse } from "@dto/vercel";

const vercelToken = () => process.env.VERCEL_TOKEN || import.meta.env.VERCEL_TOKEN;
const projectId = () => process.env.VERCEL_PROJECT_ID || import.meta.env.VERCEL_PROJECT_ID;

async function vercelRequest(
  operation: string,
  url: string,
  options: RequestInit,
  context: LogAttributes
): Promise<VercelAPIResponse> {
  const startedAt = Date.now();
  const attributes = { ...context, operation };
  logger.info("vercel.request.started", attributes);
  try {
    const res = await fetch(url, options);
    logger.info("vercel.response.received", {
      ...attributes, http_status: res.status, duration_ms: Date.now() - startedAt,
    });
    // Never forward response bodies, request URLs, headers, or env values to telemetry.
    const data: VercelAPIResponse = await res.json();
    if (!res.ok) {
      const code = data?.error?.code;
      const errorCode = typeof code === "string" && /^[a-zA-Z0-9_.-]{1,100}$/.test(code)
        ? code : "unknown";
      logger.error("vercel.request.rejected", { ...attributes, http_status: res.status, error_code: errorCode });
      throw new Error(`Vercel ${operation} failed: HTTP ${res.status} (${errorCode})`);
    }
    return data;
  } catch (cause: unknown) {
    logger.error("vercel.request.failed", {
      ...attributes, duration_ms: Date.now() - startedAt,
      error_type: cause instanceof Error ? cause.name : "UnknownError",
    });
    // Native fetch/JSON errors may include request or response fragments.
    const error = new Error(`Vercel ${operation} request failed`);
    captureException(error, { tags: { service: "instagram-cron", operation }, extra: attributes });
    throw error;
  }
}

export async function updateEnvVar(envId: string, value: string, context: LogAttributes = {}): Promise<void> {
  await vercelRequest("update_environment", `https://api.vercel.com/v9/projects/${projectId()}/env/${envId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${vercelToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  }, context);
}

export async function redeployLatestProduction(context: LogAttributes = {}): Promise<void> {
  const deploymentsData = await vercelRequest(
    "lookup_deployment",
    `https://api.vercel.com/v6/deployments?projectId=${projectId()}&target=production&limit=1`,
    { headers: { Authorization: `Bearer ${vercelToken()}` } },
    context
  );
  const latestDeployment = deploymentsData.deployments?.[0];
  if (!latestDeployment?.uid || !latestDeployment?.name) {
    logger.error("vercel.deployment.not_found", context);
    throw new Error("Could not find latest Vercel deployment to redeploy");
  }

  logger.info("vercel.deployment.selected", { ...context, source_deployment_id: latestDeployment.uid });
  const redeployData = await vercelRequest("create_deployment", "https://api.vercel.com/v13/deployments?forceNew=1", {
    method: "POST",
    headers: { Authorization: `Bearer ${vercelToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ deploymentId: latestDeployment.uid, name: latestDeployment.name, target: "production" }),
  }, context);

  if (!redeployData.id) {
    logger.error("vercel.deployment.missing_id", context);
    throw new Error("Vercel redeploy response did not include a deployment ID");
  }
  logger.info("vercel.deployment.accepted", {
    ...context, deployment_id: redeployData.id, deployment_state: redeployData.readyState ?? "unknown",
  });
}
