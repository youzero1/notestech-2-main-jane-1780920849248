import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useElements, useStripe, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Initialize Stripe with your publishable key
// Replace with your own publishable key (it's safe to include this in client-side code)
const stripePromise = loadStripe('pk_test_51QzCLeEO4RczY7x9IWOhPLl8n47axuV1Uco2OkyV9bnDhpDR9F56pw4XtjXxUHFP0pqnxZfsChXN8Kzifpz47kAH00QXwVwwjY');

// The inner component that handles the actual payment form
const PaymentForm = ({ items, onClose, onSuccess, user }: { 
  items: any[]; 
  onClose: () => void;
  onSuccess?: () => void;
  user: any;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setProcessingPayment(true);
    setPaymentError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/order-confirmation",
        },
        redirect: 'if_required'
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      } 
      
      if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          // Calculate total amount
          const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          // Create the order in our database after successful payment
          const { data: orderData, error: orderError } = await supabase.functions.invoke('create-order', {
            body: { 
              items,
              userId: user.id,
              paymentIntentId: paymentIntent.id,
              amount: totalAmount * 100 // Convert to cents for consistency
            }
          });

          if (orderError) {
            console.error('Error creating order:', orderError);
            toast({
              title: "Order Processing",
              description: "Your payment was successful, but we're still processing your order.",
              variant: "default"
            });
          } else {
            console.log('Order created successfully:', orderData);
          }

          setPaymentSuccess(true);
          toast({
            title: "Payment Successful",
            description: "Your order has been confirmed.",
          });
          
          if (onSuccess) {
            onSuccess();
          }
          
          setTimeout(() => {
            onClose();
          }, 2000);
        } else if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'processing') {
          // Create order with pending status
          const { error: orderError } = await supabase
            .from('orders')
            .insert({
              profile_id: user?.id,
              status: 'processing',
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              items: items,
            });

          if (orderError) {
            console.error('Error creating order:', orderError);
          }

          toast({
            title: "Payment Processing",
            description: "Your payment is being processed. Please wait a moment.",
          });
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed');
      
      // Create failed order record
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          profile_id: user?.id,
          status: 'failed',
          payment_error: error.message,
          amount: 0,
          items: items,
        });

      if (orderError) {
        console.error('Error creating failed order record:', orderError);
      }

      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p>Initializing payment...</p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="text-xl font-semibold text-center">Payment Successful!</p>
        <p className="text-center">Your order has been confirmed.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  if (paymentError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <p className="text-xl font-semibold text-center">Payment Failed</p>
        <p className="text-center">{paymentError}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {loading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <PaymentElement />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={processingPayment}>
              Cancel
            </Button>
            <Button type="submit" disabled={!stripe || !elements || processingPayment}>
              {processingPayment ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Processing...
                </div>
              ) : (
                `Pay $${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

// The wrapper component that provides the Stripe context
export const PaymentModal = ({ 
  isOpen, 
  onClose, 
  items, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  items: any[];
  onSuccess?: () => void;
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const createPaymentIntent = async () => {
      try {
        // Only create if we don't already have a client secret
        if (clientSecret) return;

        console.log('Creating payment intent for:', items);
        const response = await supabase.functions.invoke('create-payment-intent', {
          body: { 
            items,
            userId: user?.id
          }
        });

        if (!mounted) return;

        if (response.error) {
          throw new Error(response.error.message || 'Failed to create payment intent');
        }

        console.log('Payment intent created:', response.data);
        setClientSecret(response.data.clientSecret);
      } catch (error: any) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
      }
    };

    if (isOpen && items.length > 0 && user && !clientSecret) {
      createPaymentIntent();
    }

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [isOpen, items, user, clientSecret, toast]); 

  // Reset client secret when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Complete your purchase securely with Stripe.
          </DialogDescription>
        </DialogHeader>
        
        {isOpen && items.length > 0 && clientSecret && (
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <PaymentForm 
              items={items} 
              onClose={onClose} 
              onSuccess={onSuccess} 
              user={user}
            />
          </Elements>
        )}

        {!clientSecret && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p>Initializing payment...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
