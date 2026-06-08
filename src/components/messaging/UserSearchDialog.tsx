
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation } from '@/types/messaging';
import { useToast } from '@/components/ui/use-toast';

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversation: Conversation) => void;
  currentUserId?: string;
}

export const UserSearchDialog: React.FC<UserSearchDialogProps> = ({
  open,
  onOpenChange,
  onConversationCreated,
  currentUserId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { toast } = useToast();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUser(null);
    }
  }, [open]);

  // Search users when search term changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || !currentUserId) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .or(`username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .neq('id', currentUserId)
          .limit(10);
          
        if (error) {
          throw error;
        }
        
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to search users',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounce = setTimeout(searchUsers, 300);
    
    return () => clearTimeout(debounce);
  }, [searchTerm, currentUserId, toast]);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
  };

  const handleCreateConversation = async () => {
    if (!selectedUser || !currentUserId) return;
    
    setIsCreatingConversation(true);
    
    try {
      // Check if a conversation already exists between these users
      const { data: existingParticipants, error: checkError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', currentUserId);
        
      if (checkError) throw checkError;
      
      const conversationIds = existingParticipants?.map(p => p.conversation_id) || [];
      
      if (conversationIds.length > 0) {
        const { data: otherParticipants, error: otherError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, profile_id')
          .in('conversation_id', conversationIds)
          .eq('profile_id', selectedUser.id);
          
        if (otherError) throw otherError;
        
        // If conversation exists, get it and return it
        if (otherParticipants && otherParticipants.length > 0) {
          const existingConversationId = otherParticipants[0].conversation_id;
          
          // Get the conversation details
          const { data: conversationData, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', existingConversationId)
            .single();
            
          if (convError) throw convError;
          
          const conversation: Conversation = {
            id: conversationData.id,
            created_at: conversationData.created_at,
            updated_at: conversationData.updated_at,
            last_message: conversationData.last_message,
            participants: [selectedUser],
            unread_count: 0,
          };
          
          onConversationCreated(conversation);
          onOpenChange(false);
          return;
        }
      }
      
      // Create a new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
        
      if (createError) throw createError;
      
      // Add both users as participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, profile_id: currentUserId },
          { conversation_id: newConversation.id, profile_id: selectedUser.id },
        ]);
        
      if (participantError) throw participantError;
      
      const conversation: Conversation = {
        id: newConversation.id,
        created_at: newConversation.created_at,
        updated_at: newConversation.updated_at,
        last_message: null,
        participants: [selectedUser],
        unread_count: 0,
      };
      
      onConversationCreated(conversation);
      onOpenChange(false);
      
      toast({
        title: 'Success',
        description: 'Conversation created successfully',
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const getUserDisplayName = (user: any) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1C] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for users by name or username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0F0F11] border-[#2A2A2A] text-white focus-visible:ring-[#B69C6C]"
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-[#B69C6C]" />
            </div>
          ) : searchResults.length === 0 && searchTerm ? (
            <div className="text-center py-4 text-gray-400">
              <p>No users found</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                    selectedUser?.id === user.id
                      ? 'bg-[#2A2A2A]'
                      : 'hover:bg-[#0F0F11]'
                  }`}
                >
                  <Avatar className="h-10 w-10 border border-[#3A3A3C]">
                    <AvatarImage
                      src={user.avatar_url || undefined}
                      alt={getUserDisplayName(user)}
                    />
                    <AvatarFallback className="bg-[#B69C6C] text-white">
                      {getInitials(getUserDisplayName(user))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getUserDisplayName(user)}</p>
                    {user.username && (
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              onClick={handleCreateConversation}
              disabled={!selectedUser || isCreatingConversation}
              className="bg-[#B69C6C] hover:bg-[#9a8259] text-white"
            >
              {isCreatingConversation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Start Conversation'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
