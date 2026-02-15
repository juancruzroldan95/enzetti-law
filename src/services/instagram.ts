import * as Sentry from "@sentry/astro";

// Raw API Interfaces (What Instagram returns)
interface InstagramUserAPI {
  biography: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url: string;
  username: string;
  id: string;
  name: string;
}

interface InstagramMediaItemAPI {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  timestamp: string;
}

interface InstagramMediaAPI {
  data: InstagramMediaItemAPI[];
}

// UI DTOs (What our application uses)
export interface InstagramPostDTO {
  id: string;
  image: string;
  likes: number;
  comments: number;
  caption: string;
  permalink: string;
}

export interface InstagramProfileDTO {
  name: string;
  username: string;
  followers: number;
  following: number;
  posts: number;
  profilePicture: string;
  bio: string;
  recentPosts: InstagramPostDTO[];
}

export const getInstagramData = async (): Promise<InstagramProfileDTO | null> => {
  const accessToken = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = import.meta.env.INSTAGRAM_USER_ID;

  if (!accessToken || !igUserId) {
    console.warn("Instagram credentials not found.");
    return null;
  }

  try {
    // 1. Fetch User Info
    const userUrl = `https://graph.facebook.com/v18.0/${igUserId}?fields=biography,followers_count,follows_count,media_count,profile_picture_url,username,name&access_token=${accessToken}`;
    
    // 2. Fetch Recent Media
    const mediaUrl = `https://graph.facebook.com/v18.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp&limit=4&access_token=${accessToken}`;

    const [userRes, mediaRes] = await Promise.all([
      fetch(userUrl),
      fetch(mediaUrl),
    ]);

    if (!userRes.ok || !mediaRes.ok) {
      const error = new Error(
        `Instagram API HTTP Error: user=${userRes.status}, media=${mediaRes.status}`
      );
      Sentry.captureException(error, {
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

    // Map to DTO
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
    Sentry.captureException(error, {
      tags: { service: "instagram" },
    });
    console.error("Failed to fetch Instagram data:", error);
    return null;
  }
};
