'use client';

import { RatingForm } from "./RatingForm";

interface ReviewSectionProps {
  cookId: string;
  hasUserReviewed: boolean;
  isLoggedIn: boolean;
}

export function ReviewSection({ cookId, hasUserReviewed, isLoggedIn }: ReviewSectionProps) {
  if (!isLoggedIn || hasUserReviewed) {
    return null;
  }

  return (
    <RatingForm 
      cookId={cookId} 
      onSubmit={() => {
        // Force a revalidation of the page data
        window.location.reload();
      }}
    />
  );
} 