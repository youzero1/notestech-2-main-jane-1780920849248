import { useEffect, useState } from "react";
import { Bell, Gift, UserPlus, DollarSign, BookOpen, MessageCircle, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
interface Notification {
  id: string;
  type: 'post' | 'course' | 'affiliate' | 'follow' | 'merch';
  content: string;
  created_at: string;
  readers: string[];
  entity_id: string;
  user_id: string; 
}

export const NotificationPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        // Fetch notifications that are specifically for the current user
        const { data: notificationsData, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

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
          
          // Count notifications where the current user's ID is not in the readers array
          setUnreadCount(processedNotifications.filter(n => 
            Array.isArray(n.readers) && !n.readers.includes(user.id)
          ).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        });
      }
    };

    fetchNotifications();

    // Subscribe to new notifications for the current user
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Ensure readers is always an array
          const notification = {
            ...newNotification,
            readers: Array.isArray(newNotification.readers) ? newNotification.readers : []
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Add current user's ID to the readers array if not already present
    if (!notification.readers.includes(user.id)) {
      const updatedReaders = [...notification.readers, user.id];

      const { error } = await supabase
        .from('notifications')
        .update({ readers: updatedReaders })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId 
              ? { ...n, readers: updatedReaders }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Helper function to get the appropriate icon for each notification type
  const getNotificationIcon = (type: 'post' | 'course' | 'affiliate' | 'follow' | 'merch', notificationContent: string) => {
    switch (type) {
      case 'post':
        // Check if the notification content contains "liked" or "commented"
        const isLike = notificationContent.includes('liked');
        const isComment = notificationContent.includes('commented');
        
        if (isLike) {
          return <Heart className="h-6 w-6 text-red-500" />;
        } else if (isComment) {
          return <MessageCircle className="h-6 w-6 text-blue-500" />;
        } else {
          return <Bell className="h-6 w-6 text-yellow-500" />;
        }
      case 'course':
        return <img src="/lovable-uploads/course.png" alt="Course" className="h-6 w-6" />;
      case 'affiliate':
      case 'follow':
        return <UserPlus className="h-6 w-6 text-purple-500" />;
      case 'merch':
        return <img src="/lovable-uploads/merch.png" alt="Affiliate" className="h-6 w-6" />;
      default:
        return <Bell className="h-6 w-6 text-yellow-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative">
        <Bell className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[396px] h-[640px] bg-[#1E1E20] text-white rounded-lg shadow-lg border border-[#2C2C30] p-6 flex flex-col">
        <div className="-mx-6 pb-2">
          <h2 className="text-lg font-bold px-6">Notifications</h2>
          <hr className="border-t border-[#2C2C30] mt-2 -mx-6" />
        </div>
        <div className="flex-1 overflow-y-auto scrollable-content">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`pl-2 pr-4 py-4 last:border-0 cursor-pointer flex items-start space-x-2`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex-shrink-0 bg-[#161617] rounded-full flex items-center justify-center" style={{ width: '48px', height: '48px' }}>
                  {getNotificationIcon(notification.type, notification.content)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{notification.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <hr className="border-t border-[#2C2C30] mt-4 -mx-6" />
        <div className="text-left mt-2 px-6">
          <button onClick={() => navigate('/notifications')} className="text-blue-500 hover:underline">See all notifications</button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
