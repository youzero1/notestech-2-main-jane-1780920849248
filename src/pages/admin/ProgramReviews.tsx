import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { StarRating } from "@/components/ui/star-rating";

type Review = {
  id: string;
  user_id: string;
  program_id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  affiliate_programs: {
    name: string;
  };
};

const ProgramReviews = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('program_reviews')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          ),
          affiliate_programs:program_id (
            name
          )
        `)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data || []) as any);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error fetching reviews',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);

  const handleStatusUpdate = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('program_reviews')
        .update({ status: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: `Review ${newStatus} successfully`
      });
      
      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      toast({
        title: 'Error updating review status',
        variant: 'destructive'
      });
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  return (
    <DashboardLayout headerTitle="Program Reviews Management">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 border border-[#2A2A2A] rounded-full overflow-hidden w-fit">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-6 py-2.5 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-[#B69C6C] text-white"
                  : "text-gray-400 hover:bg-[#2A2A2A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Reviews Table */}
        <div className="rounded-lg border border-[#2A2A2A]">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Program</TableHead>
                <TableHead className="text-gray-400">Rating</TableHead>
                <TableHead className="text-gray-400">Comment</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
                {activeTab === 'pending' && (
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : currentReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    No {activeTab} reviews found
                  </TableCell>
                </TableRow>
              ) : (
                currentReviews.map((review) => (
                  <TableRow key={review.id} className="border-b border-[#2A2A2A] hover:bg-[#1C1C1C]">
                    <TableCell className="font-medium text-white">
                      {review.profiles?.first_name + " " + review.profiles?.last_name || 'Anonymous'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {review.affiliate_programs?.name}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <StarRating readOnly initialRating={review.rating} size={16} />
                    </TableCell>
                    <TableCell className="text-gray-300 max-w-md truncate">
                      {review.comment}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(review.created_at).toLocaleDateString()}
                    </TableCell>
                    {activeTab === 'pending' && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(review.id, 'approved')}
                            className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(review.id, 'rejected')}
                            className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && reviews.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A2A]">
              <div className="flex items-center text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, reviews.length)} from {reviews.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-[#2A2A2A] text-gray-500 cursor-not-allowed'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? 'bg-[#B69C6C] text-white'
                          : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-[#2A2A2A] text-gray-500 cursor-not-allowed'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgramReviews; 