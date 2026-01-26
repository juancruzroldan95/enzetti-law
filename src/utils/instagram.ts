export interface InstagramPost {
  id: string;
  image: string;
  likes: number;
  comments: number;
  caption: string;
  permalink: string;
}

export interface InstagramProfile {
  username: string;
  followers: number;
  following: number;
  posts: number;
  profile_picture: string;
  bio: string;
  recent_posts: InstagramPost[];
}

// Fallback data in case of API failure or missing credentials
const FALLBACK_DATA: InstagramProfile = {
  username: "abogadosart_",
  followers: 6937,
  following: 234,
  posts: 587,
  profile_picture:
    "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=150&h=150&fit=crop",
  bio: "Estudio Jurídico Enzetti - Especialistas en Accidentes de Trabajo",
  recent_posts: [
    {
      id: "1",
      image:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=400&fit=crop",
      likes: 234,
      comments: 12,
      caption: "¿Tuviste un accidente de trabajo? Nosotros te ayudamos",
      permalink: "https://www.instagram.com/abogadosart_/",
    },
    {
      id: "2",
      image:
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&h=400&fit=crop",
      likes: 189,
      comments: 8,
      caption: "Más de 30 años defendiendo tus derechos",
      permalink: "https://www.instagram.com/abogadosart_/",
    },
    {
      id: "3",
      image:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=400&fit=crop",
      likes: 312,
      comments: 15,
      caption: "Consultá sin cargo. Te asesoramos",
      permalink: "https://www.instagram.com/abogadosart_/",
    },
    {
      id: "4",
      image:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=400&fit=crop",
      likes: 276,
      comments: 19,
      caption: "Cobrá la indemnización que te corresponde",
      permalink: "https://www.instagram.com/abogadosart_/",
    },
  ],
};

export const getInstagramData = async (): Promise<InstagramProfile> => {
  const accessToken = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = import.meta.env.INSTAGRAM_USER_ID;

  if (!accessToken || !igUserId) {
    console.warn("Instagram credentials not found. Using fallback data.");
    return FALLBACK_DATA;
  }

  try {
    // 1. Fetch User Info
    // Fields: biography, followers_count, follows_count, media_count, profile_picture_url, username
    const userUrl = `https://graph.facebook.com/v18.0/${igUserId}?fields=biography,followers_count,follows_count,media_count,profile_picture_url,username&access_token=${accessToken}`;
    
    // 2. Fetch Recent Media
    // Fields: id, caption, media_type, media_url, thumbnail_url, permalink, like_count, comments_count, timestamp
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
      return FALLBACK_DATA;
    }

    const userData = await userRes.json();
    const mediaData = await mediaRes.json();

    return {
      username: userData.username,
      followers: userData.followers_count,
      following: userData.follows_count,
      posts: userData.media_count,
      bio: userData.biography,
      // Note: profile_picture_url is signed and expires after some time. 
      // It's recommended to proxy it or update it regularly.
      profile_picture: userData.profile_picture_url || FALLBACK_DATA.profile_picture, 
      recent_posts: mediaData.data.map((post: any) => ({
        id: post.id,
        // For VIDEO media, use thumbnail_url. For IMAGE/CAROUSEL_ALBUM, use media_url.
        image: post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url,
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        caption: post.caption || "",
        permalink: post.permalink,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch Instagram data:", error);
    return FALLBACK_DATA;
  }
};
