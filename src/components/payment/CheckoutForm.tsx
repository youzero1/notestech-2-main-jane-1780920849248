import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { userInfo } from "os";
import { useMembership } from "@/hooks/useMembership";

const stripePromise = loadStripe(
  "pk_test_51QzCLeEO4RczY7x9IWOhPLl8n47axuV1Uco2OkyV9bnDhpDR9F56pw4XtjXxUHFP0pqnxZfsChXN8Kzifpz47kAH00QXwVwwjY"
);

const CheckoutForm = ({ subscriptionId, customerId, priceId, onClose, userId, selectedType }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validForm, setValidForm] = useState(false);
  const { toast } = useToast();
  const { refreshMembership } = useMembership();
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }
    // Disable the submit button to prevent multiple submissions
    setLoading(true);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
         // Calculate valid_until date based on membership type
    const now = new Date();
    let validUntil = new Date();
    
    if (selectedType === 'basic' || selectedType === 'advanced' || selectedType === 'enterprise') {
      validUntil.setMonth(now.getMonth() + 1); // Add 1 month
    }

    // Update user membership in Supabase
    const { error } = await supabase
      .from('user_memberships')
      .upsert({
        profile_id: userId,
        type: selectedType,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        valid_until: validUntil.toISOString(),
      },{
        onConflict: 'profile_id',
      });

    if (error) {
      console.error('Error updating membership:', error);
    }

    // Create initial invoice record
    // const { error: invoiceError } = await supabase
    //   .from('user_invoices')
    //   .insert({
    //     profile_id: userId,
    //     amount: membershipType === 'annual' ? 199.99 : 19.99,
    //     membership_type: membershipType,
    //     status: 'succeeded', 
    //   });

    // if (invoiceError) {
    //   console.error('Error creating invoice record:', invoiceError);
    // }
        // Handle successful payment
        setSuccessMessage("Payment succeeded!");
        onClose();
        refreshMembership();
        toast({
          title: "Payment Successful",
          description: "Your Membership has been confirmed.",
        });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement onChange={(event) => setValidForm(event.complete)} />
      <Button
        type="submit"
        className="w-full mt-2"
        disabled={!stripe || !elements || loading || !validForm}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
            Processing...
          </div>
        ) : (
          `Pay`
        )}
      </Button>
      {errorMessage && <div>{errorMessage}</div>}
    </form>
  );
};

const SubscriptionCheckout = ({ priceId, onClose, selectedType }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const { user } = useAuth();

  console.log(clientSecret);

  useEffect(() => {
    fetchClientSecret();
  }, [priceId]);

  const fetchClientSecret = async () => {
    const { data, error } = await supabase.functions.invoke(
      "create-membership-checkout",
      {
        body: { priceId, customerEmail: user?.email, userId: user?.id },
      }
    );
    if (error) throw error;
    setClientSecret(data.clientSecret);
    setSubscriptionId(data.subscriptionId);
    setCustomerId(data.customerId);
  };

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p>Initializing payment...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm selectedType={selectedType} subscriptionId={subscriptionId} customerId={customerId} priceId={priceId} onClose={onClose} userId={user.id} />
    </Elements>
  );
};

export default SubscriptionCheckout;
