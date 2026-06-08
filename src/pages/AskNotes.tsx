import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, SendHorizontal, Globe, Upload, X, FileText, File, Image } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from 'react-router-dom';

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

const AskNotes = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialQuestion = query.get('question') || '';

  const [message, setMessage] = useState(initialQuestion);
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
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const fetchSessions = async () => {
    try {
      // Get today, yesterday, and 7 days ago dates for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Format dates for Supabase query
      const todayStr = today.toISOString();
      const yesterdayStr = yesterday.toISOString();
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();
      
      // Only fetch sessions from the last 7 days
      const { data: sessionData, error } = await supabase
        .from('chat_sessions')
        .select('*, chat_attachments(*)')
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
      // Skip fetching messages if we're processing a file upload
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
        .from('chat_sessions')
        .select('search_enabled')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      
      setIsSearchEnabled(sessionData?.search_enabled || false);
      
      // Construct the message query
      let messagesQuery = supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId);
      
      // If we have a cursor, use it for pagination
      if (cursor) {
        messagesQuery = messagesQuery
          .lt('id', cursor)
          .order('created_at', { ascending: false });
      } else {
        messagesQuery = messagesQuery
          .order('created_at', { ascending: false });
      }
      
      // Limit the number of messages per page
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
      
      // Check if there are more messages to load
      if (data.length > 0) {
        setOldestMessageId(data[data.length - 1].id);
        
        // Check if there are more messages
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .lt('id', data[data.length - 1].id);
        
        setHasMoreMessages(count !== null && count > 0);
      } else {
        setHasMoreMessages(false);
      }
      
      // Format messages
      const formattedMessages: ChatMessage[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        created_at: msg.created_at
      })).reverse(); // Reverse to show oldest first
      
      // Update messages state
      if (cursor) {
        // Append messages if loading more (pagination)
        setMessages(prevMessages => [...prevMessages, ...formattedMessages]);
      } else {
        // Replace messages if initial load
        setMessages(formattedMessages);
      }

      // Fetch attachments for this session
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('chat_attachments')
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
    if (initialQuestion && !isMessageSent) {
      sendMessage({ preventDefault: () => {} } as React.FormEvent);
      setIsMessageSent(true);
    }
  }, [initialQuestion, isMessageSent]);

  useEffect(() => {
    // Only scroll to bottom when messages change and we're not processing a file
    if (!isFileProcessing || fileResponseReceived) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isFileProcessing, fileResponseReceived]);

  // Handle scroll event to load more messages
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || isLoadingMoreMessages) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 20;
    
    if (scrolledToBottom && activeSessionId && oldestMessageId) {
      fetchMessages(activeSessionId, oldestMessageId);
    }
  }, [hasMoreMessages, isLoadingMoreMessages, activeSessionId, oldestMessageId]);

  // Add scroll event listener
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
    
    // If there's a pending file, process it first
    if (pendingFile) {
      // Create loading message for file processing
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
        // Remove messages on error
        setMessages(prev => 
          prev.filter(msg => msg.id !== userMessage.id && msg.id !== loadingMessage.id)
        );
      }
      return;
    }

    // Regular message processing
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: message,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      content: 'Analyzing your business question...',
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
      
      const { data, error } = await supabase.functions.invoke('ask-notes', {
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
      
      if (!data || !data.response) {
        throw new Error("Invalid response from the server");
      }

      const aiMessage: ChatMessage = {
        id: `response-${Date.now()}`,
        content: data.response,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingMessage.id).concat(aiMessage)
      );
      
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
          .from('chat_sessions')
          .update({ search_enabled: newSearchState })
          .eq('id', activeSessionId);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: newSearchState ? "Web search enabled" : "Web search disabled",
          description: newSearchState 
            ? "I'll search the web to give you the most up-to-date information." 
            : "I'll respond based on my training data only.",
        });
      } catch (error) {
        console.error('Error updating search preference:', error);
        toast({
          title: "Error",
          description: "Failed to update search preference",
          variant: "destructive",
        });
        setIsSearchEnabled(!newSearchState); // Revert state on error
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
    
    // Store the file to upload
    setPendingFile(files[0]);
    toast({
      title: "File selected",
      description: `${files[0].name} is ready to upload. Add a message and press send.`,
    });
  };

  const processFileUpload = async (file: File) => {
    try {
      // Create a new session if needed
      if (!activeSessionId) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("You must be logged in to use this feature");
        }
        
        const { data: sessionData, error: sessionError } = await supabase
          .from("chat_sessions")
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
      // Convert file to base64
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader
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
      
      // Show user message in the UI immediately
      const userMessage: ChatMessage = {
        id: `upload-${Date.now()}`,
        content: `I've uploaded a file: ${file.name}. Please analyze this file and provide insights.`,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      // Show loading message
      const loadingId = `loading-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: loadingId,
          content: "Analyzing your uploaded file...",
          role: 'assistant',
          created_at: new Date().toISOString(),
        }
      ]);
      
      // Send to the edge function
      const { data, error } = await supabase.functions.invoke('process-file', {
        body: JSON.stringify({
          fileData: base64data,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          sessionId: sessionId,
          message: "Please analyze this file and provide insights."
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("File processing response:", data);
      
      // Set the file response as received
      setFileResponseReceived(true);
      setIsLoading(false);
      
      if (error) throw error;
      
      if (!data || !data.success) {
        throw new Error(data?.error || "Unknown error processing file");
      }
      
      // Remove loading message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingId);
        
        // Add the AI response with the summary from process-file
        const aiMessage: ChatMessage = {
          id: `response-${Date.now()}`,
          content: data.summary || data.aiResponse || "No summary available for this file.", // Use summary first
          role: 'assistant',
          created_at: new Date().toISOString(),
        };
        
        return [...filtered, aiMessage];
      });
      
      // Add the new attachment to the local state
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
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Wait to ensure database operations have completed
      setTimeout(() => {
        setIsFileProcessing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsLoading(false);
      // Remove any loading message
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading-')));
      throw error;
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper function to render file preview icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const toggleMobileHistory = () => {
    setShowMobileHistory(!showMobileHistory);
  };

  return (
    <DashboardLayout headerTitle="Ask Notes">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] p-2 xs:p-4 sm:p-8 gap-2 xs:gap-4 sm:gap-8">
        {/* Mobile History Overlay */}
        {showMobileHistory && (
          <div className="lg:hidden fixed inset-0 bg-black/80 z-50">
            <div className="bg-[#1F1F1F] h-full w-full max-w-[300px] p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-[16px] font-medium">Search History</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400"
                  onClick={toggleMobileHistory}
                >
                  <X className="h-5 w-5" />
                </Button>
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
                            onClick={() => {
                              setActiveSessionId(session.id);
                              setShowMobileHistory(false);
                            }}
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
          </div>
        )}

        <div className="hidden lg:block w-full lg:w-[252px] h-[600px] border border-[#2C2C30] rounded-[10px] px-4 sm:px-8 pt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-[14px] font-normal leading-[21px]">Search History</h2>
            {/* <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
              onClick={startNewChat}
            >
              <PlusCircle className="h-5 w-5" />
            </Button> */}
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
          <div className="h-[calc(100vh-85px)] lg:h-[600px] border border-[#2C2C30] rounded-[10px] p-3 xs:p-4 sm:p-6 lg:p-8 flex flex-col">
            {/* Add mobile history button */}
            <div className="flex lg:hidden justify-between items-center mb-4">
              <Button
                variant="ghost"
                className="flex items-center text-gray-400 hover:text-white text-xs sm:text-sm"
                onClick={toggleMobileHistory}
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                History
              </Button>
              {activeSessionId && (
                <Button
                  variant="ghost"
                  className="flex items-center text-gray-400 hover:text-white text-xs sm:text-sm"
                  onClick={startNewChat}
                >
                  <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  New Chat
                </Button>
              )}
            </div>

            {!activeSessionId && messages.length === 0 ? (
              <div className="flex flex-col items-center w-full max-w-[800px] mx-auto h-full justify-center p-4">
                <div className="mb-6 sm:mb-8 text-center">
                  <h1 className="text-xl xs:text-2xl sm:text-[32px] text-white font-light">What can I help you with?</h1>
                </div>
                
                <form onSubmit={sendMessage} className="w-full">
                  <div className="relative w-full max-w-[696px] mx-auto">
                    <div className="relative">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask Notes anything..."
                        className="min-h-[100px] sm:min-h-[144px] w-full border border-[#2C2C30] rounded-[10px] focus-visible:ring-0 text-gray-200 placeholder:text-gray-500 placeholder:text-sm sm:placeholder:text-[16px] resize-none p-3 sm:p-4 pl-10 sm:pl-12"
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
                          alt="Ask icon"
                          width={24}
                          height={24}
                        />
                      </div>
                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <div className="flex items-center px-2 py-1">
                          <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => {
                              if (e.target.files?.length) {
                                handleFileSelect([e.target.files[0]]);
                              }
                            }}
                          />
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
                                className="h-9 w-9 object-contain"
                                style={{ 
                                  imageRendering: '-webkit-optimize-contrast',
                                  transform: 'translateZ(0)',
                                }}
                              />
                            )}
                          </Button>
                        </div>
                        <button
                          type="button"
                          onClick={toggleSearch}
                          className="flex items-center gap-2 border border-[#333333] rounded-full pl-3 pr-4 py-2 hover:border-white group"
                        >
                          <img 
                            src="/lovable-uploads/globe.png" 
                            alt="Search"
                            className="h-5 w-5 object-contain"
                            style={{ 
                              imageRendering: '-webkit-optimize-contrast',
                              transform: 'translateZ(0)',
                            }}
                          />
                          <span className={`text-sm ${isSearchEnabled ? 'text-white' : 'text-gray-400'} group-hover:text-white`}>
                            Search
                          </span>
                        </button>
                      </div>
                      <div className="absolute bottom-4 right-4">
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

                    <div className="flex gap-2 mt-4 sm:mt-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Button 
                    variant="ghost" 
                    className="h-[36px] sm:h-[40px] px-4 sm:px-6 rounded-full border border-[#A3A3A3] text-gray-400 hover:text-white py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
                        onClick={() => setMessage(prev => `${prev ? prev + " " : ""}What is entrepreneurship?`)}
                  >
                        Entrepreneurship
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-[36px] sm:h-[40px] px-4 sm:px-6 rounded-full border border-[#A3A3A3] text-gray-400 hover:text-white py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
                        onClick={() => setMessage(prev => `${prev ? prev + " " : ""}What is the best way to start a business?`)}
                      >
                        Business
                  </Button>
                </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <Button
                    variant="ghost"
                    className="flex items-center text-gray-400 hover:text-white text-xs sm:text-sm"
                    onClick={startNewChat}
                  >
                    <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    New Chat
                  </Button>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 border border-[#2C2C30] rounded-lg">
                    <h3 className="text-white text-xs sm:text-sm mb-1 sm:mb-2">Uploaded Files</h3>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id || attachment.filename} 
                          className="bg-[#333333] py-1 px-3 rounded-full text-xs text-white flex items-center gap-1"
                          title={attachment.filename}
                        >
                          {getFileIcon(attachment.file_type)}
                          <span className="truncate max-w-[150px]">{attachment.filename}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div 
                  className="flex-1 overflow-hidden mb-3 sm:mb-4" 
                  ref={messagesContainerRef}
                >
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-4 sm:space-y-6">
                      {isLoading ? (
                        <div className="flex justify-center py-6">
                          {/* <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> */}
                        </div>
                      ) : (
                        <>
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="border border-[#2C2C30] p-3 sm:p-4 rounded-lg"
                    >
                      <div className="flex items-center mb-2">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-2 flex items-center justify-center text-xs ${
                          msg.role === 'user' ? 'bg-blue-700' : 'bg-[#987D4D]'
                        }`}>
                          {msg.role === 'user' ? 'U' : 'N'}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-400">
                                  {msg.role === 'user' ? 'You' : 'Notes'}
                        </span>
                      </div>
                              <div className="text-white prose prose-invert prose-sm max-w-none text-xs sm:text-sm">
                                {msg.id.startsWith('loading-') ? (
                                  <div className="flex items-center">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          )}
                  
                  {isLoading && (
                    <div className="border border-[#2C2C30] p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center bg-[#987D4D]">
                          AI
                        </div>
                                <span className="text-sm text-gray-400">Notes</span>
                      </div>
                      <div className="flex items-center text-white">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isUploading ? 'Processing your file...' : 
                                  isSearchEnabled ? 'Searching the web for information...' : 
                                  'Analyzing your question...'}
                      </div>
                    </div>
                          )}
                        </>
                  )}
                  <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="flex-shrink-0">
                  <form onSubmit={sendMessage} className="relative">
                    {pendingFile && (
                      <div className="mb-2 p-2 border border-[#2C2C30] rounded flex items-center">
                        {getFileIcon(pendingFile.type)}
                        <span className="text-sm text-gray-300 ml-2 truncate">{pendingFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 w-6 p-0 text-gray-400"
                          onClick={() => setPendingFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="relative">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask Notes anything..."
                        className="min-h-[44px] h-auto max-h-[120px] lg:h-[60px] w-full border border-[#2C2C30] rounded-lg focus-visible:ring-0 text-white text-sm sm:text-base resize-none p-2 sm:p-4 pl-10 sm:pl-12 pr-[120px] xs:pr-[140px] overflow-y-auto"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#4A4A4A transparent'
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                        }}
                      />

                      <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
                        <img 
                          src="/lovable-uploads/Vector.png" 
                          alt="Ask icon"
                          className="w-5 h-5 sm:w-6 sm:h-6"
                        />
                      </div>

                      {/* Mobile Controls - Floating */}
                      <div className="absolute right-2 bottom-2 flex items-center gap-1.5 xs:gap-2 lg:hidden bg-[#111111] py-1 px-1.5 rounded-lg z-10">
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleFileSelect([e.target.files[0]]);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="icon" 
                          className="h-8 w-8 xs:h-9 xs:w-9 rounded-full"
                          variant="ghost"
                          onClick={triggerFileInput}
                        >
                          <Upload className="h-4 w-4 xs:h-5 xs:w-5" />
                        </Button>
                        <Button 
                          type="button" 
                          size="icon" 
                          className="h-8 w-8 xs:h-9 xs:w-9 rounded-full"
                          variant={isSearchEnabled ? "secondary" : "ghost"}
                          onClick={toggleSearch}
                        >
                          <Globe className="h-4 w-4 xs:h-5 xs:w-5" />
                        </Button>
                        <Button 
                          type="submit"
                          size="icon" 
                          className="h-8 w-8 xs:h-9 xs:w-9 rounded-full bg-[#987D4D]"
                          disabled={isLoading || (!message.trim() && !pendingFile)}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 xs:h-5 xs:w-5 animate-spin" />
                          ) : (
                            <SendHorizontal className="h-4 w-4 xs:h-5 xs:w-5" />
                          )}
                        </Button>
                      </div>

                      {/* Desktop Controls */}
                      <div className="hidden lg:flex absolute right-4 top-[50%] transform -translate-y-1/2 items-center gap-2">
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleFileSelect([e.target.files[0]]);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="icon" 
                          className="h-8 w-8 xs:h-9 xs:w-9 rounded-full"
                          variant={isUploading || pendingFile ? "secondary" : "ghost"}
                          onClick={triggerFileInput}
                        >
                          <Upload className="h-4 w-4 xs:h-5 xs:w-5" />
                        </Button>
                        <Button 
                          type="button" 
                          size="icon" 
                          className="h-8 w-8 xs:h-9 xs:w-9 rounded-full"
                          variant={isSearchEnabled ? "secondary" : "ghost"}
                          onClick={toggleSearch}
                        >
                          <Globe className="h-4 w-4 xs:h-5 xs:w-5" />
                        </Button>
                        <Button 
                          type="submit"
                          size="icon" 
                          className="h-8 w-8 xs:h-9 xs:w-9 rounded-full bg-[#987D4D]"
                          disabled={isLoading || (!message.trim() && !pendingFile)}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 xs:h-5 xs:w-5 animate-spin" />
                          ) : (
                            <SendHorizontal className="h-4 w-4 xs:h-5 xs:w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AskNotes;
