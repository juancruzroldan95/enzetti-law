import { captureException } from "@services/sentry";
import { getInstagramConfig } from "@services/instagram-token";
import type {
  InstagramUserAPI,
  InstagramMediaAPI,
  InstagramProfileDTO,
  InstagramPostDTO,
} from "@dto/instagram";

export type { InstagramProfileDTO, InstagramPostDTO };
export { refreshInstagramToken } from "@services/instagram-token";

export const getInstagramData = async (): Promise<InstagramProfileDTO | null> => {
  try {
    const { accessToken, userId: igUserId, graphUrl } = getInstagramConfig();
    if (!accessToken || !igUserId) {
      console.warn("Instagram credentials not found.");
      return null;
    }
    const userUrl = `${graphUrl}/${igUserId}?fields=biography,followers_count,follows_count,media_count,profile_picture_url,username,name`;
    const mediaUrl = `${graphUrl}/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp&limit=4`;
    const options = { headers: { Authorization: `Bearer ${accessToken}` } };

    const [userRes, mediaRes] = await Promise.all([fetch(userUrl, options), fetch(mediaUrl, options)]);

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
