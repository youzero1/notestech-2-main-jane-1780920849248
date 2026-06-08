import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Post as PostType } from "./types";
import { Post } from "./Post";
import { PostForm } from "./PostForm";
import { ShareDialog } from "./ShareDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_AVATAR } from "./constants";

const CommunityFeed = () => {
  const [editingPost, setEditingPost] = useState<PostType | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<PostType | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [newComment, setNewComment] = useState("");
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchPosts = async () => {
    if (!user) throw new Error("User not authenticated");
    
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          username,
          avatar_url,
          first_name,
          last_name
        ),
        comments:post_comments(count),
        likes:post_likes(count)
      `)
      .order('created_at', { ascending: false });

    if (activeTab === "my") {
      query = query.eq('author_id', user.id);
    }

    const { data: postsData, error: postsError } = await query;
    if (postsError) throw postsError;

    const { data: likesData, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      return transformPosts(postsData, []);
    }

    return transformPosts(postsData, likesData || []);
  };

  const transformPosts = (postsData: any[], likesData: any[]) => {
    const likedPostIds = new Set(likesData.map(like => like.post_id));

    return postsData.map(post => ({
      ...post,
      author: {
        ...post.author,
        avatar_url: post.author?.avatar_url || DEFAULT_AVATAR
      },
      liked_by_user: likedPostIds.has(post.id),
      showComments: commentingOnPost === post.id,
      commentsList: [],
      comments: post.comments[0]?.count || 0,
      likes: post.likes[0]?.count || 0,
      media: post.media || [],
      media_count: post.media_count || 0
    }));
  };

  const fetchComments = async (postId: string) => {
    if (!user) return [];

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(
            username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      return commentsData || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string, content: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content
        });

      if (error) throw error;

      const { data: postData } = await supabase
        .from('posts')
        .select('author_id, content')
        .eq('id', postId)
        .single();

      if (postData && postData.author_id !== user.id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (userData) {
          const userName = `${userData.first_name} ${userData.last_name}`;
          const postContent = postData.content.substring(0, 30) + (postData.content.length > 30 ? '...' : '');
          
          await supabase
            .from('notifications')
            .insert({
              type: 'post',
              content: `${userName} commented on your post: "${postContent}"`,
              entity_id: postId,
              user_id: postData.author_id,
              readers: []
            });
        }
      }

      return postId;
    },
    onSuccess: (postId) => {
      setNewComment("");
      
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      
      toast({
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', activeTab, user?.id],
    queryFn: fetchPosts,
    enabled: !!user,
    staleTime: 1000,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', commentingOnPost],
    queryFn: async () => {
      if (!commentingOnPost) return null;
      return fetchComments(commentingOnPost);
    },
    enabled: !!commentingOnPost,
  });

  const postsWithComments = posts.map(post => ({
    ...post,
    showComments: post.id === commentingOnPost,
    commentsList: post.id === commentingOnPost ? commentsData || [] : []
  }));

  const createPostMutation = useMutation({
    mutationFn: async ({ content, mediaFiles }: { content: string; mediaFiles: File[] }) => {
      if (!user) throw new Error("User not authenticated");

      const mediaUrls = [];
      
      for (const file of mediaFiles) {
        try {
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
        } catch (error) {
          console.error('Error handling media upload:', error);
          throw new Error('Failed to upload media');
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

      if (postError) {
        console.error('Detailed post creation error:', postError);
        throw postError;
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        description: "Post created successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ 
      postId, 
      content, 
      image, 
      shouldRemoveImage 
    }: { 
      postId: string; 
      content: string; 
      image: File | null;
      shouldRemoveImage: boolean;
    }) => {
      if (!user) throw new Error("User not authenticated");

      let imageUrl = shouldRemoveImage ? null : undefined;
      
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);
          
          imageUrl = publicUrl;
        }
      }

      const updates: any = { content };
      if (imageUrl !== undefined) {
        updates.image = imageUrl;
      }

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setEditingPost(null);
      setEditContent("");
      setEditImage(null);
      toast({
        title: "Success",
        description: "Post updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Success",
        description: "Post deleted successfully!",
      });
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!user) throw new Error("User not authenticated");

      if (liked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;

        const { data: postData } = await supabase
          .from('posts')
          .select('author_id, content')
          .eq('id', postId)
          .single();

        if (postData && postData.author_id !== user.id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

          if (userData) {
            const userName = `${userData.first_name} ${userData.last_name}`;
            const postContent = postData.content.substring(0, 30) + (postData.content.length > 30 ? '...' : '');
            
            await supabase
              .from('notifications')
              .insert({
                type: 'post',
                content: `${userName} liked your post: "${postContent}"`,
                entity_id: postId,
                user_id: postData.author_id,
                readers: []
              });
          }
        }
      }

      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return {
        postId,
        newLikesCount: count || 0,
        liked: !liked
      };
    },
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (old: any[] | undefined) => {
        if (!old) return [];
        
        return old.map((post: any) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: liked ? post.likes - 1 : post.likes + 1,
              liked_by_user: !liked
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(['posts'], (old: any[] | undefined) => {
        if (!old) return [];
        
        return old.map(post => {
          if (post.id === result.postId) {
            return {
              ...post,
              likes: result.newLikesCount,
              liked_by_user: result.liked
            };
          }
          return post;
        });
      });
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      console.error('Error toggling like:', err);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    await addCommentMutation.mutateAsync({ postId, content: newComment });
  };

  const handleCreatePost = async (content: string, mediaFiles: File[]) => {
    await createPostMutation.mutateAsync({ content, mediaFiles });
  };

  const handleUpdatePost = async (postId: string, content: string, image: File | null, shouldRemoveImage: boolean) => {
    if (content === "START_EDIT") {
      const postToEdit = posts?.find(p => p.id === postId);
      if (postToEdit) {
        setEditingPost(postToEdit);
      }
      return;
    }
    
    await updatePostMutation.mutateAsync({ postId, content, image, shouldRemoveImage });
    setEditingPost(null);
    setEditContent("");
    setEditImage(null);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePostMutation.mutateAsync(postId);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to like posts",
        variant: "destructive",
      });
      return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    await toggleLikeMutation.mutateAsync({ postId, liked: post.liked_by_user });
  };

  const handleComment = (postId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive",
      });
      return;
    }

    setCommentingOnPost(commentingOnPost === postId ? null : postId);
  };

  const shareToSocialMedia = async (platform: string, post: PostType) => {
    const postUrl = `${window.location.origin}/view-post?id=${post.id}`;
    let shareUrl = '';
    const text = encodeURIComponent(`Check out this post: ${postUrl}`);

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}`;
        break;
      case 'snapchat':
        shareUrl = `https://www.snapchat.com/share?url=${encodeURIComponent(postUrl)}`;
        break;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      try {
        const { error } = await supabase
          .from('posts')
          .update({ shares: posts.find(p => p.id === post.id)?.shares + 1 || 1 })
          .eq('id', post.id);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      } catch (error) {
        console.error('Error updating share count:', error);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleStartEdit = (post: PostType) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditImage(null);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} defaultValue="all" className="w-full" onValueChange={(value) => {
        setActiveTab(value);
        queryClient.invalidateQueries({ queryKey: ['posts', value] });
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">For You</TabsTrigger>
          <TabsTrigger value="my">My Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <PostForm onSubmit={handleCreatePost} />
          {postsWithComments.map((post) => (
            <Post
              key={post.id}
              post={post}
              isAuthor={user?.id === post.author_id}
              onLike={handleLike}
              onComment={() => handleComment(post.id)}
              onShare={() => {
                setSelectedPostForShare(post);
                setShareDialogOpen(true);
              }}
              onEdit={handleUpdatePost}
              onDelete={handleDeletePost}
              isEditing={editingPost?.id === post.id}
              editContent={editContent}
              setEditContent={setEditContent}
              editImage={editImage}
              setEditImage={setEditImage}
              cancelEdit={() => {
                setEditingPost(null);
                setEditContent("");
                setEditImage(null);
              }}
              newComment={newComment}
              onNewCommentChange={(value) => setNewComment(value)}
              onAddComment={() => handleAddComment(post.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="my" className="space-y-4 mt-6">
          <PostForm onSubmit={handleCreatePost} />
          {postsWithComments.map((post) => (
            <Post
              key={post.id}
              post={post}
              isAuthor={user?.id === post.author_id}
              onLike={handleLike}
              onComment={() => handleComment(post.id)}
              onShare={() => {
                setSelectedPostForShare(post);
                setShareDialogOpen(true);
              }}
              onEdit={handleUpdatePost}
              onDelete={handleDeletePost}
              isEditing={editingPost?.id === post.id}
              editContent={editContent}
              setEditContent={setEditContent}
              editImage={editImage}
              setEditImage={setEditImage}
              cancelEdit={() => {
                setEditingPost(null);
                setEditContent("");
                setEditImage(null);
              }}
              newComment={newComment}
              onNewCommentChange={(value) => setNewComment(value)}
              onAddComment={() => handleAddComment(post.id)}
            />
          ))}
        </TabsContent>
      </Tabs>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        post={selectedPostForShare}
        onShare={shareToSocialMedia}
        onCopy={copyToClipboard}
      />
    </div>
  );
};

export default CommunityFeed;

