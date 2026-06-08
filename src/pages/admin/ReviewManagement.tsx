
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ProductReview } from "@/types/review";
import { ReviewList } from "@/components/reviews/ReviewList";

// Review statuses as they are in the database enum
type ReviewStatus = 'pending' | 'approved' | 'rejected';

const ReviewManagement = () => {
  const [activeTab, setActiveTab] = useState<ReviewStatus>("pending");
  const [page, setPage] = useState(1);
  const limit = 10; // Number of reviews per page
  const queryClient = useQueryClient();

  // Fetch reviews based on status tab
  const { data, isLoading, error: reviewError } = useQuery({
    queryKey: ['product-reviews', activeTab, page],
    queryFn: async () => {
      try {
        console.log(`Fetching ${activeTab} reviews, page ${page}`);
        
        // Get the total count first
        const { count, error: countError } = await supabase
          .from('product_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('status', activeTab as ReviewStatus);
          
        if (countError) {
          console.error('Error counting reviews:', countError);
          throw countError;
        }

        // Use explicit casting to ensure status is treated as the correct enum type
        const { data, error } = await supabase
          .from('product_reviews')
          .select(`
            *,
            products ( name, main_image )
          `)
          .eq('status', activeTab as ReviewStatus)
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) {
          console.error('Error fetching reviews:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log(`No ${activeTab} reviews found`);
          return { 
            reviews: [] as ProductReview[],
            totalCount: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          };
        }

        console.log(`Retrieved ${data.length} ${activeTab} reviews:`, data);

        // For each review, get the user profile info separately
        const reviewsWithProfiles = await Promise.all(
          data.map(async (review) => {
            if (review.user_id) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', review.user_id)
                .maybeSingle();

              if (profileError) {
                console.error('Error fetching profile:', profileError);
                return {
                  ...review,
                  username: 'Anonymous',
                  avatar_url: null
                };
              }

              return {
                ...review,
                username: profileData?.username || 'Anonymous',
                avatar_url: profileData?.avatar_url || null
              };
            }

            return {
              ...review,
              username: 'Anonymous',
              avatar_url: null
            };
          })
        );

        return { 
          reviews: reviewsWithProfiles as ProductReview[],
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        };
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    }
  });

  const reviews = data?.reviews || [];
  const totalPages = data?.totalPages || 1;

  // Update review status mutation
  const updateReviewStatusMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string, status: ReviewStatus }) => {
      const { data, error } = await supabase
        .from('product_reviews')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reviewId)
        .select();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      toast({
        title: "Success",
        description: "Review status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating review status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update review status",
      });
    }
  });

  // Log when component mounts or activeTab changes
  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
    setPage(1); // Reset to first page when changing tabs
  }, [activeTab]);

  // Handle approval or rejection of a review
  const handleStatusUpdate = (reviewId: string, status: ReviewStatus) => {
    updateReviewStatusMutation.mutate({ reviewId, status });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // If there's an error fetching reviews, display it
  if (reviewError) {
    console.error('Review fetch error:', reviewError);
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-5">Review Management</h1>
          <div className="text-center py-10 border border-red-500 rounded-md">
            <p className="text-red-500">Error loading reviews: {reviewError instanceof Error ? reviewError.message : 'Unknown error'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-3xl font-bold">Review Management</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs defaultValue="pending" onValueChange={(value) => setActiveTab(value as ReviewStatus)}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
                <TabsTrigger value="approved">Approved Reviews</TabsTrigger>
                <TabsTrigger value="rejected">Rejected Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-0">
                <ReviewList 
                  reviews={reviews}
                  isLoading={isLoading}
                  activeTab={activeTab}
                  handleStatusUpdate={handleStatusUpdate}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </TabsContent>
              
              <TabsContent value="approved" className="mt-0">
                <ReviewList 
                  reviews={reviews}
                  isLoading={isLoading}
                  activeTab={activeTab}
                  handleStatusUpdate={handleStatusUpdate}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </TabsContent>
              
              <TabsContent value="rejected" className="mt-0">
                <ReviewList 
                  reviews={reviews}
                  isLoading={isLoading}
                  activeTab={activeTab}
                  handleStatusUpdate={handleStatusUpdate}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReviewManagement;
