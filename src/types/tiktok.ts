// Raw API Interfaces (What TikTok returns)
export interface TikTokUserAPIResponse {
  data: {
    user: {
      avatar_url: string;
      display_name: string;
      bio_description: string;
      follower_count: number;
      likes_count: number;
      video_count: number;
      open_id: string;
    };
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokVideoItemAPI {
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

export interface TikTokVideoAPIResponse {
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
  views: number;
  title: string;
  permalink: string;
}

export interface TikTokProfileDTO {
  username: string;
  followers: number;
  likes: number;
  videos: number;
  profilePicture: string;
  bio: string;
  recentPosts: TikTokPostDTO[];
}
