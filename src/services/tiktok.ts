// Raw API Interfaces (What TikTok returns)
interface TikTokUserAPIResponse {
  data: {
    user: {
      avatar_url: string;
      display_name: string;
      bio_description: string;
      follower_count: number;
      likes_count: number;
      video_count: number;
      open_id: string; // fallback if needed
    };
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TikTokVideoItemAPI {
  id: string;
  title: string;
  cover_image_url: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_url: string;
  share_count: number;
  view_count: number;
}

interface TikTokVideoAPIResponse {
  data: {
    videos: TikTokVideoItemAPI[];
    cursor: number;
    has_more: boolean;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

// UI DTOs (What our application uses)
export interface TikTokPostDTO {
  id: string;
  image: string;
  likes: number;
  title: string;
  permalink: string;
}

export interface TikTokProfileDTO {
  username: string;
  followers: number;
  likes: number;
  videos: number;
  profile_picture: string;
  bio: string;
  recent_posts: TikTokPostDTO[];
}

import { refreshAccessToken } from "@utils/tiktok-auth";

export const getTikTokData = async (): Promise<TikTokProfileDTO | null> => {
  const refreshToken = import.meta.env.TIKTOK_REFRESH_TOKEN;

  // If no refresh token, return null to hide the section
  if (!refreshToken) {
    return null;
  }

  try {
    // Get a fresh access token using the refresh token
    const accessToken = await refreshAccessToken(refreshToken);

    // User Info fields (requires user.info.basic, user.info.profile, user.info.stats scopes)
    const userFields = "avatar_url,display_name,bio_description,follower_count,likes_count,video_count";
    const userUrl = `https://open.tiktokapis.com/v2/user/info/?fields=${userFields}`;

    // Recent Videos
    const videoFields = "id,title,cover_image_url,embed_link,like_count,share_url,view_count";
    const videoUrl = `https://open.tiktokapis.com/v2/video/list/?fields=${videoFields}`;

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };

    const [userRes, videoRes] = await Promise.all([
      fetch(userUrl, { headers }),
      fetch(videoUrl, { 
        method: "POST", 
        headers,
        body: JSON.stringify({ max_count: 4 }) 
      }),
    ]);

    if (!userRes.ok || !videoRes.ok) {
      console.error("TikTok API HTTP Error:", {
        userStatus: userRes.status,
        videoStatus: videoRes.status,
      });
      return null;
    }

    const [userData, videoData] = await Promise.all([
      userRes.json() as Promise<TikTokUserAPIResponse>,
      videoRes.json() as Promise<TikTokVideoAPIResponse>,
    ]);

    console.log("TikTok User Data:", JSON.stringify(userData, null, 2));
    console.log("TikTok Video Data:", JSON.stringify(videoData, null, 2));

    if (userData.error.code !== "ok" || videoData.error.code !== "ok") {
      console.error("TikTok API Logic Error:", userData.error, videoData.error);
      return null;
    }

    const user = userData.data.user;
    const videos = videoData.data.videos || [];

    // Map to DTO
    const result: TikTokProfileDTO = {
      username: user.display_name,
      followers: user.follower_count || 0,
      likes: user.likes_count || 0,
      videos: user.video_count || videos.length,
      profile_picture: user.avatar_url,
      bio: user.bio_description || "",
      recent_posts: videos.map((video) => ({
        id: video.id,
        image: video.cover_image_url,
        likes: video.like_count || 0,
        title: video.title || "",
        permalink: video.share_url || video.embed_link,
      })),
    };

    console.log("TikTok DTO Result:", JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error("Failed to fetch TikTok data:", error);
    return null;
  }
};
