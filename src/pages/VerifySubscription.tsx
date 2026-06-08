
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SUPABASE_URL } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function VerifySubscription() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your subscription...');
  
  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage('Your subscription has been successfully verified! You will now receive our newsletters.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify your subscription. The link may have expired or is invalid.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your subscription. Please try again later.');
      }
    };
    
    verifyToken();
  }, [searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Verifying</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Subscription Confirmed!</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Verification Failed</h2>
          </>
        )}
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <Button asChild className="w-full">
          <Link to="/">Return to Home</Link>
        </Button>
      </Card>
    </div>
  );
}
