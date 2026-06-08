import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { useAuth } from "@/hooks/useAuth";

export const CartSheet = () => {
  const { state, updateQuantity, removeItem, toggleCart, clearCart } = useCart();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const total = state.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  const handleCheckout = async () => {
    // If not logged in, ask the user to login
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    // Open payment modal
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    // The cart will be automatically closed now because 
    // we modified the CLEAR_CART reducer to set isOpen to false
    clearCart();
    
    toast({
      title: "Order Confirmed",
      description: "Thank you for your purchase!",
    });
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(item.id, newQuantity, item.selectedSize, item.selectedColor);
    }
  };

  return (
    <Sheet open={state.isOpen} onOpenChange={toggleCart}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="relative h-6 w-6 p-0 hover:bg-transparent"
        >
          <ShoppingCart className="h-6 w-6" />
          {state.items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {state.items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-4 h-[calc(100vh-12rem)] overflow-y-auto">
          {state.items.map((item) => (
            <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 py-4">
              <img
                src={item.main_image || '/placeholder.svg'}
                alt={item.name}
                className="h-24 w-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{item.name}</h3>
                  <button
                    onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                  {item.selectedColor && (
                    <span className="ml-2">Color: {item.selectedColor}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center border rounded-lg">
                    <button
                      className="p-2 hover:bg-gray-100"
                      onClick={() => handleQuantityChange(item, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4">{item.quantity}</span>
                    <button
                      className="p-2 hover:bg-gray-100"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex justify-between mb-4">
            <span className="font-medium">Total</span>
            <span className="font-medium">${total.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full" 
            disabled={state.items.length === 0}
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </div>
      </SheetContent>

      {/* Payment Modal */}
      {state.items.length > 0 && (
        <PaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)}
          items={state.items}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Sheet>
  );
};
