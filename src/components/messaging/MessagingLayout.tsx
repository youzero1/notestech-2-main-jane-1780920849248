import React from 'react';

interface MessagingLayoutProps {
  conversationsList: React.ReactNode;
  messageThread: React.ReactNode;
}

export const MessagingLayout: React.FC<MessagingLayoutProps> = ({
  conversationsList,
  messageThread,
}) => {
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-13rem)] rounded-2xl overflow-hidden border border-[#2A2A2A] bg-[#1A1A1C]">
      <div className="w-full md:w-[320px] bg-[#1E1E20] flex-shrink-0 overflow-hidden md:mr-4">
        {conversationsList}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#1E1E20]">
        {messageThread}
      </div>
    </div>
  );
};
