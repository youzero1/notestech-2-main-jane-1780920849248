import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Minus, Plus, Star, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { useAuth } from "@/hooks/useAuth";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { ProductReview } from "@/types/review";
import { StarRating } from "@/components/ui/star-rating";

type Product = Database['public']['Tables']['products']['Row'];

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { addItem, state, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const reviewsRef = useRef<HTMLDivElement>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    }
  });

  // Query to fetch product reviews
  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_product_reviews', { p_product_id: id })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductReview[];
    },
    enabled: !!id
  });

  // Scroll to reviews section
  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Update local quantity state when cart state changes
  useEffect(() => {
    if (id) {
      const cartQuantity = getItemQuantity(id, selectedSize, selectedColor);
      if (cartQuantity > 0) {
        setQuantity(cartQuantity);
      } else {
        // Reset to 1 if item is not in cart
        setQuantity(1);
      }
    }
  }, [id, selectedSize, selectedColor, getItemQuantity, state.items]);

  const { data: similarProducts } = useQuery({
    queryKey: ['similar-products', product?.id],
    enabled: !!product,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('id', product.id)
        .eq('status', 'active')
        .limit(4);

      if (error) throw error;
      return data as Product[];
    }
  });

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
      
      // Check if this item is already in the cart
      const existingItem = state.items.find(
        item => 
          item.id === id && 
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );
      
      // If it's in the cart, update its quantity
      if (existingItem) {
        updateQuantity(id as string, newQuantity, selectedSize, selectedColor);
      }
    }
  };

  const handleThumbnailScroll = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (product?.gallery_images) {
      const galleryImages = product.gallery_images as string[];
      if ((direction === 'up' || direction === 'left') && startIndex > 0) {
        setStartIndex(prev => prev - 1);
      } else if ((direction === 'down' || direction === 'right') && startIndex < galleryImages.length - 4) {
        setStartIndex(prev => prev + 1);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const sizes = product.sizes as string[] || [];
    const colors = (product.colors as Array<{ name: string; class: string }>) || [];

    if (!selectedSize && sizes.length > 0) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    if (!selectedColor && colors.length > 0) {
      toast({
        title: "Please select a color",
        variant: "destructive",
      });
      return;
    }

    addItem({
      ...product,
      quantity,
      selectedSize,
      selectedColor,
    });
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (product.type === 'affiliate' && product.affiliate_link) {
      window.location.href = product.affiliate_link;
      return;
    }

    const sizes = product.sizes as string[] || [];
    const colors = (product.colors as Array<{ name: string; class: string }>) || [];

    if (!selectedSize && sizes.length > 0) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    if (!selectedColor && colors.length > 0) {
      toast({
        title: "Please select a color",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsPaymentModalOpen(true);
  };

  // Update selection when size or color changes
  useEffect(() => {
    // Get current quantity from cart when size/color selection changes
    const cartQuantity = getItemQuantity(id as string, selectedSize, selectedColor);
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
    } else {
      setQuantity(1);
    }
  }, [selectedSize, selectedColor, id, getItemQuantity]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-[500px] w-full" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-20" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Product not found</h2>
            <Link to="/marketplace" className="text-primary hover:underline">
              Return to marketplace
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const allImages = [product.main_image, ...(product.gallery_images as string[] || [])].filter(Boolean);
  const availableSizes = product.sizes as string[] || [];
  const availableColors = product.colors as Array<{ name: string; class: string }> || [];
  const visibleImages = allImages.slice(startIndex, startIndex + 4);
  
  const hasMoreImages = startIndex + 4 < allImages.length;

  return (
    <DashboardLayout showLink={true} redirectionLink="/marketplace" linkText="Back">
      <div className="w-full h-full pt-6 bg-[#161618]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8">
            <div className="flex flex-col-reverse lg:flex-row gap-4">
              <div className="flex lg:flex-col gap-4 relative w-full lg:w-20 h-20 lg:h-[470px]">
                {startIndex > 0 && (
                  <>
                    <button
                      onClick={() => handleThumbnailScroll('up')}
                      className="hidden lg:flex absolute -top-4 left-1/2 -translate-x-1/2 justify-center items-center w-8 h-8 bg-transparent rounded-full hover:bg-gray-800 z-10"
                    >
                      <ChevronUp className="h-4 w-4 text-white" />
                    </button>

                    <button
                      onClick={() => handleThumbnailScroll('left')}
                      className="lg:hidden absolute -left-4 top-1/2 -translate-y-1/2 justify-center items-center w-8 h-8 bg-transparent rounded-full hover:bg-gray-800 z-10 flex"
                    >
                      <ChevronLeft className="h-4 w-4 text-white" />
                    </button>
                  </>
                )}

                <div className="flex lg:flex-col gap-4 w-full lg:w-auto overflow-x-auto lg:overflow-y-hidden h-20 lg:h-[470px] scrollbar-hide relative px-2 lg:px-0">
                  {visibleImages.map((image, index) => (
                    <button
                      key={index + startIndex}
                      className={`flex-shrink-0 aspect-square w-20 h-20 lg:h-[100px] rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index + startIndex ? 'border-primary' : 'border-gray-800'
                      }`}
                      onClick={() => setSelectedImageIndex(index + startIndex)}
                    >
                      <img
                        src={image}
                        alt={`${product.name} view ${index + startIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {hasMoreImages && (
                  <>
                    <button
                      onClick={() => handleThumbnailScroll('down')}
                      className="hidden lg:flex absolute -top-4 left-1/2 -translate-x-1/2 justify-center items-center w-8 h-8 bg-transparent rounded-full hover:bg-gray-800 z-10"
                      style={{ 
                        top: '28rem'
                      }}
                    >
                      <ChevronDown className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleThumbnailScroll('right')}
                      className="lg:hidden absolute -right-4 top-1/2 -translate-y-1/2 justify-center items-center w-8 h-8 bg-transparent rounded-full hover:bg-gray-800 z-10 flex"
                    >
                      <ChevronRight className="h-4 w-4 text-white" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex-1 h-[300px] lg:h-[470px] rounded-lg overflow-hidden border-2 border-gray-800">
                <img
                  src={allImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl font-bold">${product.price} USD</span>
                  {product.original_price && (
                    <span className="text-lg text-gray-500 line-through">
                      ${product.original_price} USD
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex gap-2 cursor-pointer" onClick={scrollToReviews}>
                    <StarRating 
                      readOnly 
                      initialRating={reviews && reviews.length > 0 
                        ? Math.round((reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length) * 2) / 2
                        : 0
                      }
                      size={20}
                    />
                  </div>
                  <span className="text-gray-400 cursor-pointer" onClick={scrollToReviews}>
                    {reviews && reviews.length > 0 
                      ? `${(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)} (${reviews.length} Reviews)` 
                      : "No reviews yet"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-800 my-6" />

              <div>
                <h3 className="text-lg font-medium mb-4">Description</h3>
                <p className="text-gray-400">{product.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      className={`px-4 py-2 rounded-lg border ${
                        selectedSize === size
                          ? "bg-primary text-white border-primary"
                          : "border-gray-800 hover:border-white"
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Color</h3>
                <div className="flex gap-3">
                  {availableColors.map((color) => (
                    <button
                      key={color.name}
                      className={`w-8 h-8 rounded-lg ${color.class} ${
                        selectedColor === color.name
                          ? "ring-2 ring-offset-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedColor(color.name)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-800 rounded-lg">
                  <button
                    className="p-2 hover:bg-gray-800"
                    onClick={() => handleQuantityChange(-1)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    className="p-2 hover:bg-gray-800"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {product.type !== 'affiliate' && (
                  <Button 
                    className="flex-1" 
                    variant="default"
                    onClick={handleAddToCart}
                  >
                    Add To Cart
                  </Button>
                )}
              </div>
              <Button 
                className="w-full mt-4 border border-[#2C2C30] bg-transparent hover:bg-[#2C2C30]" 
                variant="secondary"
                onClick={handleBuyNow}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : product.type === 'affiliate' ? "Visit Store" : "Buy Now"}
              </Button>
            </div>
          </div>

          {/* Similar Products Section */}
          {similarProducts && similarProducts.length > 0 && (
            <div className="mt-16 px-8">
              <div className="h-px bg-gray-800 mb-8" />
              <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProducts.map((item) => (
                  <Link to={`/marketplace/product/${item.id}`} key={item.id}>
                    <Card className="group bg-[#161618] border-gray-800">
                      <div className="aspect-[4/5] overflow-hidden rounded-t-lg">
                        <img
                          src={item.main_image || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="mt-2 font-semibold">${item.price} USD</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div ref={reviewsRef} className="mt-16 px-8 pb-8">
            <div className="h-px bg-gray-800 mb-8" />
            <ProductReviews 
              productId={id as string} 
              reviews={reviews || []} 
              onReviewSubmitted={() => refetchReviews()} 
            />
          </div>
        </div>
      </div>

      {product && (
        <PaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)}
          items={[{
            ...product,
            quantity,
            selectedSize,
            selectedColor,
          }]}
        />
      )}
    </DashboardLayout>
  );
};

export default ProductDetail;
