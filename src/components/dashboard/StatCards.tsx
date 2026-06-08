
import { Music, Play, Users, DollarSign, Link } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export const StatCards = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['track-stats', user?.id],
    queryFn: async () => {
      const { data: trackData, error } = await supabase
        .from('tracks')
        .select('id, plays, revenue')
        .eq('user_id', user?.id);

      if (error) throw error;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      // Get total earnings from memberships if user is admin
      let membershipRevenue = 0;
      if (roleData?.role === 'admin') {
        // Get monthly premium subscriptions
        const { data: monthlyMemberships } = await supabase
          .from('user_memberships')
          .select('valid_until')
          .eq('type', 'premium')
          .not('valid_until', 'is', null) // Monthly memberships have a valid_until date
          .gt('valid_until', new Date().toISOString()); // Only active memberships

        // Get annual premium subscriptions
        const { data: annualMemberships } = await supabase
          .from('user_memberships')
          .select('valid_until')
          .eq('type', 'premium')
          .is('valid_until', null); // Annual memberships have no valid_until date

        // Calculate total revenue ($19.99 for monthly, $199.99 for annual)
        membershipRevenue = ((monthlyMemberships?.length || 0) * 19.99) + 
                           ((annualMemberships?.length || 0) * 199.99);
      }

      // Get affiliate revenue if user is admin
      let affiliateRevenue = 0;
      // TODO: Affiliate performance tracking - tables not yet implemented
      // Will be implemented with Noteslink Pro tier
      if (roleData?.role === 'admin') {
        affiliateRevenue = 0;
      }

      return {
        totalTracks: trackData.length,
        totalPlays: trackData.reduce((sum, track) => sum + (track.plays || 0), 0),
        totalRevenue: trackData.reduce((sum, track) => sum + (track.revenue || 0), 0),
        isAdmin: roleData?.role === 'admin',
        membershipRevenue,
        affiliateRevenue
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-primary/10">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-primary/10 hover:bg-primary/20 transition-colors card-hover">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-light uppercase tracking-wider">Total Tracks</p>
              <h3 className="text-2xl font-light">{stats?.totalTracks || 0}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-primary/10 hover:bg-primary/20 transition-colors card-hover">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Play className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-light uppercase tracking-wider">Total Plays</p>
              <h3 className="text-2xl font-light">{(stats?.totalPlays || 0).toLocaleString()}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      {stats?.isAdmin && (
        <>
          <Card className="bg-primary/10 hover:bg-primary/20 transition-colors card-hover">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-light uppercase tracking-wider">Membership Revenue</p>
                  <h3 className="text-2xl font-light">${stats.membershipRevenue.toFixed(2)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 hover:bg-primary/20 transition-colors card-hover">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Link className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-light uppercase tracking-wider">Affiliate Revenue</p>
                  <h3 className="text-2xl font-light">${stats.affiliateRevenue.toFixed(2)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
