
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  Gift, 
  UserPlus, 
  DollarSign, 
  Bookmark, 
  BookOpen,
  Heart,
  MessageCircle
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Notification {
  id: string;
  type: 'post' | 'course' | 'affiliate' | 'follow' | 'merch';
  content: string;
  created_at: string;
  readers: string[];
  entity_id: string;
  user_id: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, [user, currentPage]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch total count for pagination
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (countError) {
        throw countError;
      }
      
      const totalItems = count || 0;
      setTotalPages(Math.ceil(totalItems / itemsPerPage));

      // Fetch paginated notifications
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) {
        throw error;
      }

      if (notificationsData) {
        // Process notifications to ensure proper typing for readers array
        const processedNotifications = notificationsData.map(notification => ({
          ...notification,
          // Ensure readers is an array of strings
          readers: Array.isArray(notification.readers) ? notification.readers : []
        }));
        
        setNotifications(processedNotifications as Notification[]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(notification => 
        !notification.readers.includes(user.id)
      );

      if (unreadNotifications.length === 0) {
        toast({
          title: "Info",
          description: "No unread notifications",
        });
        return;
      }

      // Update all unread notifications to mark them as read
      const updates = unreadNotifications.map(notification => {
        const updatedReaders = [...notification.readers, user.id];
        return supabase
          .from('notifications')
          .update({ readers: updatedReaders })
          .eq('id', notification.id);
      });

      await Promise.all(updates);

      // Update the local state
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          readers: n.readers.includes(user.id) ? n.readers : [...n.readers, user.id]
        }))
      );

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // If already read, do nothing
    if (notification.readers.includes(user.id)) return;

    const updatedReaders = [...notification.readers, user.id];

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ readers: updatedReaders })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId 
            ? { ...n, readers: updatedReaders }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  // Helper function to get the appropriate icon for each notification type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'post':
        // Check if the notification content contains specific keywords
        if (notification.content.includes('liked')) {
          return <Heart className="h-6 w-6 text-red-500" />;
        } else if (notification.content.includes('commented')) {
          return <MessageCircle className="h-6 w-6 text-blue-500" />;
        } else {
          return <Bell className="h-6 w-6 text-yellow-500" />;
        }
      case 'course':
        return <img src="/lovable-uploads/course.png" alt="Course" className="h-6 w-6" />;
      case 'affiliate':
        return <DollarSign className="h-6 w-6 text-green-500" />;
      case 'follow':
        return <UserPlus className="h-6 w-6 text-purple-500" />;
      case 'merch':
        return <img src="/lovable-uploads/merch.png" alt="Affiliate" className="h-6 w-6" />;
      default:
        return <Bell className="h-6 w-6 text-yellow-500" />;
    }
  };

  return (
    <DashboardLayout 
      headerTitle="Notifications" 
      // headerDescription="All your recent notifications in one place"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white"></h1>
          <Button 
            onClick={markAllAsRead} 
            variant="outline" 
            className="hover:bg-[#2A2A2A] text-white"
          >
            Mark all as read
          </Button>
        </div>

        <Card className="bg-[#1E1E20] border-[#2C2C30] shadow-lg overflow-hidden mb-6">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-[#2C2C30]">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`flex items-start p-4 hover:bg-[#252527] transition-colors cursor-pointer ${
                      !notification.readers.includes(user?.id || '') ? 'bg-[#252527]' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex-shrink-0 bg-[#161617] rounded-full flex items-center justify-center mr-4" style={{ width: '48px', height: '48px' }}>
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium mb-1">{notification.content}</p>
                      <p className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.readers.includes(user?.id || '') && (
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <p>No notifications found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
