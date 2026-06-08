
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useMembership } from "@/hooks/useMembership";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SubscriptionModal from "@/components/payment/SubscriptionModal";

type MembershipType = 'free' | 'premium' | 'annual' | 'basic' | 'advanced' | 'enterprise';

const MembershipPlans = () => {
  const { membershipType, isLoading } = useMembership();
  const { user } = useAuth();
  const [processingType, setProcessingType] = useState<MembershipType | null>(null);
  const [selectedType, setSelectedType] = useState<MembershipType | null>(null);
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [priceId, setPriceId] = useState<string | null>(null);

  const handleUpgrade = async (type: MembershipType) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to upgrade your membership.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (type === 'free') {
      toast({
        title: "Already Free",
        description: "You're already on the free plan.",
      });
      return;
    }

    try {
      setProcessingType(type);
      setSelectedType(type);
      // Call our edge function to create a checkout session
    setIsPaymentModalOpen(true);
    if (type === 'basic') {
      setPriceId('price_1R67BbEO4RczY7x94Kdgeq8g');
    } else if (type === 'advanced') {
      setPriceId('price_1R67CuEO4RczY7x9tLIBQZWO');
    } else if (type === 'enterprise') {
      setPriceId('price_1R67DnEO4RczY7x9HV61x78R');
    }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Could not process your request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setProcessingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-4 text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Plans & Pricing
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Easy pricing with no hidden fees
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 items-stretch justify-center mx-auto max-w-7xl">
        {/* Free Plan */}
        <Card className={`relative p-8 flex flex-col transform transition-all duration-200 
          bg-[#1A1A1A] text-white group min-h-[600px]
          ${membershipType === 'free' 
            ? 'border-[1px] border-[#B8A080] bg-black' 
            : 'hover:border-[1px] hover:border-[#B8A080] hover:bg-black'
          }`}
        >
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-medium mb-4">Free</h2>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-400 ml-2 whitespace-nowrap">/month</span>
            </div>
            <Button 
              className={`w-full px-4 py-2.5 text-sm mb-8
                ${membershipType === 'free' 
                  ? 'bg-[#B8A080] hover:bg-[#B08D57] text-black' 
                  : 'bg-[#2A2A2A] group-hover:bg-[#B08D57] text-white'
                }`}
              disabled={true}
            >
              {processingType === 'free' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : membershipType === 'free' ? 'Current Plan' : 'Get Started'}
            </Button>
            <p className="text-gray-400 text-sm mb-8">Basic access to platform features.</p>
            <ul className="space-y-5 flex-1">
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">1 user account</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Basic analytics</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Limited customer support</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Access to core features</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Monthly Basic Plan */}
        <Card className={`relative p-8 flex flex-col transform transition-all duration-200 
          bg-[#1A1A1A] text-white group min-h-[600px]
          ${membershipType === 'basic' 
            ? 'border-[1px] border-[#B8A080] bg-black' 
            : 'hover:border-[1px] hover:border-[#B8A080] hover:bg-black'
          }`}
        >
          
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-medium mb-4">Basic</h2>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-gray-400 ml-2 whitespace-nowrap">/month</span>
            </div>
            <Button 
              className={`w-full px-4 py-2.5 text-sm mb-8
                ${membershipType === 'basic' 
                  ? 'bg-[#B8A080] hover:bg-[#B08D57] text-black' 
                  : 'bg-[#2A2A2A] group-hover:bg-[#B08D57] text-white'
                }`}
              onClick={() => handleUpgrade('basic')}  
              disabled={membershipType === 'basic' || processingType !== null}
            >
              {processingType === 'basic' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : membershipType === 'basic' ? 'Current Plan' : 'Get Started'}
            </Button>
            <p className="text-gray-400 text-sm mb-8">All the essentials to begin.</p>
            <ul className="space-y-5 flex-1">
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Everything in Free plan</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Unlimited beat downloads</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Access to premium courses</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Priority customer support</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Advanced Premium Plan */}
        <Card className={`relative p-8 flex flex-col transform transition-all duration-200 
          bg-[#1A1A1A] text-white group min-h-[600px]
          ${membershipType === 'advanced' 
            ? 'border-[1px] border-[#B8A080] bg-black' 
            : 'hover:border-[1px] hover:border-[#B8A080] hover:bg-black'
          }`}
        >
          <div className="absolute top-2 right-2 bg-[#1A1A1A] text-[#B8A080] px-3 py-0.5 rounded-[6px] text-sm font-medium whitespace-nowrap border border-[#B8A080]">
            Most popular
          </div>
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-medium mb-4">Advanced</h2>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-bold">$29.99</span>
              <span className="text-gray-400 ml-2 whitespace-nowrap">/year</span>
            </div>
            <Button 
              className={`w-full px-4 py-2.5 text-sm mb-8
                ${membershipType === 'advanced' 
                  ? 'bg-[#B8A080] hover:bg-[#B08D57] text-black' 
                  : 'bg-[#2A2A2A] group-hover:bg-[#B08D57] text-white'
                }`}
              onClick={() => handleUpgrade('advanced')}
              disabled={membershipType === 'advanced' || processingType !== null}
            >
              {processingType === 'advanced' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : membershipType === 'advanced' ? 'Current Plan' : 'Get Started'}
            </Button>
            <p className="text-gray-400 text-sm mb-8">All the essentials to begin.</p>
            <ul className="space-y-5 flex-1">
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Everything in Advanced plan</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Save over $40 per year</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Annual workshops access</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">VIP platform features</span>
              </li>
            </ul>
          </div>
        </Card>
        {/* Enterprise Premium Plan */}
        <Card className={`relative p-8 flex flex-col transform transition-all duration-200 
          bg-[#1A1A1A] text-white group min-h-[600px]
          ${membershipType === 'enterprise' 
            ? 'border-[1px] border-[#B8A080] bg-black' 
            : 'hover:border-[1px] hover:border-[#B8A080] hover:bg-black'
          }`}
        >
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-medium mb-4">Enterprise</h2>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-bold">$99.99</span>
              <span className="text-gray-400 ml-2 whitespace-nowrap">/year</span>
            </div>
            <Button 
              className={`w-full px-4 py-2.5 text-sm mb-8
                ${membershipType === 'enterprise' 
                  ? 'bg-[#B8A080] hover:bg-[#B08D57] text-black' 
                  : 'bg-[#2A2A2A] group-hover:bg-[#B08D57] text-white'
                }`}
              onClick={() => handleUpgrade('enterprise')}
              disabled={membershipType === 'enterprise' || processingType !== null}
            >
              {processingType === 'enterprise' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : membershipType === 'enterprise' ? 'Current Plan' : 'Get Started'}
            </Button>
            <p className="text-gray-400 text-sm mb-8">All the essentials to begin.</p>
            <ul className="space-y-5 flex-1">
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Everything in Advanced plan</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Save over $40 per year</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">Annual workshops access</span>
              </li>
              <li className="flex items-center gap-4">
                <Check className="h-5 w-5 text-[#B8A080]" />
                <span className="text-gray-400 text-sm">VIP platform features</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && priceId && (
        <SubscriptionModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)}
          priceId={priceId}
          selectedType={selectedType}
        />
      )}
    </div>
  );
};

const MembershipPage = () => (
  <DashboardLayout headerTitle="Upgrade">
    <MembershipPlans />
  </DashboardLayout>
);

export default MembershipPage;
