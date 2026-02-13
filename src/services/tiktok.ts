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

export const getTikTokData = async (): Promise<TikTokProfileDTO | null> => {
  const accessToken = import.meta.env.TIKTOK_ACCESS_TOKEN;

  // If no token, return null to hide the section
  if (!accessToken) {
    // console.warn("TikTok credentials not found.");
    return null;
  }

  try {
    // 1. Fetch User Info
    // Fields based on TikTok Display API v2
    const userFields = "avatar_url,display_name,bio_description,follower_count,likes_count,video_count";
    const userUrl = `https://open.tiktokapis.com/v2/user/info/?fields=${userFields}`;

    // 2. Fetch Recent Videos
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
      console.error(
        "TikTok API Error:",
        await userRes.text(),
        await videoRes.text()
      );
      return null;
    }

    const [userData, videoData] = await Promise.all([
      userRes.json() as Promise<TikTokUserAPIResponse>,
      videoRes.json() as Promise<TikTokVideoAPIResponse>,
    ]);

    if (userData.error.code !== "ok" || videoData.error.code !== "ok") {
       console.error(
        "TikTok API Logic Error:",
        userData.error,
        videoData.error
      );
      return null;
    }

    const user = userData.data.user;
    const videos = videoData.data.videos || [];

    // Map to DTO
    return {
      username: user.display_name,
      followers: user.follower_count || 0,
      likes: user.likes_count || 0,
      videos: user.video_count || videos.length,
      profile_picture: user.avatar_url,
      bio: user.bio_description,
      recent_posts: videos.map((video) => ({
        id: video.id,
        image: video.cover_image_url,
        likes: video.like_count || 0,
        title: video.title || "",
        permalink: video.share_url || video.embed_link,
      })),
    };

  } catch (error) {
    console.error("Failed to fetch TikTok data:", error);
    return null;
  }
};
