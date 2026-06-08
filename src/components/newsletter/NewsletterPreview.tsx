
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Newsletter = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: 'draft' | 'published';
};

export default function NewsletterPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchNewsletter();
  }, [id]);

  const fetchNewsletter = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const typedNewsletter = {
        ...data,
        status: data.status === 'published' ? 'published' : 'draft'
      } as Newsletter;
      
      setNewsletter(typedNewsletter);
    } catch (error) {
      console.error('Error fetching newsletter:', error);
      toast.error('Failed to load newsletter');
      navigate('/admin/newsletters');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!id) return;
    
    try {
      setIsSending(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        throw new Error("You must be logged in to use this feature");
      }
      
      const token = sessionData.session.access_token;
      
      console.log("Sending newsletter with ID:", id);
      
      // DO NOT stringify the body, let Supabase handle it
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: { newsletterId: id },
      });

      console.log("Response from edge function:", data, error);

      if (error) {
        throw new Error(error.message || 'Failed to send newsletter');
      }
      
      if (data) {
        toast.success(data.message || 'Newsletter sent successfully');
        fetchNewsletter(); // Refresh to update status
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send newsletter');
    } finally {
      setIsSending(false);
      setShowSendDialog(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p>Loading newsletter preview...</p>
      </Card>
    );
  }

  if (!newsletter) {
    return (
      <Card className="p-8 text-center">
        <p>Newsletter not found</p>
        <Button 
          onClick={() => navigate('/admin/newsletters')}
          className="mt-4"
        >
          Back to Newsletters
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/newsletters')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Newsletter Preview</h2>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/newsletters/edit/${id}`)}
          >
            Edit
          </Button>
          
          {newsletter.status === 'draft' && (
            <Button
              variant="default"
              onClick={() => setShowSendDialog(true)}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Newsletter
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="bg-white text-black p-8 rounded-lg">
            <h1 className="text-3xl font-bold mb-6">{newsletter.title}</h1>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: newsletter.content }}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Newsletter</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the newsletter to all verified subscribers. Once sent, it cannot be unsent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendNewsletter}
              className="bg-primary hover:bg-primary/90"
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Newsletter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
