import type {
  FacebookTokenDebugAPI,
  InstagramTokenRefreshResult,
  InstagramTokenResponseAPI,
} from "@dto/instagram";

export function getInstagramConfig() {
  const mode = process.env.INSTAGRAM_AUTH_MODE || import.meta.env.INSTAGRAM_AUTH_MODE || "facebook";
  if (mode !== "facebook" && mode !== "instagram") {
    throw new Error("INSTAGRAM_AUTH_MODE must be facebook or instagram");
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID || import.meta.env.INSTAGRAM_USER_ID;
  const version = process.env.INSTAGRAM_GRAPH_API_VERSION || import.meta.env.INSTAGRAM_GRAPH_API_VERSION || "v22.0";
  if (!/^v\d+\.0$/.test(version)) {
    throw new Error("Invalid INSTAGRAM_GRAPH_API_VERSION");
  }

  return {
    mode,
    accessToken,
    userId: mode === "instagram" ? "me" : userId,
    graphUrl: `https://graph.${mode === "instagram" ? "instagram" : "facebook"}.com/${version}`,
  };
}

// Do not include response bodies or request URLs in errors: they can contain tokens.
async function readResponse<T>(response: Response, operation: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${operation} failed: HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function inspectFacebookToken(token: string, appId: string, appSecret: string) {
  const url = new URL("https://graph.facebook.com/debug_token");
  url.searchParams.set("input_token", token);
  const data = await readResponse<FacebookTokenDebugAPI>(
    await fetch(url, { headers: { Authorization: `Bearer ${appId}|${appSecret}` } }),
    "Facebook token validation",
  );
  if (!data.data?.is_valid || data.data.app_id !== appId ||
      !Number.isFinite(data.data.expires_at) || data.data.expires_at <= Date.now() / 1000) {
    throw new Error("Facebook token is invalid, expired, or cannot be renewed by this cron. Use Instagram Login.");
  }
  return data.data.expires_at;
}

export async function refreshInstagramToken(): Promise<InstagramTokenRefreshResult> {
  const config = getInstagramConfig();
  if (!config.accessToken || !config.userId) {
    throw new Error("Missing Instagram credentials");
  }

  let result: InstagramTokenRefreshResult;
  if (config.mode === "instagram") {
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", config.accessToken);
    const data = await readResponse<InstagramTokenResponseAPI>(await fetch(url), "Instagram token renewal");
    // Instagram's refresh operation returns a new 60-day lifetime. Reject short-lived
    // or incomplete responses before overwriting the working token in Vercel.
    if (!data.access_token || !Number.isFinite(data.expires_in) ||
        typeof data.expires_in !== "number" || data.expires_in < 30 * 24 * 60 * 60) {
      throw new Error("Instagram renewal did not return a long-lived token");
    }
    result = {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  } else {
    const appId = process.env.META_APP_ID || import.meta.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET || import.meta.env.META_APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error("Missing Meta app credentials");
    }

    const previousExpiry = await inspectFacebookToken(config.accessToken, appId, appSecret);
    const url = new URL("https://graph.facebook.com/oauth/access_token");
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", config.accessToken);
    const data = await readResponse<InstagramTokenResponseAPI>(await fetch(url), "Facebook token exchange");
    if (!data.access_token) {
      throw new Error("Facebook token exchange returned no access token");
    }
    const expiresAt = await inspectFacebookToken(data.access_token, appId, appSecret);
    if (expiresAt <= previousExpiry) {
      throw new Error("Facebook token exchange did not extend expiration. Configure INSTAGRAM_AUTH_MODE=instagram with an Instagram Login token.");
    }
    result = {
      accessToken: data.access_token,
      expiresIn: Math.floor(expiresAt - Date.now() / 1000),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  }

  // Check access to the configured profile before persisting the renewed token.
  const profile = new URL(`${config.graphUrl}/${config.userId}`);
  profile.searchParams.set("fields", "id,username");
  const account = await readResponse<{ id?: string; username?: string }>(
    await fetch(profile, { headers: { Authorization: `Bearer ${result.accessToken}` } }),
    "Renewed Instagram token verification",
  );
  if (!account.id || !account.username) {
    throw new Error("Renewed token cannot read the Instagram profile");
  }
  return result;
}
