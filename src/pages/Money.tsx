import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StarRating } from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarFront, CircleAlert, DollarSign, Home, Loader2, Search } from "lucide-react";

type ProgramWithReviews = {
  id: string;
  name: string;
  benefits: string;
  commission: number;
  category: string;
  program_link: string | null;
  annual_fee: string | null;
  total_amount: number | null;
  reviews_count: number;
  average_rating: number;
};

const Money = () => {
  const [selectedTab, setSelectedTab] = useState("Cards");
  const [creditCards, setCreditCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const [shopProducts, setShopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState<"personal_loan" | "home_loan" | "auto_loan" | "all">("personal_loan");
  const navigate = useNavigate();

  // Add fetch functions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if(selectedTab === "Cards"){
        // Fetch credit cards with reviews
        const { data: cardData, error: cardError } = await supabase
          .from('affiliate_programs')
          .select(`
            *,
            reviews:program_reviews(
              id,
              rating,
              status
            )
          `)
          .eq('category', 'card');

        if (cardError) throw cardError;
        
        // Process card data with review stats
        const processedCardData = (cardData || []).map(card => ({
          ...card,
          reviews_count: (card.reviews || []).filter((r: any) => r.status === 'approved').length,
          average_rating: calculateAverageRating(card.reviews?.filter((r: any) => r.status === 'approved'))
        }));
        setCreditCards(processedCardData);
      } else if(selectedTab === "Loans") {
        // Fetch loans with reviews and loan_type filter
        const query = supabase
        .from('affiliate_programs')
        .select(`
          *,
          reviews:program_reviews(
            id,
            rating,
            status
          )
        `)
        .eq('category', 'loan');
        if(selectedLoanType !== "all"){
          query.eq('loan_type', selectedLoanType);
        }
        const { data: loanData, error: loanError } = await query;

        if (loanError) throw loanError;
        
        const processedLoanData = (loanData || []).map(loan => ({
          ...loan,
          reviews_count: (loan.reviews || []).filter((r: any) => r.status === 'approved').length,
          average_rating: calculateAverageRating(loan.reviews?.filter((r: any) => r.status === 'approved'))
        }));
        setLoans(processedLoanData);
      } else if(selectedTab === "Shop Bazaar"){

        // Fetch shop products with reviews
        const { data: shopData, error: shopError } = await supabase
          .from('affiliate_programs')
          .select(`
            *,
            reviews:program_reviews(
              id,
              rating,
              status
            )
          `)
          .eq('category', 'shop');

        if (shopError) throw shopError;
        
        // Process shop data with review stats
        const processedShopData = (shopData || []).map(product => ({
          ...product,
          reviews_count: (product.reviews || []).filter((r: any) => r.status === 'approved').length,
          average_rating: calculateAverageRating(product.reviews?.filter((r: any) => r.status === 'approved'))
        }));
        setShopProducts(processedShopData);
      }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTab, selectedLoanType]);

  // Add this helper function at the top of your component
  const calculateAverageRating = (reviews: any[] = []) => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  };

  const renderCardsContent = () => {
    return (
      <div className="p-3 sm:p-6">
        <h2 className="text-xl text-white mb-4">Offers curated just for you</h2>
        <ul className="text-gray-300 mb-6 text-sm sm:text-base">
          <li>• Based on our 636 credit score.</li>
          <li>• $19,150 total credit limit.</li>
          <li>• $19,150 total credit limit.</li>
        </ul>

        {creditCards.length === 0 ? (
          <div className="text-center text-gray-400">No credit card offers available at the moment.</div>
        ) : (
          creditCards.map((card, index) => (
            <div key={index} className="bg-[#1C1C1C] rounded-lg p-4 sm:p-6 mb-4">
              <div className="flex flex-col lg:flex-row gap-6 relative">
                <div className="w-full sm:w-[280px] mx-auto lg:mx-0">
                  <div className="bg-black rounded-xl p-4 sm:p-6 aspect-[1.586/1] relative">
                    {/* Chip and Card Number Row */}
                    <div className="flex items-center justify-between">
                      <img 
                        src="/money/card-chip.png" 
                        alt="Card chip" 
                        className="w-10 h-10 object-contain"
                      />
                      <div className="text-white font-mono text-sm whitespace-nowrap">
                        4242 4242 4242 4242
                      </div>
                    </div>
                    
                    {/* Bottom Logos */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex justify-between items-center">
                        {/* Notes Logo */}
                        <img 
                          src="/money/card-logo.png" 
                          alt="Notes Logo" 
                          className="h-5 object-contain"
                        />
                        <img 
                          src="/money/mastercard.png" 
                          alt="Mastercard" 
                          className="h-5 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-white mt-2 text-center lg:text-left">{card?.name}</p>
                </div>
                
                <div className="flex-1 flex flex-col justify-between lg:px-6">
                  <div className="text-center lg:text-left">
                    <p className="text-gray-300">Great for high flat-rate rewards</p>
                    <h3 className="text-xl text-white mb-2">{card?.name}</h3>
                    <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                      <StarRating 
                        readOnly 
                        initialRating={card.average_rating}
                        size={20}
                        className="gap-2"
                      />
                      <span className="text-gray-300 text-sm">
                        {card.reviews_count} {card.reviews_count === 1 ? 'Review' : 'Reviews'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/money/${card.id}`)} 
                    className="bg-[#B69C62] text-white px-6 py-2 rounded-md w-full lg:hidden"
                  >
                    Apply
                  </button>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block absolute right-[300px] top-[-24px] bottom-[-24px] w-px bg-[#2C2C30]"></div>

                <div className="w-full lg:w-[280px] flex flex-col justify-between">
                  <div className="text-center lg:text-left">
                    <h4 className="text-white font-bold mb-2">Benefits:</h4>
                    <ul className="text-gray-300 space-y-1 px-2">
                      <li>• Rewards rate: {card.benefits}</li>
                      <li>• Annual fee: {card.annual_fee}</li>
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-4 mt-4">
                    <button 
                      onClick={() => navigate(`/money/${card.id}`)} 
                      className="hidden lg:block bg-[#B69C62] text-white px-6 py-2 rounded-md w-full"
                    >
                      Apply
                    </button>
                    <button 
                      onClick={() => navigate(`/money/${card.id}`)} 
                      className="bg-transparent border border-[#2C2C30] text-white px-6 py-2 rounded-md w-full"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderLoansContent = () => {
    const loanCategories = [
      { type: "personal_loan", icon: DollarSign, label: "Personal loan" },
      { type: "home_loan", icon: Home, label: "Home" },
      { type: "auto_loan", icon: CarFront, label: "Auto" },
      { type: "all", icon: Search, label: "See all" }
    ];

    // Helper function to get label from loan type
    const getLoanCategoryLabel = (loanType: string) => {
      const category = loanCategories.find(cat => cat.type === loanType);
      return category ? category.label : "Loan";
    };

    return (
      <div className="px-2 xs:px-3 sm:px-4 md:px-6 py-2 xs:py-3 sm:py-4">
        <h2 className="text-sm xs:text-base sm:text-lg text-white mb-2 sm:mb-3">Find a loan</h2>
        
        {/* Loan Category Icons - Reduced vertical spacing */}
        <div className="grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-4 mb-2 xs:mb-3 sm:mb-4 w-full">
          {loanCategories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedLoanType === category.type;
            
            return (
              <div key={category.type} className="flex flex-col items-center gap-0.5 sm:gap-1">
                <button 
                  onClick={() => setSelectedLoanType(category.type as any)}
                  className={`w-[40px] h-[40px] xs:w-[50px] xs:h-[50px] sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#B69C62]' : 'bg-[#1C1C1C] hover:bg-[#2C2C2C]'
                  }`}
                >
                  <Icon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                </button>
                <span className="text-[8px] xs:text-[9px] sm:text-xs text-white text-center leading-tight">{category.label}</span>
              </div>
            );
          })}
        </div>

        {/* Browse by goal - Compact version */}
        <div className="mb-2 xs:mb-3 sm:mb-4 w-full">
          <h3 className="text-[10px] xs:text-xs sm:text-sm text-white mb-1 sm:mb-2">Browse by goal</h3>
          <div className="relative w-full sm:w-3/4">
            <select className="w-full bg-[#1C1C1C] text-white text-[10px] xs:text-xs sm:text-sm p-1.5 xs:p-2 sm:p-3 rounded-lg appearance-none border border-[#2C2C30]">
              <option>Access cash</option>
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Eligibility Info - More compact */}
        <div className="mb-2 xs:mb-3 sm:mb-4 w-full">
          <p className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400 mb-1 sm:mb-2">
            Offer eligibility & Notes Guarantee payout criteria:
          </p>
          <div className="flex overflow-x-auto gap-1 xs:gap-1.5 sm:gap-2 no-scrollbar pb-1 w-full">
            <span className="flex-shrink-0 border border-[#2C2C30] px-1 xs:px-1.5 sm:px-2 py-0.5 rounded text-white text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap">
              $ Income: $150,000
            </span>
            <span className="flex-shrink-0 border border-[#2C2C30] px-1 xs:px-1.5 sm:px-2 py-0.5 rounded text-white text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap">
              Housing: $1,000
            </span>
            <span className="flex-shrink-0 border border-[#2C2C30] px-1 xs:px-1.5 sm:px-2 py-0.5 rounded text-white text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap">
              Loan purpose: Debt Consolidation
            </span>
          </div>
        </div>

        {/* Loan Amount - More compact */}
        <div className="mb-2 xs:mb-3 sm:mb-4 w-full">
          <p className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1 flex items-center">
            Advertiser Disclosure 
            <CircleAlert className="ml-1 w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
          </p>
          <p className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">
            Based on your credit and past partnerships
          </p>
          <p className="text-[10px] xs:text-xs sm:text-sm text-white">
            You can borrow up to <span className="text-[#B69C62] underline">$35,000</span>
          </p>
        </div>

        {/* Available Offers */}
        <div className="w-full">
          <h3 className="text-[10px] xs:text-xs sm:text-sm text-white mb-1.5 xs:mb-2 sm:mb-3">Available Offers</h3>
          
          <div className="space-y-2 w-full">
            {loans.map((loan, index) => (
              <div key={index} className="rounded-lg p-0.5 w-full border border-[#2C2C30]">
                <div className="rounded-lg px-2 py-1 border-b border-[#2C2C30]">
                  <h3 className="text-white text-[9px] xs:text-[10px] sm:text-xs text-center">
                    {getLoanCategoryLabel(loan.loan_type)}
                  </h3>
                </div>
                <div className="rounded-b-lg p-1.5 xs:p-2 sm:p-3">
                  {/* Tags */}
                  <div className="mb-1.5 flex flex-wrap gap-1">
                    {loan?.tag_type?.length > 0 && loan?.tag_type?.map((tagType, index) => (
                      <span key={index} className="bg-[#D2913A] text-[8px] xs:text-[9px] sm:text-xs px-1 py-0.5 rounded text-black capitalize">
                        {tagType.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  {/* Loan Details Grid */}
                  <div className="grid grid-cols-3 gap-1 xs:gap-1.5 sm:gap-2 mb-1.5 xs:mb-2 sm:mb-3">
                    <div>
                      <div className="text-[10px] xs:text-xs sm:text-sm text-white font-medium">
                        ${loan.per_month || 0}/mo
                      </div>
                      <div className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400">
                        For {loan.total_months || 0} mo*
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] xs:text-xs sm:text-sm text-white font-medium">
                        ${loan?.interest_and_fees || 0}
                      </div>
                      <div className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400">
                        Interest & fees*
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] xs:text-xs sm:text-sm text-white font-medium">
                        ${loan?.total_amount || 0}
                      </div>
                      <div className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400">
                        Loan amount
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 xs:gap-1.5 sm:gap-2">
                    <button 
                      onClick={() => navigate(`/money/${loan?.id}`)}
                      className="flex-1 bg-[#B69C62] text-white text-[9px] xs:text-[10px] sm:text-xs px-1.5 xs:px-2 sm:px-3 py-1 rounded"
                    >
                      Take offer
                    </button>
                    <button 
                      onClick={() => navigate(`/money/${loan?.id}`)}
                      className="flex-1 text-gray-400 text-[9px] xs:text-[10px] sm:text-xs border border-[#2C2C30] px-1.5 xs:px-2 sm:px-3 py-1 rounded"
                    >
                      See details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderShopContent = () => {
    return (
      <div className="p-3 sm:p-6">
        <h2 className="text-xl text-white mb-4">Shop Bazaar Products</h2>
        <ul className="text-gray-300 mb-6 text-sm sm:text-base">
          <li>• Exclusive deals and offers</li>
          <li>• Quality products with great discounts</li>
          <li>• Fast shipping available</li>
        </ul>

        {shopProducts.length === 0 ? (
          <div className="text-center text-gray-400">No shop products available at the moment.</div>
        ) : (
          shopProducts.map((product, index) => (
            <div key={index} className="bg-[#1C1C1C] rounded-lg p-4 sm:p-6 mb-4">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative">
                <div className="w-full sm:w-[280px] mx-auto lg:mx-0">
                  <div className="bg-transparent rounded-xl p-2 aspect-[1.586/1] relative overflow-hidden">
                    {product.product_image ? (
                      <img 
                        src={product.product_image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white mt-2 text-center lg:text-left text-sm sm:text-base">{product.name}</p>
                </div>
                
                <div className="flex-1 flex flex-col justify-between lg:px-6">
                  <div className="text-center lg:text-left">
                    <p className="text-gray-300 text-sm sm:text-base">Featured Product</p>
                    <h3 className="text-lg sm:text-xl text-white mb-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                      <div className="flex">
                        <StarRating 
                          readOnly 
                          initialRating={product.average_rating}
                          size={20}
                          className="gap-2"
                        />
                      </div>
                      <span className="text-gray-300 text-sm">
                        {product.reviews_count} {product.reviews_count === 1 ? 'Review' : 'Reviews'}
                      </span>
                    </div>
                    <div className="text-2xl text-white font-bold mb-4">
                      ${product.total_amount}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/money/${product.id}`)} 
                    className="w-full sm:w-auto bg-[#B69C62] text-white px-4 sm:px-6 py-2 rounded-md mt-4 sm:mt-0"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Product details section */}
                <div className="w-full lg:w-[280px] flex flex-col justify-between mt-4 lg:mt-0">
                  <div className="text-center lg:text-left">
                    <h4 className="text-white font-bold mb-2 text-sm sm:text-base">Product Details:</h4>
                    <ul className="text-gray-300 space-y-1 px-2 text-sm">
                      <li>• {product.benefits}</li>
                      <li>• Fast shipping available</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => navigate(`/money/${product.id}`)} 
                    className="w-full bg-transparent border border-[#2C2C30] text-white px-4 sm:px-6 py-2 rounded-md mt-4"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderNotesPassportContent = () => {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-3 sm:p-6">
        <div className="flex flex-col items-center w-full max-w-[600px] mx-auto">
          <div className="w-full bg-[#1C1C1C] rounded-lg px-4 sm:px-8 py-6 sm:py-16 mb-6">
            {/* Responsive logo size */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <img 
                src="/money/notes-passport.png" 
                alt="Notes Passport" 
                className="h-8 sm:h-12 object-contain"
              />
            </div>
            
            {/* Responsive text and spacing */}
            <h2 className="text-white text-center text-base sm:text-lg mb-4 sm:mb-6">
              Enter your mobile number to log in
            </h2>
            
            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full bg-[#2A2A2A] text-white rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-[#2C2C30] focus:outline-none focus:border-[#B69C62] text-sm sm:text-base"
            />
            
            <button className="w-full bg-[#B69C62] text-white py-2 sm:py-3 rounded-lg hover:bg-[#9F885A] transition-colors text-sm sm:text-base">
              Log In
            </button>
          </div>

          {/* Footer links */}
          <div className="flex justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400">
            <a href="/terms" className="hover:text-[#B69C62] transition-colors">Terms of Use</a>
            <a href="/privacy" className="hover:text-[#B69C62] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    );
  };



  return (
    <DashboardLayout 
      tabs={["Loans", "Cards", "Shop Bazaar", "Notes Passport"]} 
      selectedTab={selectedTab} 
      onTabChange={setSelectedTab}
    >
      {loading ? <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div> : 
       selectedTab === "Cards" ? renderCardsContent() : 
       selectedTab === "Loans" ? renderLoansContent() : 
       selectedTab === "Shop Bazaar" ? renderShopContent() :
       selectedTab === "Notes Passport" ? renderNotesPassportContent() :
       <div>Coming Soon</div>
       }
    </DashboardLayout>
  );
};

export default Money;

