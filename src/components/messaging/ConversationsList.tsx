import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Conversation } from '@/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePresence } from '@/hooks/usePresence';
import { OnlineIndicator } from './OnlineIndicator';
import { Badge } from '@/components/ui/badge';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onStartNewConversation: () => void;
  isLoading: boolean;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onStartNewConversation,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isUserOnline, onlineUsers } = usePresence();
  
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [onlineUsers]);

  const filteredConversations = conversations.filter(conversation => {
    const participantNames = conversation.participants.map(
      p => `${p.first_name || ''} ${p.last_name || ''} ${p.username || ''}`.toLowerCase()
    );
    return participantNames.some(name => name.includes(searchTerm.toLowerCase()));
  });

  const getParticipantName = (conversation: Conversation) => {
    const participant = conversation.participants[0];
    if (!participant) return 'Unknown';
    return participant.first_name && participant.last_name
      ? `${participant.first_name} ${participant.last_name}`
      : participant.username || 'Unknown';
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateMessage = (message: string, maxLength = 30) => {
    if (!message) return '';
    return message.length > maxLength 
      ? `${message.slice(0, maxLength)}...` 
      : message;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-medium">Messages</h2>
          <Button 
            onClick={onStartNewConversation}
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-[#2A2A2A]"
          >
            <img src="/lovable-uploads/Add.png" alt="" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 h-10 bg-[#1C1C1E] border-0 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-xl mb-1">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No conversations found</p>
            <Button 
              onClick={onStartNewConversation}
              variant="link"
              className="mt-2 text-primary"
            >
              Start a new conversation
            </Button>
          </div>
        ) : (
          filteredConversations.map(conversation => {
            const name = getParticipantName(conversation);
            const isSelected = conversation.id === selectedConversationId;
            const participantId = conversation.participants[0]?.id;
            const isOnline = participantId ? isUserOnline(participantId) : false;
            const hasUnread = conversation.unread_count > 0;
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`flex items-center gap-3 p-3 rounded-xl mb-1 cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#2A2A2A]' : 'hover:bg-[#1C1C1E]'
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border border-[#3A3A3C]">
                    <AvatarImage 
                      src={conversation.participants[0]?.avatar_url || undefined}
                      alt={name}
                    />
                    <AvatarFallback className="bg-[#B69C6C] text-white">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <OnlineIndicator 
                    isOnline={isOnline} 
                    className={`absolute bottom-0 right-0 h-3 w-3 ring-[#1A1A1C] ${isOnline ? 'bg-green' : 'bg-gray'}`} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">{name}</h3>
                      {hasUnread && (
                        <Badge 
                          variant="default" 
                          className="bg-[#B69C6C] text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 ml-2"
                        >
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {new Date(conversation.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${hasUnread ? 'text-white font-medium' : 'text-gray-400'} mt-0`}>
                    {conversation.last_message 
                      ? truncateMessage(conversation.last_message) 
                      : "Start a conversation..."}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
