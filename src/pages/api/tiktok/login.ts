import type { APIRoute } from "astro";
import { getTikTokAuthUrl } from "@services/tiktok";

export const GET: APIRoute = async ({ redirect, cookies }) => {
  const state = Math.random().toString(36).substring(7);

  cookies.set("tiktok_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    maxAge: 60 * 10, // 10 minutes
  });

  const url = getTikTokAuthUrl(state);
  return redirect(url);
};
