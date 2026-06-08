import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Link, Image as ImageIcon, Smile, Paperclip, X, GalleryHorizontal } from 'lucide-react';
import { Conversation, Message } from '@/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { usePresence } from '@/hooks/usePresence';
import { OnlineIndicator } from './OnlineIndicator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageThreadProps {
  conversation: Conversation;
  currentUserId?: string;
  onMessageSent?: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  currentUserId,
  onMessageSent
}) => {
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [attachments, setAttachments] = useState<{ url: string; type: string; name: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { isUserOnline } = usePresence();

  const { data: messages, isLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            is_read,
            attachments,
            sender:profiles!sender_id (
              id,
              first_name,
              last_name,
              username,
              avatar_url
            )
          `)
          .eq('conversation_id', conversation.id)
          .order('created_at');

        if (error) {
          console.error('Error fetching messages:', error);
          toast({
            title: 'Error',
            description: error.message || 'Failed to load messages',
            variant: 'destructive',
          });
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('Unexpected error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while loading messages',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: !!conversation.id,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!conversation.id) return;
    
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, () => {
        refetchMessages();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to messages for conversation ${conversation.id}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to messages channel');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, refetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId || (!messageText.trim() && attachments.length === 0)) return;
    
    setIsSending(true);
    
    try {
      const messageContent = messageText.trim();
      const hasAttachments = attachments.length > 0;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: messageContent,
          attachments: hasAttachments ? attachments : null,
        });
        
      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to send message',
          variant: 'destructive',
        });
        return;
      }
      
      setMessageText('');
      setAttachments([]);
      
      refetchMessages();
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (files: FileList | null, fileType: 'document' | 'image' = 'document') => {
    if (!files || files.length === 0 || !currentUserId) return;
    
    setIsUploading(true);
    
    try {
      console.log(`Uploading ${fileType === 'image' ? 'images' : 'files'} to messages bucket...`);
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileName = `${currentUserId}/${timestamp}_${randomString}.${fileExt}`;
        
        console.log(`Uploading ${fileType} with name: ${fileName}`);
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('messages')
          .upload(fileName, file);
          
        if (uploadError) {
          console.error(`Error uploading ${fileType}:`, uploadError);
          throw uploadError;
        }
        
        console.log('Upload successful:', uploadData);
        
        const { data: urlData } = supabase.storage
          .from('messages')
          .getPublicUrl(fileName);
          
        console.log(`${fileType} public URL:`, urlData.publicUrl);
        
        return { 
          url: urlData.publicUrl, 
          type: file.type, 
          name: file.name 
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      setAttachments(prev => [
        ...prev, 
        ...uploadedFiles
      ]);
      
      toast({
        title: 'Upload successful',
        description: `${uploadedFiles.length} ${fileType === 'image' ? 'image(s)' : 'file(s)'} uploaded successfully`,
      });
    } catch (error: any) {
      console.error(`Error uploading ${fileType}:`, error);
      
      let errorMessage = error?.message || 'Failed to upload file';
      if (errorMessage.includes('bucket not found')) {
        errorMessage = 'Messages storage bucket not found. Please contact an administrator.';
      }
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileType === 'document' && fileInputRef.current) {
        fileInputRef.current.value = '';
      } else if (fileType === 'image' && imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleLinkInsert = () => {
    if (!linkUrl.trim()) {
      setShowLinkInput(false);
      return;
    }
    
    let formattedUrl = linkUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    setMessageText(prev => {
      const cursorPosition = document.activeElement instanceof HTMLInputElement 
        ? document.activeElement.selectionStart || prev.length 
        : prev.length;
        
      return prev.slice(0, cursorPosition) + formattedUrl + prev.slice(cursorPosition);
    });
    
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setMessageText(prev => prev + emoji.native);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getParticipantName = () => {
    const participant = conversation.participants[0];
    if (!participant) return 'Unknown';
    return participant.first_name && participant.last_name
      ? `${participant.first_name} ${participant.last_name}`
      : participant.username || 'Unknown';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const participantId = conversation.participants[0]?.id;
  const isParticipantOnline = participantId ? isUserOnline(participantId) : false;

  const renderAttachments = (attachmentList: any[] | null) => {
    if (!attachmentList || !Array.isArray(attachmentList) || attachmentList.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2">
        {attachmentList.map((attachment, index) => {
          const isImage = attachment.type?.startsWith('image/');
          
          return isImage ? (
            <div key={index} className="rounded overflow-hidden">
              <img 
                src={attachment.url} 
                alt={attachment.name || 'Attachment'} 
                className="max-w-full max-h-48 object-contain"
              />
            </div>
          ) : (
            <a 
              key={index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-[#252525] rounded hover:bg-[#303030] transition-colors"
            >
              <Paperclip className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300 truncate">
                {attachment.name || 'Attachment'}
              </span>
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#2A2A2A] flex items-center">
        <div className="relative">
          <Avatar className="h-10 w-10 mr-3 border border-[#3A3A3C]">
            <AvatarImage 
              src={conversation.participants[0]?.avatar_url || undefined}
              alt={getParticipantName()}
            />
            <AvatarFallback className="bg-[#B69C6C] text-white">
              {getInitials(getParticipantName())}
            </AvatarFallback>
          </Avatar>
          <OnlineIndicator 
            isOnline={isParticipantOnline} 
            className="absolute bottom-0 right-0 h-2.5 w-2.5 mr-3 ring-[#1A1A1C]" 
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">{getParticipantName()}</h3>
            {isParticipantOnline && (
              <span className="text-xs font-medium text-[#4ADE80]">Online</span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {conversation.participants[0]?.username ? `${conversation.participants[0].username}` : ''}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <div key={index} className={`flex items-start gap-3 ${index % 2 === 0 ? '' : 'justify-end'}`}>
              {index % 2 === 0 && <Skeleton className="h-10 w-10 rounded-full" />}
              <div className={`space-y-1 ${index % 2 === 0 ? '' : 'items-end'}`}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-48 rounded-xl" />
              </div>
              {index % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full" />}
            </div>
          ))
        ) : messages?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages?.map((message) => {
            const isSender = message.sender_id === currentUserId;
            
            return (
              <div 
                key={message.id}
                className={`flex items-start gap-3 ${isSender ? 'justify-end' : ''}`}
              >
                {!isSender && (
                  <Avatar className="h-8 w-8 mt-1 border border-[#3A3A3C]">
                    <AvatarImage 
                      src={message.sender?.avatar_url || undefined}
                      alt={message.sender?.username || 'User'}
                    />
                    <AvatarFallback className="bg-[#B69C6C] text-white text-xs">
                      {getInitials(
                        message.sender?.first_name && message.sender?.last_name
                          ? `${message.sender.first_name} ${message.sender.last_name}`
                          : message.sender?.username || 'UN'
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`space-y-1 ${isSender ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{message.sender?.first_name} {message.sender?.last_name}</h3>
                    <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-xl max-w-md break-words ${
                      isSender
                        ? 'bg-[#161617] text-[#A3A3A3] rounded-tr-none'
                        : 'bg-[#161617] text-[#A3A3A3] rounded-tl-none'
                    }`}
                  >
                    {message.content}
                    {message.attachments && renderAttachments(Array.isArray(message.attachments) ? message.attachments : [])}
                  </div>
                </div>
                
                {isSender && (
                  <Avatar className="h-8 w-8 mt-1 border border-[#3A3A3C]">
                    <AvatarImage 
                      src={message.sender?.avatar_url || undefined}
                      alt={message.sender?.username || 'User'}
                    />
                    <AvatarFallback className="bg-[#B69C6C] text-white text-xs">
                      {getInitials(
                        message.sender?.first_name && message.sender?.last_name
                          ? `${message.sender.first_name} ${message.sender.last_name}`
                          : message.sender?.username || 'UN'
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form 
        onSubmit={handleSendMessage} 
        className="flex flex-col justify-between p-5 border-t border-[#2A2A2A] bg-[#1E1E20] w-full"
        style={{ minHeight: '136px' }}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-[#252525] px-2 py-1 rounded-lg">
                <span className="text-xs text-gray-300 truncate max-w-[120px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {showLinkInput && (
          <div className="mb-3 flex gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="bg-[#252525] border-none text-[#A3A3A3] focus:outline-none focus:ring-0"
            />
            <Button 
              type="button" 
              onClick={handleLinkInsert}
              size="sm"
              className="bg-[#B69C6C] text-white rounded-md"
            >
              Insert
            </Button>
            <Button 
              type="button" 
              onClick={() => setShowLinkInput(false)}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        )}
        
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type something..."
          className="bg-transparent border-none text-[#A3A3A3] placeholder-[#A3A3A3] mb-3 focus:outline-none focus:ring-0"
          disabled={isSending || isUploading}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => setShowLinkInput(true)}
              className="text-[#A3A3A3] hover:text-white transition-colors"
              disabled={isSending || isUploading}
            >
              <Link className="h-5 w-5" />
            </button>
            
            <button 
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="text-[#A3A3A3] hover:text-white transition-colors"
              disabled={isSending || isUploading}
              title="Upload an image"
            >
              <img src="lovable-uploads/gallery.png" alt="" />
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files, 'image')}
              />
            </button>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#A3A3A3] hover:text-white transition-colors"
              disabled={isSending || isUploading}
              title="Upload a file"
            >
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf,video/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                multiple
                onChange={(e) => handleFileUpload(e.target.files, 'document')}
              />
            </button>
            
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  type="button"
                  className="text-[#A3A3A3] hover:text-white transition-colors"
                  disabled={isSending || isUploading}
                >
                  <Smile className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 border-none" align="start" side="top">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button 
            type="submit" 
            size="sm"
            disabled={(!messageText.trim() && attachments.length === 0) || isSending || isUploading}
            className="bg-[#B69C6C] text-white rounded-md"
          >
            {isSending || isUploading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
};
