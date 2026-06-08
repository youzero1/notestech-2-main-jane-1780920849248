
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PostForm } from "@/components/community/PostForm";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Post as PostType } from "@/components/community/types";
import { ShareDialog } from "@/components/community/ShareDialog";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Search, Share2, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaCarousel } from "@/components/community/MediaCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Post, PostMedia } from "@/components/community/types";
import type { Profile } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { ProfilePreviewModal } from "@/components/dashboard/ProfilePreviewModal";
import { useLocation } from "react-router-dom";
import { EmptySearch } from "@/components/EmptySearch";

interface MediaItem {
  url: string;
  type: string;
  order_index: number;
}

interface EnhancedProfile {
  id: string;
  username: string;
  avatar_url: string;
  first_name: string;
  last_name: string;
  follower_count: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<PostType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);
  const [showCommentsForPost, setShowCommentsForPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showAllProfilesDialog, setShowAllProfilesDialog] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/dashboard";

  const { data: posts, isLoading: isPostsLoading } = useQuery({
    queryKey: ['feed-posts'],
    queryFn: async () => {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image,
          created_at,
          likes,
          comments,
          shares,
          author_id,
          media,
          media_count,
          author:profiles!posts_author_id_fkey(
            id,
            username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user?.id);

      if (likesError) throw likesError;

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);

      if (!postsData) return [];

      const transformedPosts = postsData.map(post => {
        console.log("post", post);
        let mediaArray: PostMedia[] = [];

        if (post.media && Array.isArray(post.media)) {
          mediaArray = post.media.map(m => {
            const mediaItem = m as { url?: string; type?: string; order_index?: number };
            return {
              url: String(mediaItem.url || ''),
              type: mediaItem.type === 'video' ? 'video' : 'image',
              order_index: Number(mediaItem.order_index || 0)
            };
          });
        }

        return {
          ...post,
          liked_by_user: likedPostIds.has(post.id),
          media: mediaArray,
          media_count: post.media_count || 0,
          showComments: false,
          commentsList: []
        };
      });

      return transformedPosts as Post[];
    },
    enabled: !!user,
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: "always"
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    if (!searchTerm.trim()) return posts;

    const searchTermLower = searchTerm.toLowerCase();

    return posts.filter(post => {
      if (post.content && post.content.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      if (post.author) {
        const authorFullName = `${post.author.first_name} ${post.author.last_name}`.toLowerCase();
        if (authorFullName.includes(searchTermLower)) {
          return true;
        }

        if (post.author.username && post.author.username.toLowerCase().includes(searchTermLower)) {
          return true;
        }
      }

      return false;
    });
  }, [posts, searchTerm]);

  const fetchComments = async (postId: string) => {
    try {
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          author:profiles!post_comments_author_id_fkey (
            username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      queryClient.setQueryData(['feed-posts'], (oldData: Post[] | undefined) =>
        oldData?.map(p => p.id === postId ? {
          ...p,
          commentsList: comments || [],
          showComments: true
        } : p)
      );

      setShowCommentsForPost(postId);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    }
  };

  const toggleComments = async (postId: string) => {
    if (showCommentsForPost === postId) {
      setShowCommentsForPost(null);
      queryClient.setQueryData(['feed-posts'], (oldData: Post[] | undefined) =>
        oldData?.map(p => p.id === postId ? { ...p, showComments: false } : p)
      );
    } else {
      await fetchComments(postId);
    }
  };

  const { data: suggestedProfiles, isLoading: isProfilesLoading } = useQuery({
    queryKey: ['suggested-profiles'],
    queryFn: async () => {
      if (!user) return [];

      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const followingIds = (followingData || []).map(f => f.following_id);
      followingIds.push(user.id);

      console.log("followingIds", followingIds);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, first_name, last_name')
        .not('id', 'in', `(${followingIds.join(',')})`)
        ;

      if (error) throw error;

      const enhancedProfiles: EnhancedProfile[] = [];

      for (const profile of data) {
        const { count, error: countError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        if (!countError) {
          enhancedProfiles.push({
            ...profile,
            follower_count: count || 0
          });
        } else {
          console.error('Error fetching follower count:', countError);
          enhancedProfiles.push({
            ...profile,
            follower_count: 0
          });
        }
      }

      return enhancedProfiles;
    },
    enabled: !!user
  });

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts?.find(p => p.id === postId);
    if (!post) return;

    try {
      // Optimistically update UI
      queryClient.setQueryData(['feed-posts'], (oldData: Post[] | undefined) =>
        oldData?.map(p => p.id === postId ? {
          ...p,
          likes: p.liked_by_user ? p.likes - 1 : p.likes + 1,
          liked_by_user: !p.liked_by_user
        } : p)
      );

      if (post.liked_by_user) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        // Create notification for post like if not user's own post
        if (post.author && 'id' in post.author && post.author.id !== user.id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', user.id)
            .single();

          if (userData) {
            const userName = `${userData.first_name} ${userData.last_name}`;
            const postContent = post.content?.substring(0, 30) + (post.content && post.content.length > 30 ? '...' : '');

            await supabase
              .from('notifications')
              .insert([{
                type: 'post' as const,
                content: `${userName} liked your post: "${postContent}"`,
                entity_id: postId,
                user_id: post.author.id as string,
                readers: [] as any
              }]);
          }
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      queryClient.setQueryData(['feed-posts'], (oldData: Post[] | undefined) =>
        oldData?.map(p => p.id === postId ? {
          ...p,
          likes: post.likes,
          liked_by_user: post.liked_by_user
        } : p)
      );

      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment
        })
        .select(`
          id,
          content,
          created_at,
          author:profiles!post_comments_author_id_fkey (
            username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      queryClient.setQueryData(['feed-posts'], (oldData: Post[] | undefined) =>
        oldData?.map(p => p.id === postId ? {
          ...p,
          comments: p.comments + 1,
          commentsList: [...(p.commentsList || []), comment]
        } : p)
      );

      // Create notification for post comment
      const post = posts?.find(p => p.id === postId);

      if (post && post.author && 'id' in post.author && post.author.id !== user.id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', user.id)
          .single();

        if (userData) {
          const userName = `${userData.first_name} ${userData.last_name}`;
          const postContent = post.content?.substring(0, 30) + (post.content && post.content.length > 30 ? '...' : '');

          await supabase
            .from('notifications')
            .insert([{
              type: 'post' as const,
              content: `${userName} commented on your post: "${postContent}"`,
              entity_id: postId,
              user_id: post.author.id as string,
              readers: [] as any
            }]);
        }
      }

      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async (profileId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profileId });

      queryClient.setQueryData(['suggested-profiles'], (old: Profile[] | undefined) =>
        old?.filter(profile => profile.id !== profileId) || []
      );

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

      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });

      toast({
        title: "Success",
        description: "Started following user",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const shareToSocialMedia = (platform: string, post: Post) => {
    console.log(`Sharing to ${platform}:`, post);
    setShareDialogOpen(false);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Success",
      description: "Link copied to clipboard",
    });
    setShareDialogOpen(false);
  };

  const createPostMutation = useMutation({
    mutationFn: async ({ content, mediaFiles }: { content: string; mediaFiles: File[] }) => {
      if (!user) throw new Error("User not authenticated");

      const mediaUrls = [];

      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          mediaUrls.push({
            url: publicUrl,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            order_index: mediaUrls.length
          });
        }
      }

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          content,
          author_id: user.id,
          media: mediaUrls
        })
        .select()
        .single();

      if (postError) throw postError;

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast({
        description: "Post created successfully!",
      });
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = async (content: string, mediaFiles: File[]) => {
    await createPostMutation.mutateAsync({ content, mediaFiles });
  };

  const previewProfiles = suggestedProfiles?.slice(0, 5) || [];

  const handleViewProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  return (
    <DashboardLayout
      onSearch={handleSearch}
      searchTerm={searchTerm}
      showSearchBar={isHomePage}
      headerTitle={searchTerm && filteredPosts?.length === 0 ? "" : "Artist Feed" }
    >
      <div className="mt-[65px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 px-4 sm:px-6 lg:px-[170px] gap-4 lg:gap-8">
          <div className="col-span-1 lg:col-span-9 w-full">
            {
              searchTerm && filteredPosts?.length === 0 ?
                null:
              <div className="w-full h-[1px] bg-[#333333] mb-6" />
            }
            <div className="grid grid-cols-1 lg:grid-cols-6 w-full">
              <div className="col-span-1 lg:col-span-4 lg:col-start-2 w-full flex justify-center">
                {
                  searchTerm != "" && filteredPosts?.length === 0 ?
                    <EmptySearch searchTerm={searchTerm} />
                    :
                    <div className="w-full max-w-[400px] space-y-[24px]">
                      <div className="px-0">
                        <PostForm onSubmit={handleCreatePost} />
                      </div>
                      <div className="flex flex-col">
                        {filteredPosts.map((post, index) => (
                          <div key={post.id}>
                            <div className="w-full bg-[#161618]">
                              <div className="bg-[#161618] overflow-hidden mb-6">
                                <div className="py-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={post.author?.avatar_url ?? undefined} />
                                      <AvatarFallback><User2 className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-[14px] text-white">
                                        {post.author?.first_name} {post.author?.last_name}
                                      </h3>
                                      <span className="text-gray-400">•</span>
                                      <p className="text-[14px] text-gray-400">
                                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {post.media && post.media.length > 0 && (
                                  <div className="aspect-square w-full relative">
                                    <div className="w-full h-full rounded-[12px] overflow-hidden">
                                      <MediaCarousel
                                        media={post.media}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    {post.media && post.media.length > 0 && post.media[0].type === "video" && (
                                      <div className="absolute bottom-4 right-4 z-10">
                                        <div className="bg-black/50 rounded-full p-2">
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                            <line x1="23" y1="9" x2="17" y2="15" />
                                            <line x1="17" y1="9" x2="23" y2="15" />
                                          </svg>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="px-4 py-3 flex items-center gap-6">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleLike(post.id)}
                                    className={`hover:bg-transparent ${post.liked_by_user ? "text-primary" : "text-white"}`}
                                  >
                                    <Heart
                                      className={`h-[22px] w-[22px] ${post.liked_by_user ? "fill-primary text-primary" : "text-white"
                                        }`}
                                    />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCommentingOnPost(commentingOnPost === post.id ? null : post.id)}
                                    className="hover:bg-transparent text-white"
                                  >
                                    <MessageCircle className="h-[22px] w-[22px]" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPostForShare(post);
                                      setShareDialogOpen(true);
                                    }}
                                    className="hover:bg-transparent text-white"
                                  >
                                    <Share2 className="h-[22px] w-[22px]" />
                                  </Button>
                                </div>
                                <div className="px-4 pb-4 space-y-2">
                                  {post.likes > 0 && (
                                    <p className="font-medium text-sm text-white">{post.likes} likes</p>
                                  )}
                                  {post.content && (
                                    <p className="text-[15px] text-white">
                                      <span className="font-medium mr-2">{post.author?.first_name}</span>
                                      {post.content}
                                    </p>
                                  )}

                                  {post.comments > 0 && (
                                    <button
                                      className="text-sm text-gray-400 hover:text-gray-300"
                                      onClick={() => toggleComments(post.id)}
                                    >
                                      {showCommentsForPost === post.id ? "Hide comments" : `View all ${post.comments} comments`}
                                    </button>
                                  )}

                                  {showCommentsForPost === post.id && post.commentsList && (
                                    <div className="mt-3 space-y-3">
                                      {post.commentsList.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                          <Avatar className="w-8 h-8 shrink-0">
                                            <AvatarImage src={comment.author?.avatar_url ?? undefined} />
                                            <AvatarFallback>
                                              <User2 className="h-4 w-4" />
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <p className="text-[15px] text-white">
                                              <span className="font-medium mr-2">
                                                {comment.author?.first_name}
                                              </span>
                                              {comment.content}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {commentingOnPost === post.id && (
                                    <div className="mt-4 flex gap-2">
                                      <Input
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 bg-[#161618] border-none text-[15px] text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                                      />
                                      <Button
                                        onClick={() => handleComment(post.id)}
                                        variant="ghost"
                                        className="text-[#987D4D] hover:text-[#876C3C] hover:bg-transparent p-0 h-auto text-[15px]"
                                      >
                                        Post
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {index !== filteredPosts.length - 1 && (
                              <div className="w-full h-[1px] bg-[#333333] my-6" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                }
              </div>
            </div>
          </div>
          {
            ((searchTerm == "") || (searchTerm && filteredPosts?.length > 0)) &&
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-[88px]">
                <div className="w-full lg:w-[293px] rounded-lg bg-card text-card-foreground">
                  <div className="py-4 space-y-4">
                    <div className="px-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-400">Suggested for you</h3>
                      <Button
                        variant="link"
                        className="text-xs font-semibold"
                        onClick={() => setShowAllProfilesDialog(true)}
                      >
                        See All
                      </Button>
                    </div>
                    <div className="space-y-4 px-4">
                      {previewProfiles.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{profile.first_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {profile.first_name} {profile.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {profile.follower_count === 0
                                  ? "No followers yet"
                                  : `${profile.follower_count} followers`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[#987D4D]"
                            onClick={() => handleFollow(profile.id)}
                          >
                            Follow
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
          {
            ((searchTerm == "") || (searchTerm && filteredPosts?.length > 0)) &&
            <div className="lg:hidden w-full">
              <div className="bg-card text-card-foreground rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-400">Suggested for you</h3>
                  <Button
                    variant="link"
                    className="text-xs font-semibold"
                    onClick={() => setShowAllProfilesDialog(true)}
                  >
                    See All
                  </Button>
                </div>
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-4 w-max pb-4">
                    {previewProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex-none w-[160px] bg-[#161618] rounded-lg p-4"
                      >
                        <div className="flex flex-col items-center text-center space-y-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{profile.first_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none text-white">
                              {profile.first_name} {profile.last_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {profile.follower_count === 0
                                ? "No followers yet"
                                : profile.follower_count === 1
                                  ? "Followed by 1 person"
                                  : `Followed by ${profile.follower_count} people`}
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full text-[#987D4D]"
                            onClick={() => handleFollow(profile.id)}
                          >
                            Follow
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <Dialog open={showAllProfilesDialog} onOpenChange={setShowAllProfilesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suggested Profiles</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-2">
              {isProfilesLoading ? (
                <div>Loading profiles...</div>
              ) : suggestedProfiles && suggestedProfiles.length > 0 ? (
                suggestedProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between py-2">
                    <div
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handleViewProfile(profile.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{profile.first_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {profile.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile.follower_count === 0
                            ? "No followers yet"
                            : profile.follower_count === 1
                              ? "Followed by 1 person"
                              : `Followed by ${profile.follower_count} people`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[#987D4D]"
                      onClick={() => {
                        handleFollow(profile.id);
                      }}
                    >
                      Follow
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p>No suggested profiles found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ProfilePreviewModal
        userId={selectedProfileId}
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        post={selectedPostForShare}
        onShare={shareToSocialMedia}
        onCopy={copyToClipboard}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
