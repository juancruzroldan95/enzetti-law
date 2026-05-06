import { captureException } from "@services/sentry";
import type {
  TikTokUserAPIResponse,
  TikTokVideoAPIResponse,
  TikTokProfileDTO,
  TikTokPostDTO,
} from "@dto/tiktok";

export type { TikTokProfileDTO, TikTokPostDTO };

// --- Auth helpers ---

export const getTikTokAuthUrl = (state: string): string => {
  const clientKey = import.meta.env.TIKTOK_CLIENT_KEY;
  const redirectUri = import.meta.env.TIKTOK_REDIRECT_URI;
  const scope = "user.info.basic,user.info.profile,user.info.stats,video.list";

  if (!clientKey || !redirectUri) {
    throw new Error("TIKTOK_CLIENT_KEY or TIKTOK_REDIRECT_URI not set in environment variables");
  }

  const params = [
    `client_key=${clientKey}`,
    `scope=${scope}`,
    `response_type=code`,
    `redirect_uri=${encodeURIComponent(redirectUri)}`,
    `state=${state}`,
  ];

  return `https://www.tiktok.com/v2/auth/authorize/?${params.join("&")}`;
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
const refreshAccessToken = async (refreshToken: string): Promise<string> => {
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
    captureException(error, {
      tags: { service: "tiktok" },
      extra: { status: response.status, errorText },
    });
    throw error;
  }

  const data = await response.json();

  if (!data.access_token) {
    const error = new Error(`TikTok Refresh failed: ${JSON.stringify(data)}`);
    captureException(error, {
      tags: { service: "tiktok" },
      extra: { responseData: data },
    });
    throw error;
  }

  return data.access_token;
};

// --- Data fetching ---

export const getTikTokData = async (): Promise<TikTokProfileDTO | null> => {
  const refreshToken = import.meta.env.TIKTOK_REFRESH_TOKEN;

  if (!refreshToken) {
    console.log("No TikTok refresh token found");
    return null;
  }

  try {
    const accessToken = await refreshAccessToken(refreshToken);

    const userFields = "avatar_url,display_name,bio_description,follower_count,likes_count,video_count";
    const videoFields = "id,title,cover_image_url,embed_link,like_count,share_url,view_count";

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const [userRes, videoRes] = await Promise.all([
      fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${userFields}`, { headers }),
      fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${videoFields}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ max_count: 4 }),
      }),
    ]);

    if (!userRes.ok || !videoRes.ok) {
      const error = new Error(
        `TikTok API HTTP Error: user=${userRes.status}, video=${videoRes.status}`
      );
      captureException(error, {
        tags: { service: "tiktok" },
        extra: { userStatus: userRes.status, videoStatus: videoRes.status },
      });
      console.error("TikTok API HTTP Error:", { userStatus: userRes.status, videoStatus: videoRes.status });
      return null;
    }

    const [userData, videoData] = await Promise.all([
      userRes.json() as Promise<TikTokUserAPIResponse>,
      videoRes.json() as Promise<TikTokVideoAPIResponse>,
    ]);

    if (userData.error.code !== "ok" || videoData.error.code !== "ok") {
      const error = new Error(
        `TikTok API Logic Error: user=${userData.error.code}, video=${videoData.error.code}`
      );
      captureException(error, {
        tags: { service: "tiktok" },
        extra: { userError: userData.error, videoError: videoData.error },
      });
      console.error("TikTok API Logic Error:", userData.error, videoData.error);
      return null;
    }

    const user = userData.data.user;
    const videos = videoData.data.videos || [];

    return {
      username: user.display_name,
      followers: user.follower_count || 0,
      likes: user.likes_count || 0,
      videos: user.video_count || videos.length,
      profilePicture: user.avatar_url,
      bio: user.bio_description || "",
      recentPosts: videos.map((video) => ({
        id: video.id,
        image: video.cover_image_url,
        likes: video.like_count || 0,
        views: video.view_count || 0,
        title: video.title || "",
        permalink: video.share_url || video.embed_link,
      })),
    };
  } catch (error) {
    captureException(error, { tags: { service: "tiktok" } });
    console.error("Failed to fetch TikTok data:", error);
    return null;
  }
};
