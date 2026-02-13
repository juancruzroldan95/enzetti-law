import type { APIRoute } from "astro";
import { getTikTokAuthUrl, generateCodeVerifier, generateCodeChallenge } from "@utils/tiktok-auth";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const state = Math.random().toString(36).substring(7);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Store the verifier in a cookie to retrieve it in the callback
  cookies.set("tiktok_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD, // secure in prod
    maxAge: 60 * 10, // 10 minutes
  });

  const url = getTikTokAuthUrl(state, codeChallenge);
  return redirect(url);
};
