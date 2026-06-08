
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Mic2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export const RecentTracks = () => {
  const { user } = useAuth();

  const { data: recentTracks, isLoading } = useQuery({
    queryKey: ['recent-tracks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-light">
            <FileText className="h-6 w-6" />
            Recent Tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-light">
          <FileText className="h-6 w-6" />
          Recent Tracks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTracks?.map((track) => (
            <div key={track.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mic2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-light tracking-tight">{track.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                    <Clock className="h-4 w-4" />
                    <span>{track.duration}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-light text-muted-foreground">
                  {track.plays.toLocaleString()} plays
                </p>
              </div>
            </div>
          ))}
          <Button asChild className="w-full font-light">
            <Link to="/music?tab=business">View All Tracks</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
