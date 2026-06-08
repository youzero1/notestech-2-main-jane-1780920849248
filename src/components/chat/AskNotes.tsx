
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SendHorizontal, Globe, Upload, Loader2, FileText, Image, File } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

type FilePreview = {
  name: string;
  type: string;
  url?: string;
};

type Message = {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
  files?: FilePreview[];
  id?: number;
};

export const AskNotes = () => {
  const [message, setMessage] = useState("");
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi! I'm ASK Notes, your AI business consultant. How can I help you with your business needs today?",
      isUser: false,
      id: Date.now(),
    },
  ]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<string | null>(null);

  const loadPreviousMessages = useCallback(async (sessionId: string, cursor?: string) => {
    if (!user) return;
    
    try {
      setIsLoadingMore(true);
      
      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('search_enabled')
        .eq('id', sessionId)
        .single();
      
      if (sessionData) {
        setIsSearchEnabled(sessionData.search_enabled || false);
      }
      
      const messagesQuery = supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (cursor) {
        messagesQuery.lt('created_at', cursor);
      }
      
      const { data: messagesData, error } = await messagesQuery;
      
      if (error) throw error;
      
      if (messagesData && messagesData.length > 0) {
        const transformedMessages = messagesData.map(msg => ({
          text: msg.content,
          isUser: msg.role === 'user',
          timestamp: msg.created_at,
        }));
        
        setOldestMessageTimestamp(messagesData[messagesData.length - 1].created_at);
        
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .lt('created_at', messagesData[messagesData.length - 1].created_at);
        
        setHasMoreMessages(count !== null && count > 0);
        
        if (cursor) {
          setMessages(prev => [...transformedMessages.reverse(), ...prev]);
        } else {
          setMessages([...transformedMessages.reverse()]);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading previous messages:', error);
      toast({
        title: "Error",
        description: "Failed to load message history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (sessionId) {
      loadPreviousMessages(sessionId);
    }
  }, [sessionId, loadPreviousMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || isLoadingMore) return;
    
    const { scrollTop } = messagesContainerRef.current;
    
    if (scrollTop < 50 && sessionId && oldestMessageTimestamp) {
      loadPreviousMessages(sessionId, oldestMessageTimestamp);
    }
  }, [hasMoreMessages, isLoadingMore, sessionId, oldestMessageTimestamp, loadPreviousMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !filePreview) return;

    try {
      if (filePreview) {
        await handleFileSubmit();
        return;
      }

      const userMessageId = Date.now();
      const userMessageObj = { text: message, isUser: true, id: userMessageId };
      setMessages(prev => [...prev, userMessageObj]);
      
      // Add a unique ID for the loading message
      const loadingMessageId = Date.now() + 1;
      setMessages(prev => [
        ...prev,
        {
          text: isSearchEnabled 
            ? "Searching the web for the most up-to-date information..." 
            : "Analyzing your question...",
          isUser: false,
          isLoading: true,
          id: loadingMessageId
        },
      ]);
      
      const userMessage = message;
      setMessage("");
      
      if (!user) {
        setTimeout(() => {
          // Remove the loading message by filtering it out
          setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
          
          setMessages(prev => [
            ...prev,
            {
              text: isSearchEnabled
                ? "Based on the latest information I found online, I can help with your business needs. The key strategies for growth in 2024 include focusing on digital transformation, sustainability initiatives, and personalized customer experiences."
                : "I'm happy to help with your business question. To grow your business effectively, consider focusing on these key areas: 1) Customer experience optimization, 2) Digital marketing strategy, 3) Operational efficiency, and 4) Product innovation based on market trends.",
              isUser: false,
              id: Date.now() + 2
            },
          ]);
          
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 2000);
        return;
      }
      
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession) {
        throw new Error("You must be logged in to use this feature");
      }
      
      const token = authSession.access_token;
      
      const { data, error } = await supabase.functions.invoke("ask-notes", {
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId,
          useSearch: isSearchEnabled
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        throw error;
      }
      
      // Remove the loading message by filtering it out
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      setMessages(prev => [
        ...prev,
        {
          text: data.response || "I'm not sure how to respond to that. Can you try asking in a different way?",
          isUser: false,
          id: Date.now() + 3
        },
      ]);
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove any loading messages on error
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleFileSubmit = async () => {
    if (!filePreview) return;
    
    try {
      setIsUploading(true);
      
      const userFileMessageId = Date.now();
      setMessages(prev => [
        ...prev,
        {
          text: `Uploaded: ${filePreview.name}`,
          isUser: true,
          files: [filePreview],
          id: userFileMessageId
        },
      ]);
      
      const loadingMessageId = Date.now() + 1;
      setMessages(prev => [
        ...prev,
        {
          text: "Analyzing your uploaded file...",
          isUser: false,
          isLoading: true,
          id: loadingMessageId
        },
      ]);
      
      if (!user) {
        setTimeout(() => {
          // Remove the loading message by filtering it out
          setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
          
          setMessages(prev => [
            ...prev,
            {
              text: `I've analyzed your file "${filePreview.name}". This appears to be ${filePreview.type.startsWith('image/') ? 'an image showing a business chart' : 'a document containing business information'}. Would you like me to extract specific insights or explain something about it?`,
              isUser: false,
              id: Date.now() + 2
            },
          ]);
          
          setFilePreview(null);
          setIsUploading(false);
          
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 2500);
        return;
      }
      
      const blob = await fetch(filePreview.url!).then(res => res.blob());
      const file = new globalThis.File([blob], filePreview.name, { type: filePreview.type });
      
      const reader = new globalThis.FileReader();
      
      const fileReadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
      });
      
      reader.readAsDataURL(file);
      const base64data = await fileReadPromise;
      
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession) {
        throw new Error("You must be logged in to use this feature");
      }
      
      const token = authSession.access_token;
      
      const fileMessage = message || "Please analyze this file and provide insights.";
      
      const { data, error } = await supabase.functions.invoke("process-file", {
        body: JSON.stringify({
          fileData: base64data,
          fileName: filePreview.name,
          fileType: filePreview.type,
          fileSize: file.size,
          sessionId: sessionId,
          message: fileMessage
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Remove the loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      setMessages(prev => [
        ...prev,
        {
          text: data.summary || `I've analyzed your file "${filePreview.name}". Would you like me to extract specific insights or explain something about it?`,
          isUser: false,
          id: Date.now() + 3
        },
      ]);
      
      setFilePreview(null);
      setMessage("");
      
    } catch (error) {
      console.error("Error processing file:", error);
      
      // Remove any loading messages on error
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchEnabled(!isSearchEnabled);
    toast({
      title: isSearchEnabled ? "Web search disabled" : "Web search enabled",
      description: isSearchEnabled 
        ? "I'll respond based on my training data only." 
        : "I'll search the web to give you the most up-to-date information.",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    const fileUrl = URL.createObjectURL(file);
    const newFilePreview = {
      name: file.name,
      type: file.type,
      url: fileUrl
    };
    
    setTimeout(() => {
      setIsUploading(false);
      setFilePreview(newFilePreview);
      
      toast({
        title: "File selected",
        description: `${file.name} has been selected. Press send to upload and analyze.`,
      });
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 800);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const renderFilePreview = (file: FilePreview) => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative w-32 h-32 overflow-hidden border rounded">
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        </div>
      );
    } else if (file.type.includes('pdf')) {
      return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
          <FileText className="h-5 w-5 text-red-500" />
          <span className="text-sm truncate">{file.name}</span>
        </div>
      );
    } else if (file.type.startsWith('text/')) {
      return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
          <File className="h-5 w-5 text-blue-500" />
          <span className="text-sm truncate">{file.name}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
          <File className="h-5 w-5 text-gray-500" />
          <span className="text-sm truncate">{file.name}</span>
        </div>
      );
    }
  };

  return (
    <Card className="flex flex-col flex-grow h-full relative">
      <div className="p-2 border-b">
        <h2 className="text-lg font-semibold">Ask Notes</h2>
        <p className="text-xs text-gray-500">Your AI Business Consultant</p>
      </div>
      <div 
        className="flex-1 overflow-hidden p-4 min-h-[375px]" 
        ref={messagesContainerRef}
      >
        <ScrollArea className="h-full">
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id || `msg-${Math.random()}`}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-lg text-sm ${
                    msg.isUser
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {msg.text}
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-2">
                          {msg.files.map((file, fileIdx) => (
                            <div key={fileIdx} className="mt-2">
                              {renderFilePreview(file)}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      <form onSubmit={handleSubmit} className="p-2 border-t">
        <div className="relative">
          {filePreview && !isUploading && (
            <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center">
              {filePreview.type.startsWith('image/') ? (
                <Image className="h-4 w-4 mr-2 text-gray-500" />
              ) : (
                <File className="h-4 w-4 mr-2 text-gray-500" />
              )}
              <span className="text-xs text-gray-600 truncate">{filePreview.name}</span>
              <Button 
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-6 w-6 p-0 text-gray-400"
                onClick={() => setFilePreview(null)}
              >
                ×
              </Button>
            </div>
          )}
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about business topics..."
            className="pr-24 pl-3 py-6 bg-gray-50 border-0 rounded-full shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
            disabled={isUploading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            <div className="flex space-x-1 bg-gray-100 rounded-full p-1">
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button 
                type="button" 
                size="icon" 
                variant={isUploading || filePreview ? "secondary" : "ghost"}
                className="h-8 w-8 rounded-full"
                onClick={triggerFileUpload}
                disabled={isUploading || !!filePreview}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              <Button 
                type="button" 
                size="icon" 
                variant={isSearchEnabled ? "secondary" : "ghost"}
                className="h-8 w-8 rounded-full" 
                onClick={toggleSearch}
              >
                <Globe className="h-4 w-4" />
              </Button>
              <Button 
                type="submit" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                disabled={(!message.trim() && !filePreview) || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
};
