import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, SendHorizontal, Globe, Upload, X, FileText, File, Image, MessageSquare, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';

type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  search_enabled?: boolean;
};

type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
};

type GroupedSession = {
  date: string;
  label: string;
  sessions: ChatSession[];
};

type ChatAttachment = {
  id?: string;
  filename: string;
  file_type: string;
  file_path?: string;
  public_url?: string;
  file?: File;
};

const AskRakim = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<GroupedSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [fileResponseReceived, setFileResponseReceived] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const todayStr = today.toISOString();
      const yesterdayStr = yesterday.toISOString();
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();
      
      const { data: sessionData, error } = await supabase
        .from('rakim_chat_sessions')
        .select('*, rakim_chat_attachments(*)')
        .gte('created_at', sevenDaysAgoStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped: GroupedSession[] = [];
      
      const todaySessions: ChatSession[] = [];
      const yesterdaySessions: ChatSession[] = [];
      const lastWeekSessions: ChatSession[] = [];

      sessionData?.forEach(session => {
        const sessionDate = new Date(session.created_at);
        
        if (sessionDate >= today) {
          todaySessions.push(session);
        } else if (sessionDate >= yesterday) {
          yesterdaySessions.push(session);
        } else if (sessionDate >= sevenDaysAgo) {
          lastWeekSessions.push(session);
        }
      });

      if (todaySessions.length > 0) {
        grouped.push({ date: 'today', label: 'Today', sessions: todaySessions });
      }
      
      if (yesterdaySessions.length > 0) {
        grouped.push({ date: 'yesterday', label: 'Yesterday', sessions: yesterdaySessions });
      }
      
      if (lastWeekSessions.length > 0) {
        grouped.push({ date: 'last-week', label: 'Previous 7 Days', sessions: lastWeekSessions });
      }

      setSessions(grouped);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load your chat history",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (sessionId: string, cursor?: string, isInitialLoad = false) => {
    try {
      if (isFileProcessing && fileResponseReceived) {
        console.log("Skipping fetchMessages during file processing");
        return;
      }

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsLoadingMoreMessages(true);
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('rakim_chat_sessions')
        .select('search_enabled')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      
      setIsSearchEnabled(sessionData?.search_enabled || false);
      
      let messagesQuery = supabase
        .from('rakim_chat_messages')
        .select('*')
        .eq('session_id', sessionId);
      
      if (cursor) {
        messagesQuery = messagesQuery
          .lt('id', cursor)
          .order('created_at', { ascending: false });
      } else {
        messagesQuery = messagesQuery
          .order('created_at', { ascending: false });
      }
      
      messagesQuery = messagesQuery.limit(15);
      
      const { data, error } = await messagesQuery;

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setHasMoreMessages(false);
        if (isInitialLoad) {
          setMessages([]);
        }
        return;
      }
      
      if (data.length > 0) {
        setOldestMessageId(data[data.length - 1].id);
        
        const { count } = await supabase
          .from('rakim_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .lt('id', data[data.length - 1].id);
        
        setHasMoreMessages(count !== null && count > 0);
      } else {
        setHasMoreMessages(false);
      }
      
      const formattedMessages: ChatMessage[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        created_at: msg.created_at
      })).reverse();
      
      if (cursor) {
        setMessages(prevMessages => [...prevMessages, ...formattedMessages]);
      } else {
        setMessages(formattedMessages);
      }

      const { data: attachmentData, error: attachmentError } = await supabase
        .from('rakim_chat_attachments')
        .select('*')
        .eq('session_id', sessionId);

      if (attachmentError) throw attachmentError;
      
      setAttachments(attachmentData || []);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages for this chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMoreMessages(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId, undefined, true);
    } else {
      setMessages([]);
      setAttachments([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!isFileProcessing || fileResponseReceived) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isFileProcessing, fileResponseReceived]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || isLoadingMoreMessages) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 20;
    
    if (scrolledToBottom && activeSessionId && oldestMessageId) {
      fetchMessages(activeSessionId, oldestMessageId);
    }
  }, [hasMoreMessages, isLoadingMoreMessages, activeSessionId, oldestMessageId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setAttachments([]);
    setPendingFile(null);
    setIsSearchEnabled(false);
    setIsFileProcessing(false);
    setFileResponseReceived(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !pendingFile) return;
    
    if (pendingFile) {
      const userMessage: ChatMessage = {
        id: `upload-${Date.now()}`,
        content: `I've uploaded a file: ${pendingFile.name}. ${message || "Please analyze this file and provide insights."}`,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      const loadingMessage: ChatMessage = {
        id: `loading-${Date.now()}`,
        content: 'Analyzing your uploaded file...',
        role: 'assistant',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage, loadingMessage]);
      setMessage('');
      
      try {
        await processFileUpload(pendingFile);
      } catch (error) {
        setMessages(prev => 
          prev.filter(msg => msg.id !== userMessage.id && msg.id !== loadingMessage.id)
        );
      }
      return;
    }

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: message,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      content: 'Analyze your question...',
      role: 'assistant',
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setMessage('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to use this feature");
      }
      
      const token = session.access_token;
      
      const { data, error } = await supabase.functions.invoke('ask-rakim', {
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: activeSessionId,
          useSearch: isSearchEnabled
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;
      
      if (!data) {
        throw new Error("Invalid response from the server");
      }

      if (Array.isArray(data.response)) {
        const responseMessages = data.response.map((chunk: string, index: number) => ({
          id: `response-${Date.now()}-${index}`,
          content: chunk,
          role: 'assistant',
          created_at: new Date(Date.now() + index * 1000).toISOString(),
        }));
        
        for (let i = 0; i < responseMessages.length; i++) {
          if (i === 0) {
            setMessages(prev => [...prev, responseMessages[i]]);
          } else {
            setTimeout(() => {
              setMessages(prev => [...prev, responseMessages[i]]);
            }, i * 800);
          }
        }
      } else {
        const aiMessage: ChatMessage = {
          id: `response-${Date.now()}`,
          content: data.response || "I'm not sure how to respond to that. Can you try asking in a different way?",
          role: 'assistant',
          created_at: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
      
      if (data.sessionId && !activeSessionId) {
        setActiveSessionId(data.sessionId);
        fetchSessions();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      
      setMessages(prev => 
        prev.filter(msg => msg.id !== userMessage.id && msg.id !== loadingMessage.id)
      );
    }
  };

  const toggleSearch = async () => {
    const newSearchState = !isSearchEnabled;
    setIsSearchEnabled(newSearchState);
    
    if (activeSessionId) {
      try {
        const { error } = await supabase
          .from('rakim_chat_sessions')
          .update({ search_enabled: newSearchState })
          .eq('id', activeSessionId);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: newSearchState ? "Web search enabled" : "Web search disabled",
          description: newSearchState 
            ? "I'll search the web to give you the latest music information." 
            : "I'll respond based on my training data only.",
        });
      } catch (error) {
        console.error('Error updating search preference:', error);
        toast({
          title: "Error",
          description: "Failed to update search preference",
          variant: "destructive",
        });
        setIsSearchEnabled(!newSearchState);
      }
    } else {
      toast({
        title: newSearchState ? "Web search enabled" : "Web search disabled",
        description: "This setting will apply to your next message.",
      });
    }
  };

  const handleFileSelect = (files: File[]) => {
    if (!files.length) return;
    
    setPendingFile(files[0]);
    toast({
      title: "File selected",
      description: `${files[0].name} is ready to upload. Add a message and press send.`,
    });
  };

  const processFileUpload = async (file: File) => {
    try {
      if (!activeSessionId) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("You must be logged in to use this feature");
        }
        
        const { data: sessionData, error: sessionError } = await supabase
          .from("rakim_chat_sessions")
          .insert({
            user_id: user?.id,
            title: `Uploaded ${file.name}`,
            search_enabled: isSearchEnabled
          })
          .select("id")
          .single();
          
        if (sessionError) throw sessionError;
        
        setActiveSessionId(sessionData.id);
        await uploadFile(file, sessionData.id);
        await fetchSessions();
      } else {
        await uploadFile(file, activeSessionId);
      }
    } catch (error) {
      console.error('Error processing file upload:', error);
      throw error;
    } finally {
      setPendingFile(null);
    }
  };

  const uploadFile = async (file: File, sessionId: string) => {
    try {
      const reader = new FileReader();
      
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
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to use this feature");
      }
      
      const token = session.access_token;
      
      const userMessage: ChatMessage = {
        id: `upload-${Date.now()}`,
        content: `I've uploaded a file: ${file.name}. Please analyze this music file and provide insights.`,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      const loadingId = `loading-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: loadingId,
          content: "Analyzing your uploaded music file...",
          role: 'assistant',
          created_at: new Date().toISOString(),
        }
      ]);
      
      const { data, error } = await supabase.functions.invoke('process-file', {
        body: JSON.stringify({
          fileData: base64data,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          sessionId: sessionId,
          message: "Please analyze this music file and provide insights."
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("File processing response:", data);
      
      setFileResponseReceived(true);
      setIsLoading(false);
      
      if (error) throw error;
      
      if (!data || !data.success) {
        throw new Error(data?.error || "Unknown error processing file");
      }
      
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingId);
        
        const aiMessage: ChatMessage = {
          id: `response-${Date.now()}`,
          content: data.summary || data.aiResponse || "I've analyzed your music file. What specific aspects would you like me to discuss?",
          role: 'assistant',
          created_at: new Date().toISOString(),
        };
        
        return [...filtered, aiMessage];
      });
      
      setAttachments(prev => [
        ...prev,
        {
          filename: file.name,
          file_type: file.type,
          public_url: data.publicUrl,
          file_path: data.filePath
        }
      ]);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setIsFileProcessing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsLoading(false);
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading-')));
      throw error;
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4" />;
    } else if (fileType.includes('audio/')) {
      return <MessageSquare className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout headerTitle="Ask Rakim">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] p-2 sm:p-4 lg:p-8 gap-2 sm:gap-4 lg:gap-8">
        <div className="hidden lg:block w-[252px] h-[600px] bg-[#1C1C1C] rounded-[10px] px-8 pt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-[14px] font-normal leading-[21px]">Search History</h2>
          </div>
          
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="space-y-8 pr-4">
              {sessions.map((group) => (
                <div key={group.date}>
                  <h3 className="text-[14px] font-normal leading-[21px] mb-4">
                    {group.label}
                  </h3>
                  <ul className="space-y-4">
                    {group.sessions
                      .slice(0, expandedGroups[group.date] ? undefined : 2)
                      .map((session) => (
                      <li 
                        key={session.id}
                          className={`text-[14px] font-normal leading-[21px] ${
                            activeSessionId === session.id ? 'text-white' : 'text-gray-400'
                          } hover:text-white cursor-pointer flex items-center`}
                        onClick={() => setActiveSessionId(session.id)}
                      >
                          <span className="truncate flex-1">{session.title}</span>
                          {session.search_enabled && (
                            <Globe className="h-3 w-3 ml-1 text-[#987D4D]" />
                          )}
                      </li>
                    ))}
                  </ul>
                  {group.sessions.length > 2 && (
                    <button 
                      className="mt-4 text-[14px] font-normal leading-[21px] text-gray-400 hover:text-white underline underline-offset-4"
                      onClick={() => setExpandedGroups(prev => ({
                        ...prev,
                        [group.date]: !prev[group.date]
                      }))}
                    >
                      {expandedGroups[group.date] ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 w-full">
          <div className="h-[calc(100vh-300px)] lg:h-[600px] bg-[#1C1C1C] rounded-[10px] p-3 sm:p-4 lg:p-10 flex flex-col overflow-hidden" ref={mainContentRef}>
            {!activeSessionId && messages.length === 0 ? (
              <div className="flex flex-col items-center max-w-[800px] mx-auto h-full justify-center p-4">
                <div className="mb-4 lg:mb-8 text-center flex flex-col items-center">
                  <img 
                    src="/lovable-uploads/191f6cc5-8d17-4c96-86ae-351d0abe7237.png" 
                    alt="Rakim" 
                    className="w-20 h-20 lg:w-32 lg:h-32 rounded-full mb-4 object-cover border-2 border-[#987D4D]"
                  />
                  <h1 className="text-xl lg:text-[32px] text-white font-light">What can I help you with?</h1>
                </div>
                
                <form onSubmit={sendMessage} className="w-full">
                  <div className="relative w-full max-w-[696px] mx-auto">
                    <div className="relative">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask Rakim anything ..."
                        className="min-h-[100px] lg:min-h-[144px] w-full lg:w-[696px] bg-black border border-black rounded-[10px] focus-visible:ring-0 text-gray-200 placeholder:text-gray-500 placeholder:text-[14px] lg:placeholder:text-[16px] resize-none p-4 pl-12 lg:pl-12 pr-[100px] lg:pr-[160px] overflow-y-auto lg:overflow-visible"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (message.trim() || pendingFile) {
                              sendMessage(e as any);
                            }
                          }
                        }}
                      />
                      <div className="absolute left-4 top-4">
                        <img 
                          src="/lovable-uploads/Vector.png" 
                          alt="Ask Rakim"
                          className="w-4 h-4 lg:w-[18px] lg:h-[18px]"
                        />
                      </div>

                      {/* Mobile controls */}
                      <div className="absolute right-2 bottom-2 flex items-center gap-1 lg:hidden">
                        <div className="flex items-center gap-1 bg-black rounded-full p-1">
                          <Button
                            type="button"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            variant={isUploading || pendingFile ? "secondary" : "ghost"}
                            onClick={triggerFileInput}
                            disabled={isUploading || !!pendingFile}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <img 
                                src="/lovable-uploads/plus-circle.png" 
                                alt="Add file"
                                className="h-5 w-5 object-contain"
                              />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            variant={isSearchEnabled ? "secondary" : "ghost"}
                            onClick={() => setShowSearchModal(true)}
                          >
                            <img 
                              src="/lovable-uploads/globe.png" 
                              alt="Search"
                              className="h-4 w-4 object-contain"
                            />
                          </Button>
                          <Button 
                            type="submit"
                            size="icon" 
                            className="h-8 w-8 rounded-full bg-[#987D4D] text-white hover:bg-[#987D4D]/90"
                            disabled={isLoading || (!message.trim() && !pendingFile)}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SendHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Desktop controls */}
                      <div className="absolute right-4 bottom-4 hidden lg:flex items-center gap-2">
                        <Button 
                          type="button" 
                          size="icon" 
                          className="h-10 w-10 rounded-full"
                          variant={isUploading || pendingFile ? "secondary" : "ghost"}
                          onClick={triggerFileInput}
                          disabled={isUploading || !!pendingFile}
                        >
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <img 
                              src="/lovable-uploads/plus-circle.png" 
                              alt="Add file"
                              className="h-6 w-6 object-contain"
                            />
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          size="icon" 
                          className="h-10 w-10 rounded-full"
                          variant={isSearchEnabled ? "secondary" : "ghost"}
                          onClick={toggleSearch}
                        >
                          <img 
                            src="/lovable-uploads/globe.png" 
                            alt="Search"
                            className="h-5 w-5 object-contain"
                          />
                        </Button>
                        <Button 
                          type="submit"
                          size="icon" 
                          className="h-10 w-10 rounded-full bg-[#987D4D] text-white hover:bg-[#987D4D]/90"
                          disabled={isLoading || (!message.trim() && !pendingFile)}
                        >
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <SendHorizontal className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <Button
                    variant="ghost"
                    className="flex items-center text-gray-400 hover:text-white"
                    onClick={startNewChat}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex items-center text-gray-400 hover:text-white lg:hidden"
                    onClick={() => setShowHistoryPanel(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mb-3 lg:mb-4 p-2 lg:p-3 bg-[#252525] rounded-lg">
                    <h3 className="text-white text-xs lg:text-sm mb-2">Uploaded Files</h3>
                    <div className="flex flex-wrap gap-1 lg:gap-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id || attachment.filename} 
                          className="bg-[#333333] py-1 px-2 lg:px-3 rounded-full text-[10px] lg:text-xs text-white flex items-center gap-1"
                          title={attachment.filename}
                        >
                          {getFileIcon(attachment.file_type)}
                          <span className="truncate max-w-[100px] lg:max-w-[150px]">{attachment.filename}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden mb-3 lg:mb-4" ref={messagesContainerRef}>
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-6">
                      {isLoading ? (
                        <div className="flex justify-center py-6">
                          {/* <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> */}
                        </div>
                      ) : (
                        <>
                          {messages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`${
                                msg.role === 'user' ? 'bg-[#141414]' : 'bg-[#252525]'
                              } p-4 rounded-lg`}
                            >
                              <div className="flex items-center mb-2">
                                {msg.role === 'user' ? (
                                  <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center bg-blue-700">
                                    U
                                  </div>
                                ) : (
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src="/lovable-uploads/191f6cc5-8d17-4c96-86ae-351d0abe7237.png" alt="Rakim" />
                                    <AvatarFallback className="bg-[#987D4D]">R</AvatarFallback>
                                  </Avatar>
                                )}
                                <span className="text-sm text-gray-400">
                                  {msg.role === 'user' ? 'You' : 'Rakim'}
                                </span>
                              </div>
                              <div className="text-white prose prose-invert prose-sm max-w-none">
                                {msg.id.startsWith('loading-') ? (
                                  <div className="flex items-center">
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    {msg.content}
                                  </div>
                                ) : (
                                  <ReactMarkdown>
                                    {msg.content}
                                  </ReactMarkdown>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {hasMoreMessages && isLoadingMoreMessages && (
                            <div className="flex justify-center py-2">
                              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            </div>
                          )}
                  
                          {isLoading && (
                            <div className="bg-[#252525] p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src="/lovable-uploads/191f6cc5-8d17-4c96-86ae-351d0abe7237.png" alt="Rakim" />
                                  <AvatarFallback className="bg-[#987D4D]">R</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-400">Rakim</span>
                              </div>
                              <div className="flex items-center text-white">
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                {isUploading ? 'Processing your file...' : 
                                  isSearchEnabled ? 'Searching the web for music information...' : 
                                  'Thinking about your question...'}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>
                
                <form onSubmit={sendMessage} className="mt-auto">
                  <div className="relative">
                    {pendingFile && (
                      <div className="mb-2 p-2 bg-[#252525] rounded flex items-center">
                        {getFileIcon(pendingFile.type)}
                        <span className="text-xs lg:text-sm text-gray-300 ml-2 truncate">{pendingFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 w-6 p-0 text-gray-400"
                          onClick={() => setPendingFile(null)}
                        >
                          <X className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="relative">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask Rakim anything..."
                        className="min-h-[50px] lg:min-h-[144px] w-full lg:w-[696px] bg-[#141414] border-none focus-visible:ring-0 text-white text-[14px] lg:text-[16px] placeholder:text-gray-500 placeholder:text-[14px] lg:placeholder:text-[16px] resize-none p-3 lg:p-4 pl-10 lg:pl-12 pr-[100px] lg:pr-[160px] overflow-y-auto lg:overflow-visible"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (message.trim() || pendingFile) {
                              sendMessage(e as any);
                            }
                          }
                        }}
                      />
                      <div className="absolute left-3 top-3 lg:left-4 lg:top-4">
                        <img 
                          src="/lovable-uploads/Vector.png" 
                          alt="Ask Rakim"
                          className="w-4 h-4 lg:w-[18px] lg:h-[18px]"
                        />
                      </div>

                      {/* Mobile controls with background */}
                      <div className="absolute right-2 bottom-2 flex items-center gap-1 lg:hidden">
                        <div className="flex items-center gap-1 bg-[#141414] rounded-full p-1">
                          <Button
                            type="button"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            variant={isUploading || pendingFile ? "secondary" : "ghost"}
                            onClick={triggerFileInput}
                            disabled={isUploading || !!pendingFile}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <img 
                                src="/lovable-uploads/plus-circle.png" 
                                alt="Add file"
                                className="h-5 w-5 object-contain"
                              />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            variant={isSearchEnabled ? "secondary" : "ghost"}
                            onClick={() => setShowSearchModal(true)}
                          >
                            <img 
                              src="/lovable-uploads/globe.png" 
                              alt="Search"
                              className="h-4 w-4 object-contain"
                            />
                          </Button>
                          <Button 
                            type="submit"
                            size="icon" 
                            className="h-8 w-8 rounded-full bg-[#987D4D] text-white hover:bg-[#987D4D]/90"
                            disabled={isLoading || (!message.trim() && !pendingFile)}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SendHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Desktop controls */}
                      <div className="absolute right-2 bottom-2 hidden lg:flex space-x-2">
                        <div className="flex items-center gap-2 bg-[#1f1f1f] rounded-full p-1">
                          {/* ... existing desktop controls ... */}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 bg-black/80 z-50 lg:hidden">
          <div className="fixed inset-x-0 bottom-0 bg-[#1C1C1C] rounded-t-[20px] p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Search Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearchModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div 
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer ${
                  isSearchEnabled ? 'bg-[#252525]' : 'bg-[#141414]'
                }`}
                onClick={() => {
                  toggleSearch();
                  setShowSearchModal(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    isSearchEnabled ? 'bg-[#987D4D]' : 'bg-[#333333]'
                  }`}>
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Web Search</p>
                    <p className="text-sm text-gray-400">
                      {isSearchEnabled 
                        ? "Search the web for latest music information" 
                        : "Use AI's existing knowledge only"}
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative ${
                  isSearchEnabled ? 'bg-[#987D4D]' : 'bg-[#333333]'
                }`}>
                  <div className={`absolute top-1 ${
                    isSearchEnabled ? 'right-1' : 'left-1'
                  } w-4 h-4 rounded-full bg-white transition-all`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AskRakim;


