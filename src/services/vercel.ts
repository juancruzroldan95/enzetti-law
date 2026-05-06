import { captureException } from "@services/sentry";

const vercelToken = () => import.meta.env.VERCEL_TOKEN;
const projectId = () => import.meta.env.VERCEL_PROJECT_ID;

export async function updateEnvVar(envId: string, value: string): Promise<void> {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId()}/env/${envId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${vercelToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(`Vercel env update failed: ${JSON.stringify(data)}`);
    captureException(error, { extra: { details: data } });
    throw error;
  }
}

export async function redeployLatestProduction(): Promise<void> {
  const deploymentsRes = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${projectId()}&target=production&limit=1`,
    { headers: { Authorization: `Bearer ${vercelToken()}` } }
  );

  const deploymentsData = await deploymentsRes.json();
  const latestDeployment = deploymentsData.deployments?.[0];

  if (!latestDeployment?.uid || !latestDeployment?.name) {
    const error = new Error("Could not find latest Vercel deployment to redeploy");
    captureException(error, { extra: { deploymentsData } });
    throw error;
  }

  const redeployRes = await fetch(`https://api.vercel.com/v13/deployments?forceNew=1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deploymentId: latestDeployment.uid,
      name: latestDeployment.name,
    }),
  });

  const redeployData = await redeployRes.json();

  if (!redeployRes.ok) {
    const error = new Error(`Vercel redeploy failed: ${JSON.stringify(redeployData)}`);
    captureException(error, { extra: { details: redeployData } });
    throw error;
  }
}
