import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Music, Upload } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ProjectWorkspaceProps {
  projectId: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    username: string;
    avatar_url?: string;
  };
}

interface Track {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
  uploader: {
    username: string;
    avatar_url?: string;
  };
}

type ProjectStatus = 'open' | 'in_progress' | 'completed';

interface Project {
  id: string;
  status: ProjectStatus;
  creator_id: string;
}

export const ProjectWorkspace = ({ projectId }: ProjectWorkspaceProps) => {
  const [message, setMessage] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query for project details
  const { data: project } = useQuery({
    queryKey: ['project-details', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_projects')
        .select('id, status, creator_id')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as Project;
    }
  });

  // Query for messages
  const { data: messages = [] } = useQuery({
    queryKey: ['project-messages', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_messages')
        .select(`
          id,
          content,
          created_at,
          sender:profiles!project_messages_sender_id_fkey(
            username,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    }
  });

  // Query for tracks
  const { data: tracks = [] } = useQuery({
    queryKey: ['project-tracks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tracks')
        .select(`
          id,
          title,
          file_url,
          created_at,
          uploader:profiles!project_tracks_uploader_id_fkey(
            username,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Track[];
    }
  });

  // Query to check if user is collaborator or creator
  const { data: isCollaborator = false } = useQuery({
    queryKey: ['project-collaborator-status', projectId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Check if user is creator
      const { data: projectData } = await supabase
        .from('collaboration_projects')
        .select('creator_id')
        .eq('id', projectId)
        .single();

      if (projectData?.creator_id === user.id) return true;

      // Check if user is collaborator
      const { data: collaboratorData } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      return !!collaboratorData;
    }
  });

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: user?.id,
          content: content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-messages', projectId] });
      setMessage("");
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for uploading tracks
  const uploadTrackMutation = useMutation({
    mutationFn: async ({ file, title }: { file: File, title: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-audio')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-audio')
        .getPublicUrl(filePath);

      // Create track record
      const { error: trackError } = await supabase
        .from('project_tracks')
        .insert({
          project_id: projectId,
          uploader_id: user.id,
          title: title,
          file_url: publicUrl,
        });

      if (trackError) throw trackError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      setAudioFile(null);
      setAudioTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Success",
        description: "Track uploaded successfully.",
      });
    },
    onError: (error) => {
      console.error('Error uploading track:', error);
      toast({
        title: "Error",
        description: "Failed to upload track. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: ProjectStatus) => {
      const { error } = await supabase
        .from('collaboration_projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-details', projectId] });
      toast({
        title: "Status updated",
        description: "Project status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project status.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    sendMessageMutation.mutate(message);
  };

  const handleAudioUpload = async () => {
    if (!audioFile || !audioTitle.trim() || !user) {
      toast({
        title: "Error",
        description: "Please provide both a title and an audio file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      toast({
        title: "Error",
        description: "File size exceeds 50MB limit.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
    if (!allowedTypes.includes(audioFile.type)) {
      toast({
        title: "Error",
        description: "Invalid file type. Please upload MP3, WAV, or FLAC files only.",
        variant: "destructive",
      });
      return;
    }

    uploadTrackMutation.mutate({ file: audioFile, title: audioTitle });
  };

  if (!isCollaborator) {
    return null;
  }

  const isCreator = user?.id === project?.creator_id;
  const canUpdateStatus = isCreator && project?.status !== 'completed';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="col-span-1 h-[500px] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Project Chat
            </CardTitle>
            {isCreator && (
              <div className="flex items-center gap-2">
                <Badge variant={project?.status === 'completed' ? "secondary" : "outline"}>
                  {project?.status}
                </Badge>
                {canUpdateStatus && (
                  <Select
                    value={project?.status}
                    onValueChange={(value: ProjectStatus) => updateStatusMutation.mutate(value)}
                    disabled={!canUpdateStatus}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            {!isCreator && (
              <Badge variant={project?.status === 'completed' ? "secondary" : "outline"}>
                {project?.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            <div className="space-y-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.sender.username === user?.email ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender.username !== user?.email && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.sender.avatar_url || undefined} />
                      <AvatarFallback>{msg.sender.username[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      msg.sender.username === user?.email
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm mb-1 font-medium">{msg.sender.username}</p>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.sender.username === user?.email && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.sender.avatar_url || undefined} />
                      <AvatarFallback>{msg.sender.username[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-4 bg-background mt-auto">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || !user}
              >
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 h-[500px] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Audio Tracks
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            <div className="space-y-4 py-4">
              {tracks.map((track) => (
                <Card key={track.id} className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={track.uploader.avatar_url || undefined} />
                        <AvatarFallback>{track.uploader.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-semibold">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.uploader.username}</p>
                      </div>
                    </div>
                    <audio controls className="w-full">
                      <source src={track.file_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div className="border-t p-4 bg-background mt-auto">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Track title"
                value={audioTitle}
                onChange={(e) => setAudioTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                />
                <Button 
                  onClick={handleAudioUpload}
                  disabled={!audioFile || !audioTitle.trim() || !user || uploadTrackMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadTrackMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: MP3, WAV, FLAC (max 50MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
