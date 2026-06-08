import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User2, Grid, List, Pencil, MoreVertical, Trash2, X, Check, UserMinus, UserPlus, ImagePlus, Circle, Plus, ChevronLeft, ChevronRight, Loader2, Video, Link as LinkIcon, ExternalLink } from "lucide-react";
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

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Query to fetch profile stats
  const profileStatsQuery = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const [followersCount, followingCount] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user?.id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user?.id)
      ]);

      return {
        followers: followersCount.count || 0,
        following: followingCount.count || 0
      };
    },
    enabled: !!user
  });

  // Query to fetch highlights
  const highlightsQuery = useQuery({
    queryKey: ['highlights', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', user.id)
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
    enabled: !!user
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
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
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
          .eq("author_id", user.id)
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
  }, [user]);

  const fetchFollowers = async () => {
    if (!user) return;
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
        .eq('following_id', user.id);
      
      if (followersError) throw followersError;

      // Get list of people I follow to check if I'm following back
      const { data: myFollowingData, error: myFollowingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
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
    if (!user) return;
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
        .eq('follower_id', user.id);
      
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

  const handleFollowUser = async (targetUserId: string) => {
    if (!user) return;
    
    try {
      // Add follow relationship
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
        
      // Get follower info to include in notification
      const { data: followerData } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', user.id)
        .single();

      // Create notification for the user being followed
      if (followerData) {
        const followerName = `${followerData.first_name} ${followerData.last_name}`;
        
        await supabase
          .from('notifications')
          .insert({
            type: 'follow',
            content: `${followerName} started following you`,
            entity_id: user.id,
            user_id: targetUserId,
            readers: []
          });
      }
        
      // Update the followers list
      setFollowers(prevFollowers => 
        prevFollowers.map(follower => 
          follower.id === targetUserId 
            ? { ...follower, following: true }
            : follower
        )
      );
      
      // Invalidate queries to update counts
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      
      toast({
        description: "Started following user",
      });
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };
  
  const handleUnfollowUser = async (targetUserId: string) => {
    if (!user) return;
    
    try {
      // Remove follow relationship
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      
      // Update the following list
      setFollowing(prevFollowing => 
        prevFollowing.filter(follow => follow.id !== targetUserId)
      );
      
      // Invalidate queries to update counts
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      
      toast({
        description: "Unfollowed user",
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const uniqueId = window.crypto.randomUUID();
        const filePath = `${user.id}/${uniqueId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: false });

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const newAvatarUrl = publicUrlData.publicUrl;
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: newAvatarUrl,
          })
          .eq("id", user.id);

        if (updateError) throw updateError;

        setAvatarUrl(newAvatarUrl);
        setProfile(prev => ({
          ...prev,
          avatar_url: newAvatarUrl
        }));

        await deleteOldAvatar(profile.avatar_url);
        setAvatarFile(null);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          city: profile.city,
          state: profile.state,
          bio: profile.bio,
          website: profile.website,
          instagram: profile.instagram,
          twitter: profile.twitter,
          tiktok: profile.tiktok,
        })
        .eq("id", user.id);

      if (error) throw error;

      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
        setNewPassword("");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);

      window.location.reload();

    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPostClick = (post: Post) => {
    setEditingPost(post);
    setEditPostContent(post.content);
    setExistingMedia((post.media || []).map((m, index) => ({
      url: m.url,
      type: m.type,
      order_index: index
    })));
    setEditPostMediaFiles([]);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => {
        return file;
      });

      const invalidFiles = newFiles.filter(file => {
        const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        return !isValidType || !isValidSize;
      });

      if (invalidFiles.length > 0) {
        toast({
          title: "Error",
          description: "Some files were not added. Files must be images or videos under 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (existingMedia.length + editPostMediaFiles.length + newFiles.length > 10) {
        toast({
          title: "Error",
          description: "You can only upload up to 10 media files per post.",
          variant: "destructive",
        });
        return;
      }

      setEditPostMediaFiles(prev => [...prev, ...newFiles]);
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

  const handleEditPost = async () => {
    if (!editingPost || !user) return;

    try {
      setLoading(true);

      let mediaUpdate: any[] = [...existingMedia];
      const startIndex = mediaUpdate.length;
      
      for (let i = 0; i < editPostMediaFiles.length; i++) {
        const file = editPostMediaFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          mediaUpdate.push({
            url: publicUrl,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            order_index: startIndex + i
          });
        }
      }

      const { error } = await supabase
        .from('posts')
        .update({
          content: editPostContent,
          media: mediaUpdate,
          // media_count: mediaUpdate.length
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === editingPost.id 
          ? { 
              ...post, 
              content: editPostContent,
              media: mediaUpdate,
              media_count: mediaUpdate.length
            }
          : post
      ));

      setEditingPost(null);
      setEditPostContent("");
      setEditPostMediaFiles([]);
      setExistingMedia([]);
      
      toast({
        description: "Post updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        description: "Post deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  // New function to handle highlight submission
  const handleAddHighlight = async () => {
    if (!user || !newHighlight.title || !newHighlight.coverImage || newHighlight.media.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide a title, cover image, and at least one media item",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload cover image
      const coverFileExt = newHighlight.coverImage.name.split('.').pop();
      const coverFileName = `${crypto.randomUUID()}.${coverFileExt}`;
      
      const { error: coverUploadError } = await supabase.storage
        .from('highlights')
        .upload(coverFileName, newHighlight.coverImage);
      
      if (coverUploadError) throw coverUploadError;
      
      const { data: coverUrlData } = supabase.storage
        .from('highlights')
        .getPublicUrl(coverFileName);
      
      // Insert highlight record
      const { data: highlightData, error: highlightError } = await supabase
        .from('highlights')
        .insert({
          title: newHighlight.title,
          cover_image: coverUrlData.publicUrl,
          user_id: user.id
        })
        .select()
        .single();
      
      if (highlightError) throw highlightError;
      
      // Upload and insert all media files
      const mediaPromises = newHighlight.media.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: mediaUploadError } = await supabase.storage
          .from('highlights')
          .upload(fileName, file);
        
        if (mediaUploadError) throw mediaUploadError;
        
        const { data: mediaUrlData } = supabase.storage
          .from('highlights')
          .getPublicUrl(fileName);
        
        return {
          highlight_id: highlightData.id,
          url: mediaUrlData.publicUrl,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          caption: newHighlight.captions[index] || '',
          order_index: index
        };
      });
      
      const mediaItems = await Promise.all(mediaPromises);
      
      const { error: mediaInsertError } = await supabase
        .from('highlight_media')
        .insert(mediaItems);
      
      if (mediaInsertError) throw mediaInsertError;
      
      // Reset form and refresh highlights
      setNewHighlight({
        title: "",
        coverImage: null,
        media: [],
        captions: []
      });
      
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
      setShowAddHighlightDialog(false);
      
      toast({
        description: "Highlight created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error creating highlight",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // New function to handle highlight media upload
  const handleHighlightMediaUpload = (files: File[]) => {
    setNewHighlight(prev => ({
      ...prev,
      media: [...prev.media, ...files],
      captions: [...prev.captions, ...Array(files.length).fill('')]
    }));
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

  // New function to handle deletion of a highlight
  const handleDeleteHighlight = async (highlightId: string) => {
    if (!user) return;
    
    try {
      // Delete highlight media records
      const { error: mediaDeleteError } = await supabase
        .from('highlight_media')
        .delete()
        .eq('highlight_id', highlightId);
      
      if (mediaDeleteError) throw mediaDeleteError;
      
      // Delete highlight record
      const { error: highlightDeleteError } = await supabase
        .from('highlights')
        .delete()
        .eq('id', highlightId);
      
      if (highlightDeleteError) throw highlightDeleteError;
      
      // Files in storage will remain, can implement cleanup if needed
      
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
      
      toast({
        description: "Highlight deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting highlight",
        description: error.message,
        variant: "destructive"
      });
    }
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
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <h1 className="text-3xl font-semibold">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="flex gap-2">
                <Button 
                  className="bg-[#2C2C30]" 
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Profile
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90" 
                  size="sm"
                  onClick={() => navigate('/noteslink')}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Noteslink
                </Button>
              </div>
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
              
              <div 
                className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px]"
                onClick={() => setShowAddHighlightDialog(true)}
              >
                <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-xs text-center text-muted-foreground">Add New</span>
              </div>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your post.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      {follower.following ? (
                        <Button variant="secondary" size="sm" disabled>
                          <Check className="h-4 w-4 mr-1" />
                          Following
                        </Button>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleFollowUser(follower.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Follow
                        </Button>
                      )}
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnfollowUser(follow.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center mb-6">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio ?? ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={profile.website ?? ""}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={profile.instagram ?? ""}
                      onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={profile.twitter ?? ""}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={profile.tiktok ?? ""}
                      onChange={(e) => setProfile({ ...profile, tiktok: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Updating..." : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingPost} onOpenChange={(open) => {
          if (!open) {
            setEditingPost(null);
            setEditPostContent("");
            setEditPostMediaFiles([]);
            setExistingMedia([]);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              
              {existingMedia.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {existingMedia.map((media, index) => (
                    <Card key={index} className="relative aspect-square">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={`Media ${index + 1}`}
                          className="rounded-lg w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="rounded-lg w-full h-full object-cover"
                          controls
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeExistingMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}

              {editPostMediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {editPostMediaFiles.map((file, index) => (
                    <Card key={index} className="relative aspect-square">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="rounded-lg w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={URL.createObjectURL(file)}
                          className="rounded-lg w-full h-full object-cover"
                          controls
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeNewMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  id="edit-post-media"
                  multiple
                  onChange={handleMediaSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('edit-post-media')?.click()}
                  disabled={existingMedia.length + editPostMediaFiles.length >= 10}
                >
                  Add Media
                </Button>
                {existingMedia.length + editPostMediaFiles.length >= 10 && (
                  <span className="text-sm text-muted-foreground">
                    Maximum 10 files allowed
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingPost(null);
                    setEditPostContent("");
                    setEditPostMediaFiles([]);
                    setExistingMedia([]);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditPost}
                  disabled={!editPostContent.trim() || loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Preview Modal */}
        <ProfilePreviewModal 
          userId={selectedProfileId}
          isOpen={!!selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />

        {/* Add Highlight Dialog */}
        <Dialog open={showAddHighlightDialog} onOpenChange={setShowAddHighlightDialog}>
          <DialogContent className="sm:max-w-md overflow-y-auto max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Create New Highlight</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="highlight-title">Title</Label>
                <Input
                  id="highlight-title"
                  value={newHighlight.title}
                  onChange={(e) => setNewHighlight(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter highlight title"
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {newHighlight.coverImage ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(newHighlight.coverImage)}
                        alt="Cover preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setNewHighlight(prev => ({ ...prev, coverImage: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="highlight-cover"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewHighlight(prev => ({ ...prev, coverImage: file }));
                          }
                        }}
                      />
                      <Label
                        htmlFor="highlight-cover"
                        className="cursor-pointer text-center"
                      >
                        <ImagePlus className="h-8 w-8 mb-2 mx-auto text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload cover image
                        </span>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Media</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {newHighlight.media.map((file, index) => (
                      <div key={index} className="relative">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Media ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1"
                          onClick={() => {
                            setNewHighlight(prev => ({
                              ...prev,
                              media: prev.media.filter((_, i) => i !== index),
                              captions: prev.captions.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Input
                          placeholder="Add caption"
                          value={newHighlight.captions[index] || ''}
                          onChange={(e) => {
                            setNewHighlight(prev => ({
                              ...prev,
                              captions: prev.captions.map((caption, i) => 
                                i === index ? e.target.value : caption
                              )
                            }));
                          }}
                          className="mt-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      id="highlight-media"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setNewHighlight(prev => ({
                          ...prev,
                          media: [...prev.media, ...files],
                          captions: [...prev.captions, ...Array(files.length).fill('')]
                        }));
                      }}
                    />
                    <Label
                      htmlFor="highlight-media"
                      className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      Add Media
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddHighlightDialog(false);
                    setNewHighlight({
                      title: "",
                      coverImage: null,
                      media: [],
                      captions: []
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddHighlight}
                  disabled={!newHighlight.title || !newHighlight.coverImage || newHighlight.media.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Highlight'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={viewingHighlight?.media[currentHighlightIndex]?.url}
                    alt={viewingHighlight?.media[currentHighlightIndex]?.caption || ''}
                    className="w-full h-full object-contain"
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

                {/* Delete button for owner */}
                {user?.id === viewingHighlight?.user_id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Highlight</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this highlight? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (viewingHighlight) {
                              handleDeleteHighlight(viewingHighlight.id);
                              setViewingHighlight(null);
                              setCurrentHighlightIndex(0);
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
