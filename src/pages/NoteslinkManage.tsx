import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { NoteslinkSetup } from '@/components/noteslink/NoteslinkSetup';
import { NoteslinkLinks } from '@/components/noteslink/NoteslinkLinks';
import { NoteslinkEmbeds } from '@/components/noteslink/NoteslinkEmbeds';
import { NoteslinkTheme } from '@/components/noteslink/NoteslinkTheme';
import { NoteslinkAnalytics } from '@/components/noteslink/NoteslinkAnalytics';
import { NoteslinkPublish } from '@/components/noteslink/NoteslinkPublish';
import { ExternalLink, Settings, Link2, Music, Palette, BarChart3, Share2 } from 'lucide-react';

export default function NoteslinkManage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [noteslinkProfile, setNoteslinkProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNoteslinkProfile();
  }, [user]);

  const loadNoteslinkProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('noteslink_profiles')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setNoteslinkProfile(data);
    } catch (error) {
      console.error('Error loading Noteslink profile:', error);
      toast.error('Failed to load Noteslink profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCreated = (profile: any) => {
    setNoteslinkProfile(profile);
    toast.success('Noteslink created successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!noteslinkProfile) {
    return <NoteslinkSetup onProfileCreated={handleProfileCreated} />;
  }

  const publicUrl = `https://notes.unstucklabs.app/${noteslinkProfile.slug}`;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full border-[20px] border-current animate-[spin_30s_linear_infinite]" />
        <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full border-[15px] border-current animate-[spin_25s_linear_infinite_reverse]" />
      </div>

      <div className="border-b bg-gradient-to-r from-card to-card/50 backdrop-blur shadow-[0_8px_32px_-8px_hsl(var(--vinyl-black)/0.4)] relative">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bebas tracking-wider bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] bg-clip-text text-transparent">
                BACKSTAGE CONTROL
              </h1>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2 font-inter">
                <ExternalLink className="h-3 w-3" />
                {publicUrl}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(publicUrl, '_blank')}
                className="border-[hsl(var(--noteslink-gold))]/30 hover:border-[hsl(var(--noteslink-gold))] hover:bg-[hsl(var(--noteslink-gold))]/10 transition-all"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="font-bebas tracking-wide">Take the Stage</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="border-border/50 hover:border-border transition-all"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-card to-card/50 backdrop-blur border-[hsl(var(--noteslink-gold))]/20 p-1 h-auto">
            <TabsTrigger 
              value="links" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--noteslink-gold))] data-[state=active]:to-[hsl(var(--mic-gold))] data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <Link2 className="h-4 w-4" />
              <span className="font-bebas tracking-wide">Tracks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="embeds" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--noteslink-gold))] data-[state=active]:to-[hsl(var(--mic-gold))] data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <Music className="h-4 w-4" />
              <span className="font-bebas tracking-wide">Media</span>
            </TabsTrigger>
            <TabsTrigger 
              value="theme" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--noteslink-gold))] data-[state=active]:to-[hsl(var(--mic-gold))] data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <Palette className="h-4 w-4" />
              <span className="font-bebas tracking-wide">Style</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--noteslink-gold))] data-[state=active]:to-[hsl(var(--mic-gold))] data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-bebas tracking-wide">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="share" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--noteslink-gold))] data-[state=active]:to-[hsl(var(--mic-gold))] data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <Share2 className="h-4 w-4" />
              <span className="font-bebas tracking-wide">Share</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--noteslink-gold))] data-[state=active]:to-[hsl(var(--mic-gold))] data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <Settings className="h-4 w-4" />
              <span className="font-bebas tracking-wide">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links">
            <NoteslinkLinks profileId={user!.id} />
          </TabsContent>

          <TabsContent value="embeds">
            <NoteslinkEmbeds profileId={user!.id} />
          </TabsContent>

          <TabsContent value="theme">
            <NoteslinkTheme 
              profileId={user!.id} 
              noteslinkProfile={noteslinkProfile}
              onUpdate={loadNoteslinkProfile}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <NoteslinkAnalytics profileId={user!.id} />
          </TabsContent>

          <TabsContent value="share">
            <NoteslinkPublish profileSlug={noteslinkProfile.slug} />
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
              <p className="text-muted-foreground">Settings coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
