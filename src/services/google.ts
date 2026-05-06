import { captureException } from "@services/sentry";
import type {
  GooglePlaceDetailsAPI,
  GoogleReviewsDTO,
  ReviewDTO,
} from "@dto/google";

export type { GoogleReviewsDTO, ReviewDTO };

export async function getGoogleReviews(): Promise<GoogleReviewsDTO | null> {
  const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = import.meta.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.warn("Google Places API Key or Place ID not found in environment variables");
    return null;
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=es`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "rating,userRatingCount,reviews.rating,reviews.text,reviews.originalText,reviews.authorAttribution,reviews.publishTime,reviews.relativePublishTimeDescription,googleMapsUri",
        },
      }
    );

    if (!response.ok) {
      const error = new Error(
        `Google Places API error: ${response.status} ${response.statusText}`
      );
      captureException(error, {
        tags: { service: "google" },
        extra: { status: response.status, statusText: response.statusText },
      });
      throw error;
    }

    const data: GooglePlaceDetailsAPI = await response.json();

    return {
      rating: data.rating,
      total_reviews: data.userRatingCount,
      reviews: (data.reviews || []).map((review) => ({
        id: review.publishTime,
        author: review.authorAttribution?.displayName || "Anónimo",
        rating: review.rating,
        text: review.text?.text || review.originalText?.text || "",
        date: review.relativePublishTimeDescription || "",
        avatar: review.authorAttribution?.photoUri || "",
        author_url: review.authorAttribution?.uri || "",
      })),
      url: data.googleMapsUri,
    };
  } catch (error) {
    captureException(error, { tags: { service: "google" } });
    console.error("Error fetching Google Reviews:", error);
    return null;
  }
}
