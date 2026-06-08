
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Grid3X3, User2, UserPlus, Check, Mail, Globe, Instagram, Twitter } from "lucide-react";

interface ProfilePreviewModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  isFollowing: boolean;
}

interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

export const ProfilePreviewModal = ({ userId, isOpen, onClose }: ProfilePreviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [recentPosts, setRecentPosts] = useState<{ id: string; media_url: string | null }[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;

        // Check if current user is following this profile
        let isFollowing = false;
        if (user) {
          const { data: followData, error: followError } = await supabase
            .from("follows")
            .select("*")
            .eq("follower_id", user.id)
            .eq("following_id", userId)
            .single();
          
          if (!followError && followData) {
            isFollowing = true;
          }
        }

        // Fetch stats
        const [postsCount, followersCount, followingCount, recentPosts] = await Promise.all([
          supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("author_id", userId),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", userId),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", userId),
          supabase
            .from("posts")
            .select("id, media")
            .eq("author_id", userId)
            .order("created_at", { ascending: false })
            .limit(3)
        ]);

        // Transform posts to extract media URLs
        const transformedPosts = recentPosts.data?.map(post => {
          let mediaUrl = null;
          if (post.media && Array.isArray(post.media) && post.media.length > 0) {
            const firstMedia = post.media[0] as any;
            if (firstMedia && firstMedia.url) {
              mediaUrl = firstMedia.url;
            }
          }
          return { id: post.id, media_url: mediaUrl };
        }) || [];

        setProfileData({
          ...profileData,
          isFollowing
        });
        setStats({
          posts: postsCount.count || 0,
          followers: followersCount.count || 0,
          following: followingCount.count || 0
        });
        setRecentPosts(transformedPosts);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      fetchProfileData();
    }
  }, [userId, isOpen, user, toast]);

  const handleFollowToggle = async () => {
    if (!user || !profileData) return;
    
    setFollowLoading(true);
    try {
      if (profileData.isFollowing) {
        // Unfollow
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileData.id);
        
        setProfileData({ ...profileData, isFollowing: false });
        setStats({ ...stats, followers: stats.followers - 1 });
        
        toast({
          description: `Unfollowed ${profileData.first_name} ${profileData.last_name}`,
        });
      } else {
        // Follow
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: profileData.id });
        
        // Get follower info for notification
        const { data: followerData } = await supabase
          .from("profiles")
          .select("first_name, last_name, username")
          .eq("id", user.id)
          .single();

        // Create notification
        if (followerData) {
          const followerName = `${followerData.first_name} ${followerData.last_name}`;
          await supabase
            .from("notifications")
            .insert({
              type: "follow",
              content: `${followerName} started following you`,
              entity_id: user.id,
              user_id: profileData.id,
              readers: []
            });
        }
        
        setProfileData({ ...profileData, isFollowing: true });
        setStats({ ...stats, followers: stats.followers + 1 });
        
        toast({
          description: `Following ${profileData.first_name} ${profileData.last_name}`,
        });
      }
      
      // Update suggested profiles list
      queryClient.invalidateQueries({ queryKey: ["suggested-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {loading ? (
          <div className="py-10 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profileData ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Profile</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4 mt-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.avatar_url || undefined} />
                <AvatarFallback>
                  <User2 className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h2 className="text-xl font-bold">{profileData.first_name} {profileData.last_name}</h2>
                <p className="text-gray-500">{profileData.username}</p>
                {profileData.city && profileData.state && (
                  <p className="text-sm text-gray-500 mt-1">
                    {profileData.city}, {profileData.state}
                  </p>
                )}
              </div>
              
              {user && user.id !== profileData.id && (
                <Button 
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  variant={profileData.isFollowing ? "outline" : "default"}
                  className={profileData.isFollowing ? "" : "bg-[#987D4D] hover:bg-[#8b7142]"}
                >
                  {profileData.isFollowing ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              
              <div className="flex justify-around w-full pt-2">
                <div className="text-center">
                  <div className="font-bold">{stats.posts}</div>
                  <div className="text-gray-500 text-sm">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{stats.followers}</div>
                  <div className="text-gray-500 text-sm">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{stats.following}</div>
                  <div className="text-gray-500 text-sm">Following</div>
                </div>
              </div>
              
              <Separator />
              
              {profileData.bio && (
                <div className="w-full">
                  <p className="text-sm">{profileData.bio}</p>
                </div>
              )}
              
              {/* Social links */}
              <div className="flex flex-wrap gap-2 justify-center">
                {profileData.website && (
                  <a 
                    href={profileData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-500 hover:underline"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
                {profileData.instagram && (
                  <a 
                    href={`https://instagram.com/${profileData.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-pink-500 hover:underline"
                  >
                    <Instagram className="h-4 w-4 mr-1" />
                    Instagram
                  </a>
                )}
                {profileData.twitter && (
                  <a 
                    href={`https://twitter.com/${profileData.twitter.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-400 hover:underline"
                  >
                    <Twitter className="h-4 w-4 mr-1" />
                    Twitter
                  </a>
                )}
              </div>
              
              {/* Recent posts */}
              {recentPosts.length > 0 && (
                <>
                  <Separator />
                  <div className="w-full">
                    <div className="flex items-center mb-2">
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      <h3 className="font-medium">Recent Posts</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {recentPosts.map((post) => (
                        <div key={post.id} className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                          {post.media_url ? (
                            <img 
                              src={post.media_url} 
                              alt="Post" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-xs text-gray-500">No media</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-gray-500">
            No profile data found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
