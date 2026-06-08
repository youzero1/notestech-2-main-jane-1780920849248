
import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, PanInfo, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface CreditCardSliderProps {
  isLoading: boolean;
}

const CreditCardSlider = ({ isLoading }: CreditCardSliderProps) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const { data: creditCards, isLoading: isCardsLoading, error } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('category', 'card');
      
      if (error) throw error;
      return data;
    }
  });

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!creditCards?.length) return;
    
    if (info.offset.x > 100) {
      // Swipe right
      setCurrentIndex(prev => Math.max(0, prev - 1));
    } else if (info.offset.x < -100) {
      // Swipe left
      setCurrentIndex(prev => Math.min(creditCards.length - 1, prev + 1));
    }
  };

  const handleCardNavigation = (direction: 'prev' | 'next') => {
    if (!creditCards?.length) return;
    
    if (direction === 'prev') {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    } else {
      setCurrentIndex(prev => Math.min(creditCards.length - 1, prev + 1));
    }
  };

  const handleAddNewCard = () => {
    navigate("/admin/affiliate-management", {
      state: {
        openCreateModal: true,
        preSelectCategory: "card"
      }
    });
  };

  return (
    <Card className="bg-[#1C1C1E] border border-[#2A2A2A] shadow-[0_4px_12px_rgba(0,0,0,0.25)] h-full overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Card</h2>
              <p className="text-sm text-gray-400">All Your Cards</p>
            </div>
            {/* <button className="text-gray-400 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button> */}
          </div>
        </div>
        
        {/* Divider Line */}
        <div className="w-full h-px bg-[#2A2A2A]"></div>
        
        {/* Card Content Section */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 relative" ref={constraintsRef}>
          {isLoading || isCardsLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-[280px] h-[177px] rounded-xl" />
              <Skeleton className="w-[280px] h-[48px] rounded-lg mt-6" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-6 text-red-400">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>Failed to load credit cards</span>
            </div>
          ) : (
            <>
              {/* Card Container with Edges */}
              <div className="relative w-[360px] mb-6 flex justify-center">
                {/* Main Card */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentIndex}
                    className="w-[280px] z-10"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDrag}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  >
                    <div className="bg-black rounded-xl p-6 aspect-[1.586/1] relative shadow-[0_8px_16px_rgba(0,0,0,0.25)]">
                      <div className="flex items-center justify-between mb-12">
                        <img 
                          src="/money/card-chip.png" 
                          alt="Card chip" 
                          className="w-8 h-8 object-contain"
                        />
                        <div className="text-white font-mono text-sm tracking-wider">
                          4242 4242 4242 4242
                        </div>
                      </div>
                      
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex justify-between items-center">
                          <img 
                            src="/lovable-uploads/cardlogo.png" 
                            alt="Notes Logo" 
                            className="h-5 object-contain"
                          />
                          <div className="text-white text-xs font-medium">
                            {creditCards?.[currentIndex]?.name || 'XYZ Credit Card'}
                          </div>
                          <div className="flex gap-1">
                            <div className="w-5 h-5 rounded-full bg-[#EB001B] opacity-90"></div>
                            <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Left Edge (Previous Card) */}
                {currentIndex > 0 && (
                  <div 
                    className="absolute -left-8 top-0 h-full w-12 rounded-r-xl cursor-pointer bg-black"
                    onClick={() => handleCardNavigation('prev')}
                    style={{
                      boxShadow: '4px 0 12px rgba(0,0,0,0.3)'
                    }}
                  ></div>
                )}
                
                {/* Right Edge (Next Card) */}
                {creditCards && currentIndex < creditCards.length - 1 && (
                  <div 
                    className="absolute -right-8 top-0 h-full w-12 rounded-l-xl cursor-pointer bg-black"
                    onClick={() => handleCardNavigation('next')}
                    style={{
                      boxShadow: '-4px 0 12px rgba(0,0,0,0.3)'
                    }}
                  ></div>
                )}
              </div>
              
              {/* Add New Card Button */}
              <button 
                onClick={handleAddNewCard}
                className="w-[280px] h-12 rounded-[6px] text-white transition-colors flex items-center justify-center gap-2 relative hover:bg-[#333337]"
                style={{
                  background: '#2C2C30',
                  position: 'relative',
                }}
              >
                {/* Gradient Border Container */}
                <div 
                  className="absolute inset-0 rounded-[6px]"
                  style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(284.72deg, rgba(41, 37, 36, 0.2) 22.17%, rgba(246, 247, 250, 0) 123.12%) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                  }}
                />
                <span className="text-lg font-light">+</span>
                <span className="text-xs">Add New Card</span>
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CreditCardSlider; 
