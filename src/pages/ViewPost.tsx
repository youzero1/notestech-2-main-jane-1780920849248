import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { MessageSquare, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, User2 } from "lucide-react";
import { ShareDialog } from "@/components/community/ShareDialog";
import type { Post, PostMedia, Comment } from "@/components/community/types";

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/bottts/svg?backgroundColor=b6e3f4";

const ViewPost = () => {
  const { id:postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null } | null>(null);
  const navigate = useNavigate();

  const fetchComments = async () => {
    if (!postId) return;

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(
            id,
            username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchPost = async () => {
    if (!postId) return;

    try {
      setIsLoading(true);
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id,
            username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      if (postData) {
        let avatarUrl = DEFAULT_AVATAR;
        if (postData.author?.avatar_url) {
          avatarUrl = postData.author.avatar_url;
        }

        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('post_id', postId)
          .eq('user_id', user?.id);

        let mediaArray: PostMedia[] = [];
        if (postData.media && Array.isArray(postData.media)) {
          mediaArray = postData.media.map((m: any) => ({
            url: String(m.url || ''),
            type: m.type === 'video' ? 'video' : 'image',
            order_index: Number(m.order_index || 0)
          }));
        }

        setPost({
          ...postData,
          author: {
            ...postData.author,
            avatar_url: avatarUrl
          },
          liked_by_user: likesData && likesData.length > 0,
          media: mediaArray,
          media_count: postData.media_count || 0,
          showComments: false,
          commentsList: []
        });

        await fetchComments();
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post || isLiking) return;

    try {
      setIsLiking(true);
      
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: post.likes - 1 })
          .eq('id', post.id);

        if (updateError) throw updateError;

        setPost(prev => prev ? {
          ...prev,
          likes: prev.likes - 1,
          liked_by_user: false
        } : null);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id });

        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: post.likes + 1 })
          .eq('id', post.id);

        if (updateError) throw updateError;

        if (post.author && 'id' in post.author && post.author.id !== user.id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', user.id)
            .single();

          if (userData) {
            const userName = `${userData.first_name} ${userData.last_name}`;
            
            await supabase
              .from('notifications')
              .insert([{
                type: 'post' as const,
                content: `${userName} liked your post: "${post.content.substring(0, 30)}${post.content.length > 30 ? '...' : ''}"`,
                entity_id: post.id,
                user_id: post.author.id as string,
                readers: [] as any
              }]);
          }
        }

        setPost(prev => prev ? {
          ...prev,
          likes: prev.likes + 1,
          liked_by_user: true
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!user || !post || !newComment.trim() || isCommenting) return;

    try {
      setIsCommenting(true);
      
      const { error: commentError } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          author_id: user.id,
          content: newComment
        });

      if (commentError) throw commentError;

      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments: post.comments + 1 })
        .eq('id', post.id);

      if (updateError) throw updateError;

      if (post.author && 'id' in post.author && post.author.id !== user.id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', user.id)
          .single();

        if (userData) {
          const userName = `${userData.first_name} ${userData.last_name}`;
          
          await supabase
            .from('notifications')
            .insert([{
              type: 'post' as const,
              content: `${userName} commented on your post: "${post.content.substring(0, 30)}${post.content.length > 30 ? '...' : ''}"`,
              entity_id: post.id,
              user_id: post.author.id as string,
              readers: [] as any
            }]);
        }
      }

      setNewComment("");
      await fetchComments();
      
      setPost(prev => prev ? {
        ...prev,
        comments: prev.comments + 1
      } : null);

    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const shareToSocialMedia = (platform: string) => {
    if (!post) return;
    
    const url = window.location.href;
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      incrementShareCount();
    }
  };

  const copyToClipboard = async () => {
    if (!post) return;
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        description: "Link copied to clipboard",
      });
      incrementShareCount();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const incrementShareCount = async () => {
    if (!post) return;

    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ shares: post.shares + 1 })
        .eq('id', post.id);

      if (updateError) throw updateError;

      setPost(prev => prev ? {
        ...prev,
        shares: prev.shares + 1
      } : null);
      
      setShareDialogOpen(false);
    } catch (error) {
      console.error('Error updating share count:', error);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId, user]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="p-4">
            <div className="flex gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return <DashboardLayout>Post not found</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Card className="p-4">
          <div className="flex gap-3">
            <img
              src={post.author?.avatar_url || DEFAULT_AVATAR}
              alt={post.author?.username || "User"}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {post.author?.first_name} {post.author?.last_name}
                </span>
                <span className="text-muted-foreground">
                  {post.author?.username}
                </span>
              </div>

              <p className="mt-2">{post.content}</p>

              {post.image && (
                <img
                  src={post.image}
                  alt="Post content"
                  className="mt-3 rounded-lg max-h-[500px] w-full object-cover"
                />
              )}

              <div className="flex gap-6 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  {isLiking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`mr-2 h-4 w-4 ${
                        post.liked_by_user ? "fill-primary text-primary" : ""
                      }`}
                    />
                  )}
                  {post.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {comments.length}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {post.shares}
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-2">
                  
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleComment}
                    disabled={!newComment.trim() || isCommenting}
                  >
                    {isCommenting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.author?.avatar_url || DEFAULT_AVATAR}
                      alt={comment.author?.username || "User"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {comment.author?.first_name} {comment.author?.last_name}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {comment.author?.username}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        post={post}
        onShare={shareToSocialMedia}
        onCopy={copyToClipboard}
      />
    </DashboardLayout>
  );
};

export default ViewPost;
