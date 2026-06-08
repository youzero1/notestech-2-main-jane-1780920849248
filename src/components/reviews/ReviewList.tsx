import React from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ProductReview } from "@/types/review";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReviewListProps {
  reviews: ProductReview[];
  isLoading: boolean;
  activeTab: string;
  handleStatusUpdate: (reviewId: string, status: 'approved' | 'rejected') => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ReviewList({
  reviews,
  isLoading,
  activeTab,
  handleStatusUpdate,
  page,
  totalPages,
  onPageChange,
}: ReviewListProps) {
  // Function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    const statusStyles = {
      pending: "bg-yellow-500/10 text-yellow-500",
      approved: "bg-green-500/10 text-green-500",
      rejected: "bg-red-500/10 text-red-500"
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="text-center py-10 border border-gray-800 rounded-md">
        <p className="text-muted-foreground">No {activeTab} reviews found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px]">Product</TableHead>
              <TableHead className="w-[180px]">Reviewer</TableHead>
              <TableHead className="w-[100px]">Rating</TableHead>
              <TableHead className="w-[300px]">Review</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id} className="hover:bg-gray-900/30">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {review.products?.main_image && (
                      <img
                        src={review.products.main_image}
                        alt={review.products?.name || "Product"}
                        className="w-10 h-10 rounded-md object-cover"
                      />
                    )}
                    <span className="line-clamp-2">{review.products?.name || "Unknown Product"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={review.avatar_url || ""} />
                      <AvatarFallback>
                        {review.username?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{review.username || "Anonymous"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StarRating readOnly initialRating={review.rating} size={16} />
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {truncateText(review.review_text, 100)}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <p className="text-sm">{review.review_text}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell>
                  {renderStatusBadge(review.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {activeTab !== 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-500"
                        onClick={() => handleStatusUpdate(review.id, 'approved')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {activeTab !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                        onClick={() => handleStatusUpdate(review.id, 'rejected')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-gray-400">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
