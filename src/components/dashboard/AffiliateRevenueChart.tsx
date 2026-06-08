import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DollarSign } from "lucide-react";

export const AffiliateRevenueChart = () => {
  const { user } = useAuth();

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['affiliate-revenue', user?.id],
    queryFn: async () => {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData?.role) return null;

      // TODO: Affiliate performance tracking - tables not yet implemented
      // Will be implemented with Noteslink Pro tier
      const performanceData: any[] = [];
      
      if (!performanceData || performanceData.length === 0) return null;

      // Temporary placeholder - will be implemented with Noteslink
      const totalRevenue = 0;
      const topPartners: Array<{ name: string; revenue: number }> = [];
      const chartData: any[] = [];

      return {
        totalRevenue,
        chartData,
        topPartners
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Affiliate Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Program</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!revenueData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Affiliate Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold text-primary">
            ${revenueData.totalRevenue.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData.chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                {Object.keys(revenueData.chartData[0] || {})
                  .filter(key => key !== 'month')
                  .map((partner, index) => (
                    <Area
                      key={partner}
                      type="monotone"
                      dataKey={partner}
                      stackId="1"
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      fill={`hsl(${index * 60}, 70%, 50%, 0.2)`}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData.topPartners.map((partner) => (
              <div 
                key={partner.name}
                className="flex items-center p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-light tracking-tight">{partner.name}</h4>
                    <p className="text-sm text-muted-foreground font-light">
                      Total Revenue: ${partner.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <Button asChild className="w-full font-light">
              <Link to="/marketplace">View All Programs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
