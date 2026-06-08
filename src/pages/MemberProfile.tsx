import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User2, Grid, List, Pencil, MoreVertical, Trash2, X, Check, UserMinus, UserPlus, ImagePlus, Circle, Plus, ChevronLeft, ChevronRight, Loader2, Video } from "lucide-react";
import { Post } from "@/components/community/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfilePreviewModal } from "@/components/dashboard/ProfilePreviewModal";
import FileUpload from "@/components/courses/FileUpload";
import { useParams } from "react-router-dom";

interface Profile {
  first_name: string;
  last_name: string;
  city: string;
  state: string;
  bio: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  avatar_url: string | null;
  id?: string;
  username?: string;
}

interface FollowUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string | null;
  following?: boolean;
}

interface Highlight {
  id: string;
  title: string;
  cover_image: string;
  created_at: string;
  user_id: string;
  media: {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }[];
}

const MemberProfile = () => {
  const { user } = useAuth();
  const { profileId } = useParams();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostMedia, setEditPostMedia] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    city: "",
    state: "",
    bio: "",
    website: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    avatar_url: null,
  });
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [editPostMediaFiles, setEditPostMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<{url: string; type: 'image' | 'video'}[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showAddHighlightDialog, setShowAddHighlightDialog] = useState(false);
  const [newHighlight, setNewHighlight] = useState({
    title: "",
    coverImage: null as File | null,
    media: [] as File[],
    captions: [] as string[]
  });
  const [viewingHighlight, setViewingHighlight] = useState<Highlight | null>(null);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Query to fetch profile stats
  const profileStatsQuery = useQuery({
    queryKey: ['profile-stats', profileId],
    queryFn: async () => {
      const [followersCount, followingCount] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profileId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profileId)
      ]);

      return {
        followers: followersCount.count || 0,
        following: followingCount.count || 0
      };
    },
    enabled: !!profileId
  });

  // Query to fetch highlights
  const highlightsQuery = useQuery({
    queryKey: ['highlights', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not provided');
      
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch highlight media for each highlight
      const highlightsWithMedia = await Promise.all(
        data.map(async (highlight) => {
          const { data: mediaData, error: mediaError } = await supabase
            .from('highlight_media')
            .select('*')
            .eq('highlight_id', highlight.id)
            .order('order_index', { ascending: true });
          
          if (mediaError) throw mediaError;
          
          return {
            ...highlight,
            media: mediaData || []
          };
        })
      );
      
      return highlightsWithMedia;
    },
    enabled: !!profileId
  });

  // Add this new query to check follow status
  const followStatusQuery = useQuery({
    queryKey: ['follow-status', user?.id, profileId],
    queryFn: async () => {
      if (!user || !profileId) return false;
      
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single();
      
      if (error) return false;
      return !!data;
    },
    enabled: !!user && !!profileId
  });

  useEffect(() => {
    if (highlightsQuery.data) {
      const typedHighlights = highlightsQuery.data.map(h => ({
        ...h,
        media: h.media.map(m => ({
          ...m,
          type: (m.type === 'image' || m.type === 'video') ? m.type : 'image' as 'image' | 'video'
        }))
      }));
      setHighlights(typedHighlights as any);
    }
  }, [highlightsQuery.data]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (error) throw error;
        if (data) {
          setProfile(data);
          setAvatarUrl(data.avatar_url);
        }

        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(`
            *,
            author:author_id(
              username,
              avatar_url,
              first_name,
              last_name
            )
          `)
          .eq("author_id", profileId)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        if (postsData) {
          const transformedPosts = postsData.map(post => {
            let mediaArray = [];
            if (post.media && Array.isArray(post.media)) {
              mediaArray = post.media.map(m => {
                const mediaItem = m as Record<string, any>;
                return {
                  url: String(mediaItem.url || ''),
                  type: mediaItem.type === 'video' ? 'video' : 'image',
                  order_index: Number(mediaItem.order_index || 0)
                };
              });
            }

            return {
              ...post,
              liked_by_user: false,
              media: mediaArray,
              media_count: post.media_count || 0,
              showComments: false,
              commentsList: []
            };
          }) as Post[];

          setPosts(transformedPosts);
          setStats(prev => ({ ...prev, posts: transformedPosts.length }));
        }

      } catch (error: any) {
        toast({
          title: "Error fetching profile",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchProfile();
  }, [profileId]);

  const fetchFollowers = async () => {
    if (!profileId) return;
    setFollowersLoading(true);
    
    try {
      // Get all followers
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select(`
          follower_id,
          follower:profiles!follows_follower_id_fkey(
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('following_id', profileId);
      
      if (followersError) throw followersError;

      // Get list of people I follow to check if I'm following back
      const { data: myFollowingData, error: myFollowingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profileId);
      
      if (myFollowingError) throw myFollowingError;
      
      // Create a set of IDs I'm following for easy lookup
      const followingIds = new Set(myFollowingData.map(f => f.following_id));
      
      // Transform the data to include whether I'm following each follower
      const transformedFollowers = followersData.map(f => {
        const follower = f.follower as any;
        return {
          id: follower.id,
          username: follower.username,
          first_name: follower.first_name,
          last_name: follower.last_name,
          avatar_url: follower.avatar_url,
          following: followingIds.has(follower.id)
        };
      });
      
      setFollowers(transformedFollowers);
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      toast({
        title: "Error",
        description: "Failed to load followers",
        variant: "destructive",
      });
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!profileId) return;
    setFollowingLoading(true);
    
    try {
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(`
          following_id,
          following:profiles!follows_following_id_fkey(
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('follower_id', profileId);
      
      if (followingError) throw followingError;
      
      const transformedFollowing = followingData.map(f => {
        const following = f.following as any;
        return {
          id: following.id,
          username: following.username,
          first_name: following.first_name,
          last_name: following.last_name,
          avatar_url: following.avatar_url,
          following: true // We're already following them
        };
      });
      
      setFollowing(transformedFollowing);
    } catch (error: any) {
      console.error('Error fetching following:', error);
      toast({
        title: "Error",
        description: "Failed to load following users",
        variant: "destructive",
      });
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profileId) return;
    
    try {
      setLoading(true);
      
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profileId });
      
      // Create notification
      const { data: followerData } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', user.id)
        .single();

      if (followerData) {
        const followerName = `${followerData.first_name} ${followerData.last_name}`;
        
        await supabase
          .from('notifications')
          .insert({
            type: 'follow',
            content: `${followerName} started following you`,
            entity_id: user.id,
            user_id: profileId,
            readers: []
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ['profile-stats', profileId] });
      queryClient.invalidateQueries({ queryKey: ['follow-status', user.id, profileId] });
      
      toast({
        description: "Started following user",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || !profileId) return;
    
    try {
      setLoading(true);
      
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId);
      
      queryClient.invalidateQueries({ queryKey: ['profile-stats', profileId] });
      queryClient.invalidateQueries({ queryKey: ['follow-status', user.id, profileId] });
      
      toast({
        description: "Unfollowed user",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a new handler to view a user's profile
  const handleViewUserProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  const deleteOldAvatar = async (oldAvatarUrl: string | null) => {
    if (!oldAvatarUrl) return;
    
    try {
      const urlParts = oldAvatarUrl.split('/');
      const pathParts = urlParts[urlParts.length - 1].split('?')[0];
      const filePath = `${user?.id}/${pathParts}`;

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting old avatar:', error);
      }
    } catch (error) {
      console.error('Error parsing old avatar URL:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const removeNewMedia = (index: number) => {
    setEditPostMediaFiles(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(prev => {
      const updated = [...prev];
      return updated
        .filter((_, i) => i !== index)
        .map((media, newIndex) => ({
          ...media,
          order_index: newIndex
        }));
    });
  };

  // New function to handle viewing a highlight
  const handleViewHighlight = (highlight: Highlight) => {
    setViewingHighlight(highlight);
    setCurrentHighlightIndex(0);
  };

  // New function to handle updating caption for a highlight media
  const handleCaptionChange = (index: number, caption: string) => {
    setNewHighlight(prev => {
      const updatedCaptions = [...prev.captions];
      updatedCaptions[index] = caption;
      return {
        ...prev,
        captions: updatedCaptions
      };
    });
  };

  return (
    <DashboardLayout headerTitle="Notespaper">
      <div className="max-w-7xl mx-auto space-y-8 px-2 sm:px-4 md:px-24">
        <div className="flex flex-col items-center md:flex-row md:items-start gap-4 sm:gap-8 max-w-xl mx-auto">
          <div className="relative group">
            <div className="h-20 w-20 border-2 border-[#987D4D] rounded-full p-[2px]">
              <Avatar className="h-full w-full rounded-full">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback>
                  <User2 className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <h1 className="text-3xl font-semibold">
                {profile.first_name} {profile.last_name}
              </h1>
              {user && user.id !== profileId && (
                <Button 
                  className="bg-[#2C2C30]"
                  size="sm"
                  onClick={followStatusQuery.data ? handleUnfollow : handleFollow}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : followStatusQuery.data ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex justify-center md:justify-start gap-6">
              <div className="text-center flex items-center gap-1">
                <div className="font-semibold">{stats.posts}</div>
                <div className="font-semibold">posts</div>
              </div>
              <button 
                className="text-center flex items-center gap-1 hover:opacity-80"
                onClick={() => {
                  setShowFollowersModal(true);
                  fetchFollowers();
                }}
              >
                <div className="font-semibold">{profileStatsQuery.data?.followers || 0}</div>
                <div className="font-semibold">followers</div>
              </button>
              <button 
                className="text-center flex items-center gap-1 hover:opacity-80"
                onClick={() => {
                  setShowFollowingModal(true);
                  fetchFollowing();
                }}
              >
                <div className="font-semibold">{profileStatsQuery.data?.following || 0}</div>
                <div className="font-semibold">following</div>
              </button>
            </div>

            <div className="space-y-2">
              {profile.bio && (
                <>
                  <h3 className="font-semibold">About:</h3>
                  <div className="font-medium">{profile.bio}</div>
                </>
              )}
              {profile.website && (
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  {profile.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Highlights Section */}
        <div className="border-b pb-6 w-full overflow-hidden">
          <ScrollArea className="w-full">
            <div className="flex gap-4 sm:gap-8 px-2">
              {highlightsQuery.isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : highlights.map((highlight) => (
                <div 
                  key={highlight.id} 
                  className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px]"
                  onClick={() => handleViewHighlight(highlight)}
                >
                  <div className="w-[72px] h-[72px] rounded-full border-2 border-primary p-[2px]">
                    <img 
                      src={highlight.cover_image}
                      alt={highlight.title}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="text-xs text-center line-clamp-1 w-16">
                    {highlight.title}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
       
        {isGridView ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 w-full overflow-hidden">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="aspect-square relative group"
              >
                <div className="absolute top-2 right-2 z-10">
                  {post.media && post.media[0] && post.media[0].type === "video" && (
                    <div className="bg-black/20 p-1 rounded-md">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                {post.media && post.media[0] ? (
                  post.media[0].type === "video" ? (
                    <div className="relative w-full h-full">
                      <video
                        src={post.media[0].url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="text-white text-center">
                          <div className="font-semibold">{post.likes} likes</div>
                          <div>{post.comments} comments</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={post.media[0].url}
                        alt={post.content}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-white text-center">
                          <div className="font-semibold">{post.likes} likes</div>
                          <div>{post.comments} comments</div>
                        </div>
                      </div>
                    </>
                  )
                ) : post.image ? (
                  <>
                    <img
                      src={post.image}
                      alt={post.content}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-white text-center">
                        <div className="font-semibold">{post.likes} likes</div>
                        <div>{post.comments} comments</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-full bg-muted flex items-center justify-center p-4">
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {post.content}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-white text-center">
                        <div className="font-semibold">{post.likes} likes</div>
                        <div>{post.comments} comments</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 w-full overflow-hidden">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between mb-4">
                  <div className="flex gap-4">
                    {post.image && (
                      <img
                        src={post.image}
                        alt={post.content}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="line-clamp-3">{post.content}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{post.likes} likes</span>
                        <span>{post.comments} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Followers Modal */}
        <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
          <DialogContent className="sm:max-w-md w-[95vw] sm:w-full mx-auto">
            <DialogHeader>
              <DialogTitle>Followers</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {followersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No followers yet
                </div>
              ) : (
                <div className="space-y-4">
                  {followers.map((follower) => (
                    <div key={follower.id} className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleViewUserProfile(follower.id)}
                      >
                        <Avatar>
                          <AvatarImage src={follower.avatar_url || undefined} />
                          <AvatarFallback>
                            {follower.first_name?.[0]}
                            {follower.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {follower.first_name} {follower.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {follower.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Following Modal */}
        <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
          <DialogContent className="sm:max-w-md w-[95vw] sm:w-full mx-auto">
            <DialogHeader>
              <DialogTitle>Following</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {followingLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Not following anyone yet
                </div>
              ) : (
                <div className="space-y-4">
                  {following.map((follow) => (
                    <div key={follow.id} className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleViewUserProfile(follow.id)}
                      >
                        <Avatar>
                          <AvatarImage src={follow.avatar_url || undefined} />
                          <AvatarFallback>
                            {follow.first_name?.[0]}
                            {follow.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {follow.first_name} {follow.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {follow.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Profile Preview Modal */}
        <ProfilePreviewModal 
          userId={selectedProfileId}
          isOpen={!!selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />

        {/* Highlight Viewer Dialog */}
        <Dialog 
          open={!!viewingHighlight} 
          onOpenChange={(open) => {
            if (!open) {
              setViewingHighlight(null);
              setCurrentHighlightIndex(0);
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl h-[80vh] p-0 gap-0">
            <div className="relative h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {profile.first_name?.[0]}
                    {profile.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Content */}
              <div className="flex-1 relative bg-black">
                {viewingHighlight?.media[currentHighlightIndex]?.type === 'video' ? (
                  <video
                    src={viewingHighlight?.media[currentHighlightIndex]?.url}
                    className="w-100 h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={viewingHighlight?.media[currentHighlightIndex]?.url}
                    alt={viewingHighlight?.media[currentHighlightIndex]?.caption || ''}
                    className="w-100 h-full object-contain"
                  />
                )}

                {/* Navigation buttons */}
                {currentHighlightIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={() => setCurrentHighlightIndex(prev => prev - 1)}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                )}
                {viewingHighlight && currentHighlightIndex < viewingHighlight.media.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={() => setCurrentHighlightIndex(prev => prev + 1)}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                )}

                {/* Caption */}
                {viewingHighlight?.media[currentHighlightIndex]?.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm">
                      {viewingHighlight.media[currentHighlightIndex].caption}
                    </p>
                  </div>
                )}

              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MemberProfile;
