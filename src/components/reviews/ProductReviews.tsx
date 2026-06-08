import React from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ProductReview } from "@/types/review";
import { ReviewModal } from "./ReviewModal";
import { useAuth } from "@/hooks/useAuth";

interface ProductReviewsProps {
  productId: string;
  reviews: ProductReview[];
  onReviewSubmitted?: () => void;
}

export function ProductReviews({ productId, reviews, onReviewSubmitted }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  
  // Calculate average rating and round to nearest half star
  const averageRating = reviews && reviews.length > 0
    ? Math.round((reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length) * 2) / 2
    : 0;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <StarRating 
              readOnly 
              initialRating={averageRating}
              size={20} 
              className="mb-1" 
            />
            <span className="text-sm text-gray-400">
              {reviews && reviews.length > 0 
                ? `${(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)} out of 5 (${reviews.length} reviews)` 
                : "No reviews yet"}
            </span>
          </div>
        </div>
        <Button 
          onClick={() => setReviewModalOpen(true)}
          className="mt-4 md:mt-0"
          disabled={!user}
        >
          Write a Review
        </Button>
      </div>

      {!reviews?.length ? (
        <div className="text-center py-8 border border-gray-800 rounded-lg">
          <p className="text-gray-400">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="border border-gray-800 rounded-lg p-4 bg-[#1E1E20]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.avatar_url || ""} />
                    <AvatarFallback>
                      {review.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{review.username || "Anonymous"}</h4>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <StarRating readOnly initialRating={review.rating} size={16} />
              </div>
              <p className="mt-4 text-gray-300">{review.review_text}</p>
            </div>
          ))}
        </div>
      )}

      <ReviewModal 
        productId={productId}
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        onReviewSubmitted={onReviewSubmitted}
      />
    </div>
  );
}
