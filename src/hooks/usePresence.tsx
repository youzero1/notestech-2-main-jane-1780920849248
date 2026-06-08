
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Create a presence channel for tracking online users
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Set up presence handlers
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = Object.values(state).flatMap(
          presence => presence.map((p: any) => p.user_id)
        );
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          const newUserIds = newPresences.map((p: any) => p.user_id);
          return [...new Set([...prev, ...newUserIds])];
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers(prev => {
          const leftUserIds = leftPresences.map((p: any) => p.user_id);
          return prev.filter(id => !leftUserIds.includes(id));
        });
      });

    // Subscribe to the channel and track the user's presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  return { 
    onlineUsers, 
    isUserOnline: (userId: string) => onlineUsers.includes(userId) 
  };
}
