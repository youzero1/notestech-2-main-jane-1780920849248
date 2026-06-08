
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAffiliateTracking = () => {
  const { toast } = useToast();

  const trackEvent = useCallback(async (
    linkId: string, 
    eventType: 'click' | 'sale' | 'lead' | 'subscription',
    metadata?: Record<string, any>
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('handle-affiliate-event', {
        body: {
          linkId,
          eventType,
          metadata
        }
      });

      if (error) throw error;

      console.log(`Successfully tracked ${eventType} event for link ${linkId}`);
      return data;
    } catch (error) {
      console.error('Error tracking affiliate event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to track affiliate event.",
      });
      throw error;
    }
  }, [toast]);

  return { trackEvent };
};
