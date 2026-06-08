
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/components/ui/use-toast";

type MembershipType = "free" | "premium" | "annual" | "basic" | "advanced" | "enterprise";

interface MembershipContextType {
  membershipType: MembershipType | null;
  isLoading: boolean;
  isPremium: boolean;
  hasAccess: (feature: "beats" | "production" | "entrepreneurship" | "music-business") => boolean;
  refreshMembership: () => Promise<void>;
  paymentHistory: Array<any>; // Payment history for graphs
}

const MembershipContext = createContext<MembershipContextType>({
  membershipType: null,
  isLoading: true,
  isPremium: false,
  hasAccess: () => false,
  refreshMembership: async () => {},
  paymentHistory: [],
});

export const MembershipProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [membershipType, setMembershipType] = useState<MembershipType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<Array<any>>([]);

  const fetchMembership = async () => {
    if (!user) {
      setMembershipType('free');
      setPaymentHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select('type, valid_until, stripe_subscription_id')
        .eq('profile_id', user.id)
        .single();

      if (error) throw error;

      // Check if premium membership is still valid
      const isPremiumValid = (data.type === 'basic' || data.type === 'advanced' || data.type === 'enterprise') && 
        (!data.valid_until || new Date(data.valid_until) > new Date());

      setMembershipType(isPremiumValid ? data.type : 'free');
      
      // Fetch payment history
      if (isPremiumValid) {
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('user_invoices')
          .select('*')
          .eq('profile_id', user.id)
          .eq('status', 'succeeded')
          .order('payment_date', { ascending: false });
          
        if (!invoiceError && invoiceData) {
          setPaymentHistory(invoiceData);
        }
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      setMembershipType('free'); // Default to free on error
      setPaymentHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
    
    // Set up a listener for URL changes to detect successful payments
    const handleHashChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      
      if (paymentStatus === 'success') {
        toast({
          title: "Payment Successful",
          description: "Your membership has been upgraded successfully!",
        });
        fetchMembership(); // Refresh membership status
        
        // Clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };
    
    // Check on initial load and add listener
    handleHashChange();
    window.addEventListener('popstate', handleHashChange);
    
    return () => {
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [user]);

  const isPremium = membershipType === 'premium' || membershipType === 'annual';

  const hasAccess = (feature: "beats" | "production" | "entrepreneurship" | "music-business") => {
    if (!membershipType) return false;
    if (isPremium) return true;
    
    // Free tier access rules
    switch (feature) {
      case 'beats':
      case 'production':
      case 'entrepreneurship':
      case 'music-business':
        return false;
      default:
        return true;
    }
  };

  const refreshMembership = async () => {
    setIsLoading(true);
    await fetchMembership();
  };

  return (
    <MembershipContext.Provider value={{ 
      membershipType, 
      isLoading, 
      isPremium, 
      hasAccess,
      refreshMembership,
      paymentHistory
    }}>
      {children}
    </MembershipContext.Provider>
  );
};

export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error("useMembership must be used within a MembershipProvider");
  }
  return context;
};
