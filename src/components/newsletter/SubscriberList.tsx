
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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

type Subscriber = {
  id: string;
  email: string;
  verified: boolean;
  created_at: string;
};

export default function SubscriberList() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0
  });

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const subscriberList = data || [];
      setSubscribers(subscriberList);
      
      // Calculate stats
      setStats({
        total: subscriberList.length,
        verified: subscriberList.filter(s => s.verified).length,
        unverified: subscriberList.filter(s => !s.verified).length
      });
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSubscribers(subscribers.filter(subscriber => subscriber.id !== id));
      
      // Update stats
      setStats({
        ...stats,
        total: stats.total - 1,
        verified: subscribers.find(s => s.id === id)?.verified ? stats.verified - 1 : stats.verified,
        unverified: !subscribers.find(s => s.id === id)?.verified ? stats.unverified - 1 : stats.unverified
      });
      
      toast.success('Subscriber removed successfully');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Failed to remove subscriber');
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Newsletter Subscribers</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{stats.total}</span>
          <span className="text-gray-500">Total Subscribers</span>
        </Card>
        {/* <Card className="p-6 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-green-600">{stats.verified}</span>
          <span className="text-gray-500">Verified</span>
        </Card>
        <Card className="p-6 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-yellow-600">{stats.unverified}</span>
          <span className="text-gray-500">Awaiting Verification</span>
        </Card> */}
      </div>

      {loading ? (
        <Card className="p-8 text-center">Loading subscribers...</Card>
      ) : subscribers.length === 0 ? (
        <Card className="p-8 text-center">
          <p>No subscribers yet.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscriber.verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {subscriber.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(subscriber.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(subscriber.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the subscriber from your newsletter list. They will no longer receive newsletters.
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
    </div>
  );
}
