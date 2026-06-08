import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { StarRating } from "@/components/ui/star-rating";
import { AlertCircle } from "lucide-react";

interface Review {
  id: string;
  user_id: string;
  program_id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const MoneyProgram = () => {
  const { programId:id } = useParams();
  const {user}=useAuth();
  const [programData, setProgramData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Cards");
  const [selectedCardTab, setSelectedCardTab] = useState("Card Details");
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProgramData = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('affiliate_programs')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          navigate('/money');
          return;
        }

        // Check if user has already clicked this program
        const { data: existingMlmRecord, error: existingError } = await supabase
          .from('affiliated_mlm')
          .select('*')
          .match({ 
            user_id: user.id,
            program_id: id 
          })
          .maybeSingle();

        if (!existingMlmRecord && !existingError) {
          // Only update click count if this is a new click
          const { error: updateError } = await supabase
            .from('affiliate_programs')
            .update({ click_rate: ((parseInt(data.click_rate as string) || 0) + 1).toString() })
            .eq('id', id);

          if (updateError) {
            console.error('Error updating clicks:', updateError);
          }

          // Create new affiliated_mlm record
          const { error: mlmError } = await supabase
            .from('affiliated_mlm')
            .insert([
              {
                user_id: user.id,
                program_id: id,
                clicked: true,
                applied: false,
                category: data.category,
                commission: data.commission
              }
            ]);

          if (mlmError) {
            console.error('Error creating MLM record:', mlmError);
          }
        }

        setProgramData(data);
        if (data.category) {
          const categoryMap: Record<string, string> = {
             "loan":"Loans",
             "card":"Credit Cards",
            "shop": "Shop Bazaar" // Make sure this matches your database category
          };
          setSelectedTab(categoryMap[data.category]);
        }
      } catch (error) {
        console.error('Error fetching program:', error);
        navigate('/money');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [id]);

  const fetchReviews = async () => {
    try {
      // Fetch only approved reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('program_reviews')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('program_id', id)
        .eq('status', 'approved');

      if (reviewsError) throw reviewsError;

      // Fetch user's review if exists (including pending)
      const { data: userReviewData, error: userReviewError } = await supabase
        .from('program_reviews')
        .select('*')
        .eq('program_id', id)
        .eq('user_id', user.id)
        .single();

      if (userReviewError && userReviewError.code !== 'PGRST116') {
        throw userReviewError;
      }

      setReviews((reviewsData || []) as Review[]);
      setUserReview((userReviewData || null) as Review | null);
      if (userReviewData) {
        setRating(userReviewData.rating);
        setComment(userReviewData.comment);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#1C1C1F] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleApply = async () => {
    setIsApplying(true);
    try {
      // Update affiliated_mlm record
      const { error: mlmError } = await supabase
        .from('affiliated_mlm')
        .update({ applied: true })
        .match({ 
          user_id: user.id,
          program_id: id 
        });

      if (mlmError) {
        console.error('Error updating MLM record:', mlmError);
      }

      // Open program link in new tab
      if (programData?.program_link) {
        window.open(programData.program_link, '_blank');
      }

    } catch (error) {
      console.error('Error handling apply:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating || !comment.trim()) {
      toast({
        title: "Error",
        description: "Please provide both rating and comment",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        user_id: user.id,
        program_id: id,
        rating,
        comment,
        status: 'pending'
      };

      const { error } = await supabase
        .from('program_reviews')
        .upsert([reviewData], {
          onConflict: 'user_id,program_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your review has been submitted for approval"
      });
      
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderCardContent = () => {
    return (
      <div className="text-white max-w-[1200px] mx-auto relative">
        {/* Centered Card Details/Reviews tabs */}
        <div className="grid grid-cols-2 mb-8">
          <div className="relative">
            <div className="flex justify-center">
              <button
                className={`pb-4 px-1 relative capitalize ${
                  selectedCardTab === "Card Details" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setSelectedCardTab("Card Details")}
              >
                {programData?.category} Details
              </button>
            </div>
            {selectedCardTab === "Card Details" && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#B69C6C]"></div>
            )}
          </div>
          <div className="relative">
            <div className="flex justify-center">
              <button
                className={`pb-4 px-1 relative ${
                  selectedCardTab === "Reviews" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setSelectedCardTab("Reviews")}
              >
                Reviews
              </button>
            </div>
            {selectedCardTab === "Reviews" && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#B69C6C]"></div>
            )}
          </div>
        </div>

        {selectedCardTab === "Card Details" ? (
          <>
            {/* Single card with divider for Rewards Rate and Annual Fee */}
            <div className="border border-[#2C2C30] rounded-lg p-6 mb-12">
              <div className="flex relative">
                <div className="flex-1 pr-8">
                  <h3 className="text-xs uppercase tracking-wider text-white mb-4">REWARDS RATE</h3>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">{programData?.benefits}</p>
                    {/* <p className="text-sm text-gray-400">Cash Back</p> */}
                  </div>
                </div>
                {/* Updated divider to extend through padding */}
                <div className="absolute top-[-24px] bottom-[-24px] left-1/2 w-px bg-[#2C2C30] -translate-x-1/2"></div>
                <div className="flex-1 pl-8">
                  <h3 className="text-xs uppercase tracking-wider text-white mb-4">ANNUAL FEE</h3>
                  <p className="text-base text-gray-400">{programData?.annual_fee}</p>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-2 gap-16">
              <div>
                <h3 className="text-lg font-medium mb-6">Additional rates & fees</h3>
                <div className="space-y-4">
                  {[
                    { label: "Annual Fee", value: programData?.annual_fee || "N/A" },
                    { label: "Intro purchase APR", value: programData?.intro_purchase_apr || "N/A" },
                    { label: "Regular purchase APR", value: programData?.regular_purchase_apr || "N/A" },
                    { label: "Intro Balance Transfer APR", value: programData?.intro_balance_transfer_apr || "N/A" },
                    { label: "Regular Balance Transfer APR", value: programData?.regular_balance_transfer_apr || "N/A" },
                    { label: "Cash Advance APR", value: programData?.cash_advance_apr || "N/A" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-3 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">{item.label}</span>
                      <span className="text-sm text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
                {/* Apply button in first column */}
                <div className="mt-16">
                  <button 
                    className="bg-[#B69C6C] font-medium py-1 px-28 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>
             {programData?.category === "card" && <div>
                <h3 className="text-lg font-medium mb-6">Card details</h3>
                <div className="space-y-4 text-md text-gray-300 [&>ul]:list-disc [&>ul]:pl-4" dangerouslySetInnerHTML={{ __html: programData?.card_details || "" }} />
              </div>}
            </div>
          </>
        ) : (
          renderReviewsContent()
        )}
      </div>
    );
  };

  const renderShopContent = () => {
    return (
      <div className="text-white max-w-[1200px] mx-auto relative">
        {/* Centered Product Details/Reviews tabs */}
        <div className="grid grid-cols-2 mb-8">
          <div className="relative">
            <div className="flex justify-center">
              <button
                className={`pb-4 px-1 relative capitalize ${
                  selectedCardTab === "Card Details" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setSelectedCardTab("Card Details")}
              >
                Product Details
              </button>
            </div>
            {selectedCardTab === "Card Details" && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#B69C6C]"></div>
            )}
          </div>
          <div className="relative">
            <div className="flex justify-center">
              <button
                className={`pb-4 px-1 relative ${
                  selectedCardTab === "Reviews" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setSelectedCardTab("Reviews")}
              >
                Reviews
              </button>
            </div>
            {selectedCardTab === "Reviews" && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#B69C6C]"></div>
            )}
          </div>
        </div>

        {selectedCardTab === "Card Details" ? (
          <>
            {/* Product Image and Price Section */}
            <div className="border border-[#2C2C30] rounded-lg p-6 mb-12">
              <div className="flex relative">
                <div className="flex-1 pr-8">
                  <div className="aspect-square max-w-[300px] rounded-lg overflow-hidden mb-4">
                    {programData?.product_image ? (
                      <img 
                        src={programData.product_image} 
                        alt={programData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                  </div>
                  <p className="text-base text-gray-400">{programData?.name}</p>
                </div>
                {/* Vertical divider */}
                <div className="absolute top-[-24px] bottom-[-24px] left-1/2 w-px bg-[#2C2C30] -translate-x-1/2"></div>
                <div className="flex-1 pl-8">
                  <h3 className="text-xs uppercase tracking-wider text-white mb-4">PRICE</h3>
                  <p className="text-3xl font-bold text-white">${programData?.total_amount}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Earn ${programData?.commission} cashback on purchase
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-2 gap-16">
              <div>
                <h3 className="text-lg font-medium mb-6">Product Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400 text-sm">Benefits</span>
                    <span className="text-sm text-right">{programData?.benefits}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400 text-sm">Cashback</span>
                    <span className="text-sm text-right">${programData?.commission}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400 text-sm">Price</span>
                    <span className="text-sm text-right">${programData?.total_amount}</span>
                  </div>
                </div>
                {/* Buy Now button */}
                <div className="mt-16">
                  <button 
                    className="bg-[#B69C6C] font-medium py-1 px-28 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-6">Product Details</h3>
                <div className="space-y-4 text-md text-gray-300">
                  <p>{programData?.benefits}</p>
                  <ul className="list-disc pl-4">
                    <li>Fast shipping available</li>
                    <li>Secure payment</li>
                    <li>Quality guaranteed</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          renderReviewsContent()
        )}
      </div>
    );
  };

  const renderReviewsContent = () => {
    return (
      <div className="space-y-8">
        {/* Review Summary */}
        <div className="bg-[#1C1C1C] rounded-lg p-6">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                  : 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <StarRating
                  readOnly
                  initialRating={reviews.length > 0 
                    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
                    : 0}
                  size={16}
                />
                <span className="text-gray-400">({reviews.length} reviews)</span>
              </div>
            </div>
            
            <div className="h-16 w-px bg-[#2C2C30]"></div>
            
            {/* Rating Distribution */}
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter(r => r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={star} className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm text-gray-400">{star}</span>
                      <StarRating readOnly initialRating={star} size={12} />
                    </div>
                    <div className="flex-1 h-2 bg-[#2C2C30] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#B69C6C]" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-400 w-12">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Write Review Section */}
        {!userReview ? (
          <div className="bg-[#1C1C1C] rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Rating</label>
                <StarRating
                  initialRating={rating}
                  onChange={(value) => setRating(value)}
                  size={24}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-[#2A2A2A] border border-[#3A3A3A] rounded-md p-3 text-white"
                  rows={4}
                  placeholder="Share your experience..."
                />
              </div>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="bg-[#B69C6C] text-white px-6 py-2 rounded-md disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        ) : userReview.status === 'pending' && (
          <div className="bg-[#1C1C1C] rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Your Review</h3>
            <div className="space-y-2">
              <StarRating readOnly initialRating={userReview.rating} size={20} />
              <p className="text-gray-400">{userReview.comment}</p>
              <p className="text-sm text-gray-500">
                Status: {userReview.status === 'pending' ? 'Pending Approval' : userReview.status}
              </p>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Customer Reviews</h3>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-[#1C1C1C] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating readOnly initialRating={review.rating} size={16} />
                  <span className="text-gray-400">
                    by {review["profiles"]?.first_name + " " + review["profiles"]?.last_name || 'Anonymous'}
                  </span>
                </div>
                <p className="text-gray-300">{review.comment}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No reviews yet</p>
          )}
        </div>
      </div>
    );
  };

  const renderLoanContent = () => {
    return (
      <div className="text-white max-w-[1200px] mx-auto relative">
        <p className="text-lg font-medium mb-4">Offer Details</p>
        <div className="mb-8">
          <p className="text-[#B69C6C] text-sm mb-8">Advertiser disclosure</p>
          
          {/* Company header section */}
          <div className="flex items-center gap-4 mb-8  ">
            <img 
              src={programData?.logo || ""} 
              alt={programData?.name}
              className="h-10"
            />
            <div className="flex items-center gap-2">
              <StarRating readOnly initialRating={5} size={16} />
              <span className="text-gray-400 text-sm">
                {programData?.reviews_count || 0}
              </span>
            </div>
          </div>

          {/* Loan details grid */}
          <div className="grid grid-cols-2 gap-8 mb-8 relative">
            {/* Center divider line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#2C2C30] -translate-x-1/2"></div>
            
            <div className="text-center">
              <div className="text-3xl font-medium mb-1">
                {programData?.estimated_apr || "0"}%
              </div>
              <div className="text-gray-400 text-sm">Est. APR</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-medium mb-1">
                ${programData?.per_month || "0"}
              </div>
              <div className="text-gray-400 text-sm">
                For {programData?.total_months || "0"} mo*
              </div>
            </div>
          </div>

          {/* Horizontal divider */}
          <div className="w-full h-px bg-[#2C2C30] mb-8"></div>

          {/* Loan amount and fees */}
          <div className="grid grid-cols-2 gap-8 mb-8 relative">
            {/* Center divider line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#2C2C30] -translate-x-1/2"></div>
            <div className="text-center">
              <div className="text-2xl font-medium mb-1">
                ${programData?.total_amount || "0"}
              </div>
              <div className="text-gray-400 text-sm">Loan amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium mb-1">
                ${programData?.interest_and_fees || "0"}
              </div>
              <div className="text-gray-400 text-sm">Interest & fees Est.*</div>
            </div>
          </div>

          {/* Notes Guarantee */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <img src="/money/loan.png" alt="Notes Guarantee" className="w-5 h-5" />
          <span className="text-white">Notes Guarantee:</span>
            You'll be approved or Notes will pay you $50. Terms apply.
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </div>

          {/* Take offer button */}
          <button 
            onClick={handleApply}
            disabled={isApplying}
            className="w-full bg-[#B69C6C] text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {isApplying ? 'Processing...' : 'Take offer'}
          </button>
          <div className="mt-8 bg-[#1E1E20] border border- [#2C2C30] rounded-lg p-10">

          {/* About section */}
          <div className="">
            <h2 className="text-xl font-medium mb-4">About {programData?.name}</h2>
            <div className="space-y-4 text-md text-gray-300 [&>ul]:list-disc [&>ul]:pl-4" dangerouslySetInnerHTML={{ __html: programData?.loan_details || "" }} />
          </div>

          {/* Features tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {programData?.loan_tags?.length > 0 && programData?.loan_tags?.map((feature) => (
              <span 
                key={feature}
                className="bg-[#161617] border border-[#2C2C30] text-gray-400 text-sm px-3 py-1 rounded-lg capitalize"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Legal text */}
          <p className="mt-8 text-md leading-relaxed">{programData?.loan_origination || ""}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedTab === "Credit Cards") {
      return (
        <div className="p-8">
          {renderCardContent()}
        </div>
      );
    } else if (selectedTab === "Loans") {
      return (
        <div className="p-8">
          {renderLoanContent()}
        </div>
      );
    }  else if (selectedTab === "Shop Bazaar") {
      return (
        <div className="p-8">
          {renderShopContent()}
        </div>
      );
    } else if (selectedTab === "Reviews") {
      return (
        <div className="p-8">
          {renderReviewsContent()}
        </div>
      );
    }
    return <div>Content for {selectedTab}</div>;
  };

  return (
    <DashboardLayout
      showLink={true}
      redirectionLink="/money"
      linkText="Back"
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default MoneyProgram;

