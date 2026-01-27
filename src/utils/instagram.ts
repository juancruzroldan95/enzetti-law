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
  profile_picture: string;
  bio: string;
  recent_posts: InstagramPostDTO[];
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
      console.error(
        "Instagram API Error:",
        await userRes.text(),
        await mediaRes.text()
      );
      return null;
    }

    const userData: InstagramUserAPI = await userRes.json();
    const mediaData: InstagramMediaAPI = await mediaRes.json();

    // Map to DTO
    return {
      name: userData.name,
      username: userData.username,
      followers: userData.followers_count,
      following: userData.follows_count,
      posts: userData.media_count,
      bio: userData.biography, 
      profile_picture: userData.profile_picture_url,
      recent_posts: mediaData.data.map((post) => ({
        id: post.id,
        image: post.media_type === "VIDEO" && post.thumbnail_url ? post.thumbnail_url : post.media_url,
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        caption: post.caption || "",
        permalink: post.permalink,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch Instagram data:", error);
    return null;
  }
};
