
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoConversationSelectedProps {
  onStartNewConversation: () => void;
}

export const NoConversationSelected: React.FC<NoConversationSelectedProps> = ({
  onStartNewConversation
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-[#B69C6C]" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">Your Messages</h3>
      <p className="text-gray-400 mb-6 max-w-md">
        Connect with other members through private messages. Start a new conversation or select an existing one.
      </p>
      <Button onClick={onStartNewConversation}>Start a New Conversation</Button>
    </div>
  );
};
