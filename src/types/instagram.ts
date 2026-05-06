// Raw API Interfaces (What Instagram returns)
export interface InstagramUserAPI {
  biography: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url: string;
  username: string;
  id: string;
  name: string;
}

export interface InstagramMediaItemAPI {
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

export interface InstagramMediaAPI {
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
