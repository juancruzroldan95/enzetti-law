// Raw API Interfaces (What Google returns)
export interface GoogleReviewAPI {
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

export interface GooglePlaceDetailsAPI {
  rating: number;
  userRatingCount: number;
  reviews: GoogleReviewAPI[];
  googleMapsUri: string;
}

// UI DTOs (What our application uses)
export interface ReviewDTO {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  avatar: string;
  author_url: string;
}

export interface GoogleReviewsDTO {
  rating: number;
  total_reviews: number;
  reviews: ReviewDTO[];
  url: string;
}
