import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart } from 'lucide-react';
// SEO handled via document.title and meta tags
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NoteslinkProfile {
  id: string;
  profile_id: string;
  slug: string;
  theme_color: string;
  background_type: string;
  background_value: string | null;
  custom_bio: string | null;
  meta_title: string | null;
  meta_description: string | null;
  show_notes_badge: boolean;
  verified_badge: boolean;
  profile: {
    username: string;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
  };
}

interface NoteslinkLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  thumbnail_url: string | null;
  button_style: string;
  custom_color: string | null;
  order_index: number;
  click_count: number;
}

interface NoteslinkEmbed {
  id: string;
  platform: string;
  embed_url: string;
  embed_type: string;
  order_index: number;
}

export default function NoteslinkStage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<NoteslinkProfile | null>(null);
  const [links, setLinks] = useState<NoteslinkLink[]>([]);
  const [embeds, setEmbeds] = useState<NoteslinkEmbed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNoteslinkPage();
  }, [username]);

  const loadNoteslinkPage = async () => {
    // Redirect to home if no username provided
    if (!username || username.trim() === '') {
      window.location.href = '/';
      return;
    }

    try {
      // Get Noteslink profile
      const { data: profileData, error: profileError } = await supabase
        .from('noteslink_profiles')
        .select(`
          *,
          profile:profiles!noteslink_profiles_profile_id_fkey (
            username,
            avatar_url,
            first_name,
            last_name
          )
        `)
        .eq('slug', username)
        .eq('is_public', true)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as any);

      // Get active links
      const { data: linksData, error: linksError } = await supabase
        .from('noteslink_links')
        .select('*')
        .eq('profile_id', profileData.profile_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (linksError) throw linksError;
      setLinks(linksData || []);

      // Get active embeds
      const { data: embedsData, error: embedsError } = await supabase
        .from('noteslink_embeds')
        .select('*')
        .eq('profile_id', profileData.profile_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (embedsError) throw embedsError;
      setEmbeds(embedsData || []);

      // Track page view
      await trackAnalytics(profileData.profile_id, 'page_view');
    } catch (error) {
      console.error('Error loading Noteslink page:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackAnalytics = async (profileId: string, eventType: string, linkId?: string) => {
    try {
      await supabase.from('noteslink_analytics').insert({
        profile_id: profileId,
        event_type: eventType,
        link_id: linkId,
        session_id: sessionStorage.getItem('noteslink_session') || crypto.randomUUID(),
        referrer: document.referrer,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const handleLinkClick = async (link: NoteslinkLink) => {
    if (profile) {
      await trackAnalytics(profile.profile_id, 'link_click', link.id);
      
      // Update click count
      await supabase
        .from('noteslink_links')
        .update({
          click_count: link.click_count || 0 + 1,
          last_clicked_at: new Date().toISOString()
        })
        .eq('id', link.id);
    }
    window.open(link.url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">This Noteslink page doesn't exist.</p>
        </div>
      </div>
    );
  }

  const displayName = profile.profile.first_name 
    ? `${profile.profile.first_name} ${profile.profile.last_name || ''}`.trim()
    : profile.profile.username;

  const backgroundStyle = profile.background_type === 'gradient'
    ? { background: profile.background_value || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }
    : profile.background_type === 'image'
    ? { backgroundImage: `url(${profile.background_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: profile.background_value || 'hsl(var(--background))' };

  // Set document title
  useEffect(() => {
    if (profile) {
      document.title = profile.meta_title || `${displayName} - Noteslink`;
    }
  }, [profile]);

  return (
    <div className="min-h-screen relative overflow-hidden" style={backgroundStyle}>
      {/* Subtle grain texture overlay for authenticity */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      <div className="relative max-w-2xl mx-auto px-6 py-stage-sm md:py-stage">
        {/* Profile Header - Center Stage */}
        <div className="text-center mb-stage-sm animate-fade-in">
          {/* Avatar with spotlight effect */}
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-4 bg-gradient-to-b from-primary/20 to-transparent blur-2xl rounded-full" />
            <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-primary/30 shadow-2xl ring-2 ring-primary/10 ring-offset-4 ring-offset-background">
              <AvatarImage src={profile.profile.avatar_url || undefined} />
              <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Artist Name - Bold & Big (Ive + Rakim) */}
          <h1 className="text-stage-name font-display font-black text-foreground mb-4 tracking-tight flex items-center justify-center gap-3 flex-wrap">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              {displayName}
            </span>
            {profile.verified_badge && (
              <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm px-3 py-1 font-bold">
                ✓ VERIFIED
              </Badge>
            )}
          </h1>
          
          {/* Bio - Readable with breathing room */}
          {profile.custom_bio && (
            <p className="text-stage-bio text-muted-foreground max-w-lg mx-auto leading-relaxed px-4">
              {profile.custom_bio}
            </p>
          )}
        </div>

        {/* Embeds - Music First (Pharrell's emphasis) */}
        {embeds.length > 0 && (
          <div className="mb-12 space-y-6">
            {embeds.map((embed, index) => (
              <div 
                key={embed.id} 
                className="rounded-xl overflow-hidden shadow-2xl bg-card/80 backdrop-blur-sm border border-border/50 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {embed.platform === 'spotify' && (
                  <iframe
                    src={embed.embed_url}
                    width="100%"
                    height={embed.embed_type === 'player' ? '380' : '152'}
                    frameBorder="0"
                    allow="encrypted-media"
                    title={`Spotify ${embed.embed_type}`}
                    className="w-full"
                  />
                )}
                {embed.platform === 'youtube' && (
                  <iframe
                    width="100%"
                    height="315"
                    src={embed.embed_url}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video"
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Links - The Stage (Jakob's usability + Pharrell's flair) */}
        <div className="space-y-5">
          {links.map((link, index) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link)}
              className="group relative w-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              style={{
                backgroundColor: link.custom_color || 'hsl(var(--card))',
                borderRadius: link.button_style === 'rounded' ? '0.75rem' : 
                              link.button_style === 'pill' ? '9999px' : '0.5rem',
                animationDelay: `${(index + embeds.length) * 50}ms`,
              }}
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Border */}
              <div className="absolute inset-0 rounded-[inherit] border-2 border-border/50 group-hover:border-primary/30 transition-colors duration-300" />
              
              {/* Content */}
              <div className="relative flex items-center justify-between gap-4 p-6 md:p-7">
                <div className="flex items-center gap-4 flex-1 text-left min-w-0">
                  {link.thumbnail_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={link.thumbnail_url} 
                        alt="" 
                        className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover border-2 border-border/30 group-hover:border-primary/50 transition-all duration-300 shadow-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-stage-link text-foreground font-semibold truncate group-hover:text-primary transition-colors duration-300">
                      {link.title}
                    </div>
                    {link.description && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {link.description}
                      </div>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary flex-shrink-0 transform group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </button>
          ))}
        </div>

        {/* Notes Badge - Subtle but present */}
        {profile.show_notes_badge && (
          <div className="text-center mt-stage-sm pt-12 border-t border-border/30">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
            >
              <Heart className="h-4 w-4" fill="currentColor" />
              <span className="font-medium">Created with Notes</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
