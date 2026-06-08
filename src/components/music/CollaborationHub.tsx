import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Music2, Users, Share2, UserPlus, Trash2, Edit, Mail, CheckCircle, XCircle, Trophy } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProjectWorkspace } from "./ProjectWorkspace";
import { ProjectRequestDialog } from "./ProjectRequestDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ProjectStatus = 'open' | 'in_progress' | 'completed';

interface Project {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: ProjectStatus;
  creator_id: string;
  created_at: string;
  updated_at: string;
  cover_image: string | null;
  creator: {
    username: string;
  };
  collaborators: Array<{
    id: string;
    role: string;
    user: {
      username: string;
      avatar_url?: string | null;
    };
  }>;
  requests: Array<{
    id: string;
    role: string;
    status: string;
    message: string | null;
    sender: {
      username: string;
      avatar_url?: string | null;
    };
  }>;
}

export const CollaborationHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    genre: ""
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', selectedGenre, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('collaboration_projects')
        .select(`
          *,
          creator:profiles!collaboration_projects_creator_id_fkey(username),
          collaborators:project_collaborators(
            id,
            role,
            user:profiles!project_collaborators_user_id_fkey(username, avatar_url)
          ),
          requests:collaboration_requests(
            id,
            role,
            status,
            message,
            sender:profiles!collaboration_requests_sender_id_fkey(username, avatar_url)
          )
        `);

      if (selectedGenre !== "all") {
        query = query.eq('genre', selectedGenre);
      }
      
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Project[];
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { title: string; description: string; genre: string }) => {
      const { error } = await supabase
        .from('collaboration_projects')
        .insert({
          title: projectData.title,
          description: projectData.description,
          genre: projectData.genre,
          creator_id: user?.id,
          status: 'open'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateDialogOpen(false);
      setNewProject({ title: "", description: "", genre: "" });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string, newStatus: ProjectStatus }) => {
      const { error } = await supabase
        .from('collaboration_projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Status updated",
        description: "Project status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async ({ requestId, projectId, userId, role }: { requestId: string, projectId: string, userId: string, role: string }) => {
      const { data: request, error: requestError } = await supabase
        .from('collaboration_requests')
        .select('sender_id')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      const { error: updateError } = await supabase
        .from('collaboration_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { error: collaboratorError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          user_id: request.sender_id,
          role: role
        });

      if (collaboratorError) throw collaboratorError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Request accepted",
        description: "The collaboration request has been accepted.",
      });
    },
    onError: (error) => {
      console.error('Accept request error:', error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('collaboration_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Request declined",
        description: "The collaboration request has been declined.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to decline request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreateProject = () => {
    if (!newProject.title || !newProject.description || !newProject.genre) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(newProject);
  };

  const isCreatorOrCollaborator = (project: Project) => {
    if (!user) return false;
    
    // Check if user is creator
    if (user.id === project.creator_id) return true;
    
    // Check if user has an active collaboration
    return project.collaborators.some(collab => 
      collab.user.username === user.user_metadata.username
    );
  };

  const getRequestStatus = (project: Project) => {
    if (!user) return null;
    const request = project.requests.find(req => req.sender.username === user.user_metadata.username);
    return request ? request.status : null;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((acc, project) => 
                acc + project.requests.filter(r => r.status === 'pending').length, 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="Electronic">Electronic</SelectItem>
                <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                <SelectItem value="Rock">Rock</SelectItem>
                <SelectItem value="Pop">Pop</SelectItem>
                <SelectItem value="Jazz">Jazz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Start New Project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Create Collaboration Project</DialogTitle>
                <DialogDescription>
                  Share your project idea and find collaborators.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input 
                    placeholder="Project Title" 
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Select
                    value={newProject.genre}
                    onValueChange={(value) => setNewProject({ ...newProject, genre: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronic">Electronic</SelectItem>
                      <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                      <SelectItem value="Rock">Rock</SelectItem>
                      <SelectItem value="Pop">Pop</SelectItem>
                      <SelectItem value="Jazz">Jazz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Textarea 
                    placeholder="Project Description"
                    className="min-h-[100px]"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {projectsLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-background">
                <TableRow>
                  <TableHead className="min-w-[200px]">Project</TableHead>
                  <TableHead className="min-w-[150px]">Creator</TableHead>
                  <TableHead className="min-w-[120px]">Genre</TableHead>
                  <TableHead className="min-w-[150px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Collaborators</TableHead>
                  <TableHead className="min-w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="min-w-[200px]">{project.title}</TableCell>
                    <TableCell className="min-w-[150px]">{project.creator.username}</TableCell>
                    <TableCell className="min-w-[120px]">{project.genre}</TableCell>
                    <TableCell className="min-w-[150px]">
                      {user?.id === project.creator_id ? (
                        <Select
                          value={project.status}
                          onValueChange={(value: ProjectStatus) => 
                            updateStatusMutation.mutate({ projectId: project.id, newStatus: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge>{project.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[120px]">{project.collaborators.length}</TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">View Details</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{project.title}</DialogTitle>
                              <DialogDescription>
                                Created by {project.creator.username}
                              </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue={isCreatorOrCollaborator(project) ? "workspace" : "details"} className="w-full flex-1 overflow-hidden flex flex-col">
                              <TabsList className="justify-start w-full">
                                {isCreatorOrCollaborator(project) && (
                                  <TabsTrigger value="workspace">Workspace</TabsTrigger>
                                )}
                                <TabsTrigger value="details">Details</TabsTrigger>
                                {user?.id === project.creator_id && (
                                  <TabsTrigger value="requests">
                                    Requests
                                    {project.requests.filter(r => r.status === 'pending').length > 0 && (
                                      <Badge variant="secondary" className="ml-2">
                                        {project.requests.filter(r => r.status === 'pending').length}
                                      </Badge>
                                    )}
                                  </TabsTrigger>
                                )}
                              </TabsList>
                              <div className="flex-1 overflow-auto">
                                {isCreatorOrCollaborator(project) && (
                                  <TabsContent value="workspace" className="h-full">
                                    <ProjectWorkspace projectId={project.id} />
                                  </TabsContent>
                                )}
                                <TabsContent value="details">
                                  <div className="space-y-4">
                                    <p className="text-muted-foreground">{project.description}</p>
                                    <div>
                                      <h3 className="font-semibold mb-2">Current Collaborators</h3>
                                      <div className="flex flex-wrap gap-2">
                                        {project.collaborators.map((collaborator) => (
                                          <div key={collaborator.id} className="flex items-center gap-2">
                                            <Avatar>
                                              <AvatarImage src={collaborator.user.avatar_url || undefined} />
                                              <AvatarFallback>{collaborator.user.username[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{collaborator.user.username}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {!isCreatorOrCollaborator(project) && !getRequestStatus(project) && (
                                      <ProjectRequestDialog 
                                        projectId={project.id}
                                        projectTitle={project.title}
                                      />
                                    )}
                                    {getRequestStatus(project) === 'pending' && (
                                      <Button variant="outline" disabled>
                                        Request Pending
                                      </Button>
                                    )}
                                  </div>
                                </TabsContent>
                                {user?.id === project.creator_id && (
                                  <TabsContent value="requests">
                                    {project.requests
                                      .filter(request => request.status === 'pending')
                                      .map((request) => (
                                        <Card key={request.id}>
                                          <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                              <Avatar>
                                                <AvatarImage src={request.sender.avatar_url || undefined} />
                                                <AvatarFallback>{request.sender.username[0]}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="font-semibold">{request.sender.username}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  Requested role: {request.role}
                                                </p>
                                                {request.message && (
                                                  <p className="text-sm text-muted-foreground mt-1">
                                                    "{request.message}"
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button 
                                                size="sm"
                                                onClick={() => acceptRequestMutation.mutate({
                                                  requestId: request.id,
                                                  projectId: project.id,
                                                  userId: request.sender.username,
                                                  role: request.role
                                                })}
                                              >
                                                Accept
                                              </Button>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => declineRequestMutation.mutate(request.id)}
                                              >
                                                Decline
                                              </Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                  </TabsContent>
                                )}
                              </div>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                        {user?.id !== project.creator_id && !isCreatorOrCollaborator(project) && (
                          <ProjectRequestDialog 
                            projectId={project.id}
                            projectTitle={project.title}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
