import * as Sentry from "@sentry/astro";

export const getTikTokAuthUrl = (state: string) => {
  const clientKey = import.meta.env.TIKTOK_CLIENT_KEY;
  const redirectUri = import.meta.env.TIKTOK_REDIRECT_URI;
  const scope = "user.info.basic,user.info.profile,user.info.stats,video.list";
  
  if (!clientKey || !redirectUri) {
    throw new Error("TIKTOK_CLIENT_KEY or TIKTOK_REDIRECT_URI not set in environment variables");
  }

  const rootUrl = "https://www.tiktok.com/v2/auth/authorize/";
  
  // Manually construct params to control encoding perfectly
  const params = [
    `client_key=${clientKey}`,
    `scope=${scope}`, // TikTok often prefers commas not encoded in the initial request or handled specifically
    `response_type=code`,
    `redirect_uri=${encodeURIComponent(redirectUri)}`,
    `state=${state}`
  ];

  return `${rootUrl}?${params.join("&")}`;
};

export const getTikTokAccessToken = async (code: string) => {
  const clientKey = import.meta.env.TIKTOK_CLIENT_KEY;
  const clientSecret = import.meta.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = import.meta.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error("TikTok credentials not set in environment variables");
  }

  const params = new URLSearchParams();
  params.append("client_key", clientKey);
  params.append("client_secret", clientSecret);
  params.append("code", code);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", redirectUri);

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TikTok API Error: ${errorText}`);
  }

  return response.json();
};

/**
 * Exchanges a refresh token for a fresh access token.
 * Used by getTikTokData() on every ISR cache miss (~once/day).
 * The refresh token itself is valid for 365 days from initial issuance.
 */
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const clientKey = import.meta.env.TIKTOK_CLIENT_KEY;
  const clientSecret = import.meta.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error("TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET not set in environment variables");
  }

  const params = new URLSearchParams();
  params.append("client_key", clientKey);
  params.append("client_secret", clientSecret);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`TikTok Refresh Token Error: ${errorText}`);
    Sentry.captureException(error, {
      tags: { service: "tiktok-auth" },
      extra: { status: response.status, errorText },
    });
    throw error;
  }

  const data = await response.json();
  
  if (!data.access_token) {
    const error = new Error(`TikTok Refresh failed: ${JSON.stringify(data)}`);
    Sentry.captureException(error, {
      tags: { service: "tiktok-auth" },
      extra: { responseData: data },
    });
    throw error;
  }

  return data.access_token;
};
