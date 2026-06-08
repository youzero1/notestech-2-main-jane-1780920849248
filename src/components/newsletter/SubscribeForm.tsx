
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SUPABASE_URL } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrorMessage(null);
  };

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmSubscription = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log(`Sending subscription request to ${SUPABASE_URL}/functions/v1/subscribe-newsletter`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/subscribe-newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('Subscription response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }
      
      toast.success(data.message || 'Thank you for subscribing to our newsletter!');
      setEmail('');
      setShowConfirmation(false);
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMsg = error.message || 'Failed to subscribe. Please try again later.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-3">
        <Input
          type="email"
          placeholder="Email Address"
          className="w-[370px] h-[48px] bg-white border-none rounded-lg px-4 py-3 text-black placeholder:text-gray-500"
          value={email}
          onChange={handleEmailChange}
        />
        <Button 
          className="w-[135px] h-[48px] rounded-lg font-normal text-white"
          style={{ backgroundColor: '#987D4D' }}
          onClick={handleSubscribe}
        >
          Join
        </Button>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              Do you want to subscribe to our newsletter with {email}?
            </DialogDescription>
          </DialogHeader>
          
          {errorMessage && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="sm:justify-center sm:space-x-4 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSubscription} 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Yes, Subscribe Me'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
