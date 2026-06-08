
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { MessagingLayout } from '@/components/messaging/MessagingLayout';
import { ConversationsList } from '@/components/messaging/ConversationsList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { NoConversationSelected } from '@/components/messaging/NoConversationSelected';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserSearchDialog } from '@/components/messaging/UserSearchDialog';
import { Conversation } from '@/types/messaging';
import { useToast } from '@/components/ui/use-toast';
import { usePresence } from '@/hooks/usePresence';

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  
  // Initialize presence hook
  const presence = usePresence();

  const { data: conversations, isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data: userConversations, error: convError } = await supabase
          .rpc('get_user_conversations', { user_id: user.id });
        
        if (convError) {
          console.error('Error fetching conversations:', convError);
          toast({
            title: 'Error',
            description: convError.message || 'Failed to load conversations',
            variant: 'destructive',
          });
          return [];
        }
        
        if (!userConversations || userConversations.length === 0) {
          return [];
        }
        
        const conversationIds = userConversations.map(c => c.id);
        
        const { data: participants, error: partError } = await supabase
          .from('profiles')
          .select(`
            id, 
            first_name, 
            last_name, 
            username, 
            avatar_url,
            conversation_participants!inner(conversation_id)
          `)
          .in('conversation_participants.conversation_id', conversationIds)
          .neq('id', user.id);
        
        if (partError) {
          console.error('Error fetching participants:', partError);
          toast({
            title: 'Error',
            description: 'Failed to load conversation participants',
            variant: 'destructive',
          });
          return [];
        }
        
        const conversationMap: Record<string, Conversation> = {};
        
        userConversations.forEach(conv => {
          conversationMap[conv.id] = {
            id: conv.id,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            last_message: conv.last_message,
            unread_count: conv.unread_count || 0,
            participants: []
          };
        });
        
        participants?.forEach(participant => {
          const convId = participant.conversation_participants[0]?.conversation_id;
          if (convId && conversationMap[convId]) {
            const { conversation_participants, ...profileData } = participant;
            conversationMap[convId].participants.push(profileData);
          }
        });
        
        return Object.values(conversationMap).sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      } catch (error: any) {
        console.error('Unexpected error loading conversations:', error);
        toast({
          title: 'Error',
          description: error?.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('conversation-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        refetchConversations();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_participants',
        filter: `profile_id=eq.${user.id}`
      }, () => {
        refetchConversations();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        refetchConversations();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to conversation updates');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to conversation updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchConversations]);

  useEffect(() => {
    if (selectedConversation && conversations) {
      const updatedConversation = conversations.find(c => c.id === selectedConversation.id);
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      }
    }
  }, [conversations, selectedConversation]);

  const handleStartNewConversation = () => {
    setIsSearchDialogOpen(true);
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    if (user && conversation.unread_count > 0) {
      try {
        // Update the last_read_at timestamp for this conversation
        const { error } = await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversation.id)
          .eq('profile_id', user.id);
          
        if (error) {
          console.error('Error updating last_read_at:', error);
        } else {
          // Refresh the conversations to update unread counts
          refetchConversations();
        }
      } catch (err) {
        console.error('Error updating read status:', err);
      }
    }
  };

  const handleConversationCreated = (conversation: Conversation) => {
    refetchConversations();
    setSelectedConversation(conversation);
    setIsSearchDialogOpen(false);
  };

  const handleMessageSent = () => {
    refetchConversations();
    
    // When sending a message, also update the last_read_at timestamp
    if (user && selectedConversation) {
      supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConversation.id)
        .eq('profile_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating last_read_at after message sent:', error);
          }
        });
    }
  };

  return (
    <DashboardLayout headerTitle="Messages">
      <MessagingLayout 
        conversationsList={
          <ConversationsList 
            conversations={conversations || []}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            onStartNewConversation={handleStartNewConversation}
            isLoading={isLoadingConversations}
          />
        }
        messageThread={
          selectedConversation ? (
            <MessageThread 
              conversation={selectedConversation}
              currentUserId={user?.id}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <NoConversationSelected onStartNewConversation={handleStartNewConversation} />
          )
        }
      />
      
      <UserSearchDialog 
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onConversationCreated={handleConversationCreated}
        currentUserId={user?.id}
      />
    </DashboardLayout>
  );
};

export default Messages;
