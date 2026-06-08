
import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  initialRating?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}

const StarRating = ({
  initialRating = 0,
  onChange,
  readOnly = false,
  size = 20,
  className,
}: StarRatingProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSetRating = (newRating: number) => {
    if (readOnly) return;
    setRating(newRating);
    onChange?.(newRating);
  };

  return (
    <div className={cn("flex items-center", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "cursor-pointer transition-colors",
            {
              "fill-yellow-400 text-yellow-400": 
                (hoverRating ? hoverRating >= star : rating >= star),
              "text-gray-300": 
                (hoverRating ? hoverRating < star : rating < star),
              "cursor-default": readOnly
            }
          )}
          size={size}
          onClick={() => handleSetRating(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
        />
      ))}
    </div>
  );
};

export { StarRating };
