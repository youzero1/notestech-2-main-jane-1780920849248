import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Edit2, Send, Trash2, Eye } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function NewsletterList() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendId, setSendId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedNewsletters = data?.map(newsletter => ({
        ...newsletter,
        status: newsletter.status === 'published' ? 'published' : 'draft'
      } as Newsletter)) || [];
      
      setNewsletters(typedNewsletters);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast({
        title: "error",
        description: "Failed to load newsletters",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNewsletters(newsletters.filter(newsletter => newsletter.id !== id));
      toast({
        title: "Success",
        description: "Newsletter deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast({
        title: "error",
        description: "Failed to delete newsletter",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSendNewsletter = async (id: string) => {
    try {
      setIsSending(true);
      toast({
        title: "Success",
        description: "Sending newsletter...",
      });

      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        throw new Error("You must be logged in to use this feature");
      }
      
      const token = sessionData.session.access_token;    
      
      console.log("Sending newsletter with ID:", id);
      
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: { newsletterId: id },
      });

      console.log("Response from edge function:", data, error);

      if (error) {
        throw new Error(error.message || 'Failed to send newsletter');
      }
      
      if (data) {
        toast({
          title: "Success",
          description: data.message || 'Newsletter sent successfully',
        });
        fetchNewsletters(); // Refresh to update status
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast({
        title: "error",
        description: error instanceof Error ? error.message : 'Failed to send newsletter',
      });
    } finally {
      setIsSending(false);
      setSendId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Newsletters</h2>
        <Button 
          onClick={() => navigate('/admin/newsletters/create')}
          className="bg-primary hover:bg-primary/90"
        >
          Create Newsletter
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">Loading newsletters...</Card>
      ) : newsletters.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="mb-4">No newsletters found.</p>
          <Button 
            onClick={() => navigate('/admin/newsletters/create')}
            className="bg-primary hover:bg-primary/90"
          >
            Create your first newsletter
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsletters.map((newsletter) => (
                <TableRow key={newsletter.id}>
                  <TableCell className="font-medium">{newsletter.title}</TableCell>
                  <TableCell>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        newsletter.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {newsletter.status}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(newsletter.created_at)}</TableCell>
                  <TableCell>{formatDate(newsletter.published_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admin/newsletters/preview/${newsletter.id}`)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admin/newsletters/edit/${newsletter.id}`)}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {newsletter.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSendId(newsletter.id)}
                          title="Send"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteId(newsletter.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the newsletter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!sendId} onOpenChange={(open) => !open && setSendId(null)}>
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
              onClick={() => sendId && handleSendNewsletter(sendId)}
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
