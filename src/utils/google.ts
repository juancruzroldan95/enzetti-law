// Output DTOs (What our app uses)
export interface ReviewDTO {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string; // Relative time (e.g., "Hace 2 meses")
  avatar: string;
  author_url: string;
}

export interface GoogleReviewsDTO {
  rating: number;
  total_reviews: number;
  reviews: ReviewDTO[];
  url: string;
}

// API Response Interfaces (What Google sends)
interface GoogleReviewAPI {
  name: string;
  relativePublishTimeDescription?: string;
  rating: number;
  text?: {
    text: string;
    languageCode: string;
  };
  originalText?: {
    text: string;
    languageCode: string;
  };
  authorAttribution?: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
  publishTime: string;
}

interface GooglePlaceDetailsAPI {
  rating: number;
  userRatingCount: number;
  reviews: GoogleReviewAPI[];
  googleMapsUri: string;
}

export async function getGoogleReviews(): Promise<GoogleReviewsDTO | null> {
  const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = import.meta.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.warn(
      "Google Places API Key or Place ID not found in environment variables"
    );
    return null;
  }

  try {
    // New Places API (v1)
    // URL format: https://places.googleapis.com/v1/places/{PLACE_ID}
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
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data: GooglePlaceDetailsAPI = await response.json();

    return {
      rating: data.rating,
      total_reviews: data.userRatingCount,
      reviews: (data.reviews || []).map((review) => ({
        id: review.publishTime, // Use publish time string as ID
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
    console.error("Error fetching Google Reviews:", error);
    return null;
  }
}
