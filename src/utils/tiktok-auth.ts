export const getTikTokAuthUrl = (state: string) => {
  const clientKey = import.meta.env.TIKTOK_CLIENT_KEY;
  const redirectUri = import.meta.env.TIKTOK_REDIRECT_URI;
  const scope = "user.info.basic,video.list";
  
  if (!clientKey || !redirectUri) {
    throw new Error("TIKTOK_CLIENT_KEY or TIKTOK_REDIRECT_URI not set in environment variables");
  }

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.append("client_key", clientKey);
  url.searchParams.append("scope", scope);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("state", state);

  return url.toString();
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
