
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export const EarningsChart = () => {
  const { user } = useAuth();

  const { data: playsData, isLoading } = useQuery({
    queryKey: ['plays-chart', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('created_at, plays')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Group by month and sum plays
      const monthlyData = data.reduce((acc: Record<string, number>, track) => {
        const month = new Date(track.created_at).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + (track.plays || 0);
        return acc;
      }, {});

      // Convert to array format for chart
      return Object.entries(monthlyData).map(([month, plays]) => ({
        month,
        plays,
      }));
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-light">
            <TrendingUp className="h-6 w-6" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-light">
          <TrendingUp className="h-6 w-6" />
          Monthly Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={playsData}>
              <defs>
                <linearGradient id="plays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B08D57" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#B08D57" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="plays" 
                stroke="#B08D57" 
                fillOpacity={1}
                fill="url(#plays)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
