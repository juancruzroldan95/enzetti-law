import type { APIRoute } from "astro";
import { getTikTokAuthUrl } from "@utils/tiktok-auth";

export const GET: APIRoute = async ({ redirect }) => {
  const state = Math.random().toString(36).substring(7);
  const url = getTikTokAuthUrl(state);
  return redirect(url);
};
