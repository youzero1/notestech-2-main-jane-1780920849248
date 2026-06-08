
import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DollarSign, ShoppingCart, Music, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import StatCard from "@/components/analytics/StatCard";
import MiniLineChart from "@/components/analytics/MiniLineChart";
import RecentOrders from "@/components/analytics/RecentOrders";
import CustomerGrowth from "@/components/analytics/CustomerGrowth";
import DateRangeFilter, { DateFilterState } from "@/components/analytics/DateRangeFilter";
import { toast } from "@/components/ui/use-toast";
import CreditCardSlider from "@/components/analytics/CreditCardSlider";
import Statistics from "@/components/analytics/Statistics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO } from "date-fns";
import MiniDonutChart from "@/components/analytics/MiniDonutChart";

interface DataPoint {
  date: string;
  value: number;
}

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    rangeType: "monthly",
    startDate: new Date(),
    endDate: new Date()
  });
  
  const { 
    roleData, 
    isRoleLoading, 
    analyticsData, 
    isLoading, 
    changes,
    amountChanges,
    displayDateRange,
    error
  } = useAnalyticsData(user?.id, dateFilter);

  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['analytics-trends', dateFilter.rangeType, user?.id],
    queryFn: async () => {
      try {
        let daysToFetch = 7;
        let diffTime = 0;
        
        switch(dateFilter.rangeType) {
          case 'daily': daysToFetch = 7; break;
          case 'weekly': daysToFetch = 28; break;
          case 'monthly': daysToFetch = 90; break;
          case 'custom': 
            diffTime = Math.abs(dateFilter.endDate.getTime() - dateFilter.startDate.getTime());
            daysToFetch = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            break;
        }

        const endDate = new Date();
        const startDate = subDays(endDate, daysToFetch);
        
        const { data: earningsData, error: earningsError } = await supabase
          .from('orders')
          .select('created_at, amount')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('status', 'completed')
          .order('created_at', { ascending: true });
        
        if (earningsError) throw earningsError;
        
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('created_at, id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });
        
        if (ordersError) throw ordersError;
        
        const { data: uploadsData, error: uploadsError } = await supabase
          .from('tracks')
          .select('created_at, id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });
        
        if (uploadsError) throw uploadsError;
        
        const { data: completionsData, error: completionsError } = await supabase
          .from('user_progress')
          .select('completed_at, id')
          .gte('completed_at', startDate.toISOString())
          .lte('completed_at', endDate.toISOString())
          .order('completed_at', { ascending: true });
        
        if (completionsError) throw completionsError;
        
        const earningsByDay = earningsData?.reduce((acc: Record<string, number>, order) => {
          const date = format(parseISO(order.created_at), 'yyyy-MM-dd');
          acc[date] = (acc[date] || 0) + Number(order.amount);
          return acc;
        }, {});
        
        const earningsPoints: DataPoint[] = Object.entries(earningsByDay || {}).map(([date, value]) => ({
          date,
          value
        }));
        
        const ordersByDay = ordersData?.reduce((acc: Record<string, number>, order) => {
          const date = format(parseISO(order.created_at), 'yyyy-MM-dd');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        
        const ordersPoints: DataPoint[] = Object.entries(ordersByDay || {}).map(([date, value]) => ({
          date,
          value
        }));
        
        const uploadsByDay = uploadsData?.reduce((acc: Record<string, number>, upload) => {
          const date = format(parseISO(upload.created_at), 'yyyy-MM-dd');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        
        const uploadsPoints: DataPoint[] = Object.entries(uploadsByDay || {}).map(([date, value]) => ({
          date,
          value
        }));
        
        const completionsByDay = completionsData?.reduce((acc: Record<string, number>, completion) => {
          const date = format(parseISO(completion.completed_at), 'yyyy-MM-dd');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        
        const completionsPoints: DataPoint[] = Object.entries(completionsByDay || {}).map(([date, value]) => ({
          date,
          value
        }));
        
        return {
          earnings: earningsPoints,
          orders: ordersPoints,
          uploads: uploadsPoints,
          completions: completionsPoints
        };
      } catch (error) {
        console.error('Error fetching trending data:', error);
        return {
          earnings: [],
          orders: [],
          uploads: [],
          completions: []
        };
      }
    },
    enabled: !!user?.id && !!roleData
  });

  const isTrendPositive = (data: DataPoint[] = []) => {
    if (data.length < 2) return true;
    return data[0].value <= data[data.length - 1].value;
  };

  useEffect(() => {
    if (!isRoleLoading && !roleData) {
      navigate('/dashboard');
      toast({
        title: "Access Denied",
        description: "You don't have permission to view the analytics dashboard.",
        variant: "destructive",
      });
    }
  }, [roleData, isRoleLoading, navigate]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading analytics",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleDateFilterChange = (newFilter: DateFilterState) => {
    console.log("Analytics page: Date filter changed:", {
      rangeType: newFilter.rangeType,
      startDate: newFilter.startDate.toISOString(),
      endDate: newFilter.endDate.toISOString()
    });
    setDateFilter(newFilter);
  };

  if (isRoleLoading) {
    return (
      <DashboardLayout headerTitle="Analytics">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout headerTitle="Analytics">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 md:mb-0">Analytics Dashboard</h1>
          {displayDateRange && (
            <p className="text-sm text-gray-400 mt-1">Showing data for {displayDateRange}</p>
          )}
        </div>
        <DateRangeFilter onChange={handleDateFilterChange} />
      </div>
      
      {/* Stat cards section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          title="Total Earnings"
          value={`$${(analyticsData?.earnings || 0).toFixed(2)}`}
          change={changes.earnings}
          isLoading={isLoading || isTrendingLoading}
          dateRange={displayDateRange}
          dateFilterType={dateFilter.rangeType}
          trendData={trendingData?.earnings}
          amountChange={amountChanges.earnings}
        >
          <MiniLineChart 
            color="#5CB660" 
            data={trendingData?.earnings} 
            isPositive={isTrendPositive(trendingData?.earnings)}
            isLoading={isLoading || isTrendingLoading}
            title="Earnings Trend"
            valueText="Earnings change"
          />
        </StatCard>

        <StatCard
          icon={ShoppingCart}
          title="Total Orders"
          value={analyticsData?.orders || 0}
          change={changes.orders}
          isLoading={isLoading || isTrendingLoading}
          dateRange={displayDateRange}
          dateFilterType={dateFilter.rangeType}
          trendData={trendingData?.orders}
          amountChange={amountChanges.orders}
        >
          <MiniLineChart 
            color="#D946EF" 
            data={trendingData?.orders} 
            isPositive={isTrendPositive(trendingData?.orders)}
            isLoading={isLoading || isTrendingLoading}
            title="Orders Trend"
            valueText="Orders change"
          />
        </StatCard>

        <StatCard
          icon={Music}
          title="Total Music Uploads"
          value={analyticsData?.uploads || 0}
          change={changes.uploads}
          isLoading={isLoading || isTrendingLoading}
          dateRange={displayDateRange}
          dateFilterType={dateFilter.rangeType}
          trendData={trendingData?.uploads}
          amountChange={amountChanges.uploads}
        >
          <MiniLineChart 
            color="#33C3F0" 
            data={trendingData?.uploads} 
            isPositive={isTrendPositive(trendingData?.uploads)}
            isLoading={isLoading || isTrendingLoading}
            title="Upload Activity"
            valueText="Uploads change"
          />
        </StatCard>

        <StatCard
          icon={BookOpen}
          title="Courses Completed"
          value={`${analyticsData?.courseCompletion || 0}%`}
          change={changes.courseCompletion}
          isLoading={isLoading || isTrendingLoading}
          dateRange={displayDateRange}
          dateFilterType={dateFilter.rangeType}
          trendData={trendingData?.completions}
          amountChange={amountChanges.courseCompletion}
        >
          <div className="flex justify-center mt-2">
            <MiniDonutChart 
              percentage={analyticsData?.courseCompletion || 0} 
              color="#F97316"
              isLoading={isLoading}
              size={64}
            />
          </div>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-12 grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8">
            <RecentOrders isLoading={isLoading} dateFilter={dateFilter} />
          </div>
          
          <div className="xl:col-span-4">
            <CustomerGrowth isLoading={isLoading} dateFilter={dateFilter} />
          </div>
        </div>

        <div className="xl:col-span-12 grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4">
            <div className="w-full flex justify-center xl:justify-start h-full">
              <CreditCardSlider isLoading={isLoading} />
            </div>
          </div>
          
          <div className="xl:col-span-8">
            <div className="w-full h-full">
              <Statistics dateFilter={dateFilter} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
