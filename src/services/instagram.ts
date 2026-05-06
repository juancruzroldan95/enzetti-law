import { captureException } from "@services/sentry";
import type {
  InstagramUserAPI,
  InstagramMediaAPI,
  InstagramProfileDTO,
  InstagramPostDTO,
} from "@dto/instagram";

export type { InstagramProfileDTO, InstagramPostDTO };

export const getInstagramData = async (): Promise<InstagramProfileDTO | null> => {
  const accessToken = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = import.meta.env.INSTAGRAM_USER_ID;

  if (!accessToken || !igUserId) {
    console.warn("Instagram credentials not found.");
    return null;
  }

  try {
    const userUrl = `https://graph.facebook.com/v18.0/${igUserId}?fields=biography,followers_count,follows_count,media_count,profile_picture_url,username,name&access_token=${accessToken}`;
    const mediaUrl = `https://graph.facebook.com/v18.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp&limit=4&access_token=${accessToken}`;

    const [userRes, mediaRes] = await Promise.all([fetch(userUrl), fetch(mediaUrl)]);

    if (!userRes.ok || !mediaRes.ok) {
      const error = new Error(
        `Instagram API HTTP Error: user=${userRes.status}, media=${mediaRes.status}`
      );
      captureException(error, {
        tags: { service: "instagram" },
        extra: { userStatus: userRes.status, mediaStatus: mediaRes.status },
      });
      console.error("Instagram API Error:", userRes.status, mediaRes.status);
      return null;
    }

    const [userData, mediaData] = await Promise.all([
      userRes.json() as Promise<InstagramUserAPI>,
      mediaRes.json() as Promise<InstagramMediaAPI>,
    ]);

    return {
      name: userData.name,
      username: userData.username,
      followers: userData.followers_count,
      following: userData.follows_count,
      posts: userData.media_count,
      bio: userData.biography,
      profilePicture: userData.profile_picture_url,
      recentPosts: mediaData.data.map((post) => ({
        id: post.id,
        image: post.media_type === "VIDEO" && post.thumbnail_url ? post.thumbnail_url : post.media_url,
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        caption: post.caption || "",
        permalink: post.permalink,
      })),
    };
  } catch (error) {
    captureException(error, { tags: { service: "instagram" } });
    console.error("Failed to fetch Instagram data:", error);
    return null;
  }
};

export const refreshInstagramToken = async (): Promise<string> => {
  const currentToken = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const appId = import.meta.env.META_APP_ID;
  const appSecret = import.meta.env.META_APP_SECRET;

  if (!currentToken || !appId || !appSecret) {
    throw new Error("Missing Instagram token refresh credentials in environment variables");
  }

  const res = await fetch(
    `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`
  );
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    const error = new Error(`Instagram token refresh failed: ${JSON.stringify(data)}`);
    captureException(error, { tags: { service: "instagram" }, extra: { details: data } });
    throw error;
  }

  return data.access_token;
};
