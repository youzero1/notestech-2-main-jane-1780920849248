import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, MousePointerClick, TrendingUp } from 'lucide-react';

interface NoteslinkAnalyticsProps {
  profileId: string;
}

interface AnalyticsData {
  total_views: number;
  total_clicks: number;
  top_links: Array<{ title: string; clicks: number }>;
}

export function NoteslinkAnalytics({ profileId }: NoteslinkAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    total_views: 0,
    total_clicks: 0,
    top_links: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [profileId]);

  const loadAnalytics = async () => {
    try {
      // Get page views
      const { data: viewsData, error: viewsError } = await supabase
        .from('noteslink_analytics')
        .select('id')
        .eq('profile_id', profileId)
        .eq('event_type', 'page_view');

      if (viewsError) throw viewsError;

      // Get link clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from('noteslink_analytics')
        .select('id')
        .eq('profile_id', profileId)
        .eq('event_type', 'link_click');

      if (clicksError) throw clicksError;

      // Get top links
      const { data: linksData, error: linksError } = await supabase
        .from('noteslink_links')
        .select('title, click_count')
        .eq('profile_id', profileId)
        .order('click_count', { ascending: false })
        .limit(5);

      if (linksError) throw linksError;

      setAnalytics({
        total_views: viewsData?.length || 0,
        total_clicks: clicksData?.length || 0,
        top_links: (linksData || []).map((link) => ({
          title: link.title,
          clicks: link.click_count || 0,
        })),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{analytics.total_views}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <MousePointerClick className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">{analytics.total_clicks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Click Rate</p>
              <p className="text-2xl font-bold">
                {analytics.total_views > 0
                  ? Math.round((analytics.total_clicks / analytics.total_views) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Links</h3>
        <div className="space-y-3">
          {analytics.top_links.map((link, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                <span className="font-medium">{link.title}</span>
              </div>
              <span className="text-muted-foreground">{link.clicks} clicks</span>
            </div>
          ))}
          {analytics.top_links.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No link clicks yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}
