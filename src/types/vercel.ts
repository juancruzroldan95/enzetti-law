export interface VercelAPIResponse {
  error?: { code?: string };
  deployments?: { uid: string; name: string }[];
  id?: string;
  readyState?: string;
}
