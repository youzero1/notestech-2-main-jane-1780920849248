
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, parseISO, eachDayOfInterval, isEqual, subDays, subWeeks, subMonths } from "date-fns";
import { DateFilterState } from "@/components/analytics/DateRangeFilter";

export const useAnalyticsData = (userId: string | undefined, dateFilter: DateFilterState) => {
  // Format dates for query with improved timezone handling
  const formatDateForQuery = (date: Date) => {
    return date.toISOString();
  };

  const formattedStartDate = dateFilter.startDate ? 
    formatDateForQuery(startOfDay(dateFilter.startDate)) : 
    null;
  
  const formattedEndDate = dateFilter.endDate ? 
    formatDateForQuery(endOfDay(dateFilter.endDate)) : 
    null;

  console.log("Date range for analytics query:", {
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    rawStartDate: dateFilter.startDate?.toISOString(),
    rawEndDate: dateFilter.endDate?.toISOString(),
    rangeType: dateFilter.rangeType
  });

  // Get previous period dates for calculating percentage changes based on filter type
  const getPreviousPeriodDates = () => {
    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    
    let previousStartDate: Date;
    let previousEndDate: Date;
    
    // Calculate previous period based on the selected filter type
    switch(dateFilter.rangeType) {
      case 'daily':
        // Previous day
        previousStartDate = subDays(startDate, 1);
        previousEndDate = subDays(endDate, 1);
        break;
        
      case 'weekly':
        // Previous week
        previousStartDate = subWeeks(startDate, 1);
        previousEndDate = subWeeks(endDate, 1);
        break;
        
      case 'monthly':
        // Previous month
        previousStartDate = subMonths(startDate, 1);
        previousEndDate = subMonths(endDate, 1);
        break;
        
      case 'custom':
      default:
        // For custom, calculate the duration and subtract that from start/end
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - diffDays);
    }
    
    return {
      startDate: formatDateForQuery(previousStartDate),
      endDate: formatDateForQuery(previousEndDate)
    };
  };
  
  const previousPeriod = getPreviousPeriodDates();

  // Helper function to ensure data has points for all days in range
  const fillMissingDates = (data: any[], startDate: Date, endDate: Date, valueKey: string = 'value') => {
    if (!data || data.length === 0) return [];
    
    // Create a map of existing data points by date
    const dataMap = new Map(
      data.map(item => [format(new Date(item.date), 'yyyy-MM-dd'), item[valueKey]])
    );
    
    // Generate all dates in the range
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Create a complete dataset with 0 for missing dates
    return allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        value: dataMap.has(dateStr) ? dataMap.get(dateStr) : 0
      };
    });
  };

  // Fetch user role to check if admin
  const { data: roleData, isLoading: isRoleLoading, error: roleError } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      try {
        if (!userId) return null;
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching user role:", error);
        throw error;
      }
    },
    enabled: !!userId
  });

  // Fetch current period analytics data
  const { data: analyticsData, isLoading, error: analyticsError } = useQuery({
    queryKey: ['admin-analytics', formattedStartDate, formattedEndDate],
    queryFn: async () => {
      try {
        if (!formattedStartDate || !formattedEndDate) return null;
        
        console.log("Fetching analytics data for period:", {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        });
        
        // Orders data - total earnings and order count
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, amount, status, created_at')
          .gte('created_at', formattedStartDate)
          .lte('created_at', formattedEndDate)
          .eq('status', 'completed');
        
        if (ordersError) throw ordersError;
        
        console.log("Retrieved orders count:", ordersData?.length || 0);
        
        // Calculate total earnings from completed orders within date range
        const totalEarnings = ordersData?.reduce((sum, order) => {
          const orderDate = new Date(order.created_at);
          // Double check date is within range (redundant but safe)
          if (dateFilter.startDate && dateFilter.endDate &&
              orderDate >= startOfDay(dateFilter.startDate) &&
              orderDate <= endOfDay(dateFilter.endDate)) {
            return sum + Number(order.amount);
          }
          return sum;
        }, 0) || 0;

        console.log("Total earnings for period:", {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          earnings: totalEarnings,
          ordersCount: ordersData?.length
        });
        
        // Tracks (music uploads) data
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select('id')
          .gte('created_at', formattedStartDate)
          .lte('created_at', formattedEndDate);
        
        if (tracksError) throw tracksError;
        
        // Course progress data
        const { data: courseProgressData, error: progressError } = await supabase
          .from('user_progress')
          .select('id, completed_at')
          .gte('completed_at', formattedStartDate)
          .lte('completed_at', formattedEndDate);
        
        if (progressError) throw progressError;
        
        // Calculate course completion rate
        // Get total number of users and courses
        const { count: userCount, error: userCountError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' });
        
        if (userCountError) throw userCountError;
        
        const { count: courseCount, error: courseCountError } = await supabase
          .from('courses')
          .select('id', { count: 'exact' });
        
        if (courseCountError) throw courseCountError;
        
        // Calculate potential total completions (users * courses)
        const potentialCompletions = (userCount || 1) * (courseCount || 1);
        
        // Calculate actual completions
        const actualCompletions = courseProgressData?.length || 0;
        
        // Calculate percentage (avoid division by zero)
        const courseCompletionRate = potentialCompletions > 0 
          ? Math.round((actualCompletions / potentialCompletions) * 100)
          : 0;

        console.log("Analytics data summary:", {
          orders: ordersData?.length || 0,
          completedOrders: ordersData?.length,
          earnings: totalEarnings,
          uploads: tracksData?.length || 0,
          courseCompletionRate
        });
        
        return {
          earnings: totalEarnings,
          orders: ordersData?.length || 0,
          uploads: tracksData?.length || 0,
          courseCompletion: courseCompletionRate
        };
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        throw error;
      }
    },
    enabled: !!roleData && !!formattedStartDate && !!formattedEndDate
  });

  // Fetch previous period analytics data for comparison
  const { data: previousAnalyticsData, error: previousAnalyticsError } = useQuery({
    queryKey: ['admin-analytics-previous', previousPeriod.startDate, previousPeriod.endDate],
    queryFn: async () => {
      try {
        // Orders data for previous period
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, amount, status, created_at')
          .gte('created_at', previousPeriod.startDate)
          .lte('created_at', previousPeriod.endDate)
          .eq('status', 'completed');
        
        if (ordersError) throw ordersError;
        
        // Calculate total earnings from completed orders
        const totalEarnings = ordersData?.reduce((sum, order) => 
          sum + Number(order.amount), 0) || 0;
        
        console.log("Previous period earnings:", {
          startDate: previousPeriod.startDate,
          endDate: previousPeriod.endDate,
          earnings: totalEarnings,
          ordersCount: ordersData?.length
        });
        
        // Tracks data for previous period
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select('id')
          .gte('created_at', previousPeriod.startDate)
          .lte('created_at', previousPeriod.endDate);
        
        if (tracksError) throw tracksError;
        
        // Course progress data for previous period
        const { data: courseProgressData, error: progressError } = await supabase
          .from('user_progress')
          .select('id')
          .gte('completed_at', previousPeriod.startDate)
          .lte('completed_at', previousPeriod.endDate);
        
        if (progressError) throw progressError;
        
        return {
          earnings: totalEarnings,
          orders: ordersData?.length || 0,
          uploads: tracksData?.length || 0,
          courseCompletions: courseProgressData?.length || 0
        };
      } catch (error) {
        console.error("Error fetching previous period analytics:", error);
        throw error;
      }
    },
    enabled: !!roleData && !!previousPeriod.startDate && !!previousPeriod.endDate
  });

  // Calculate percentage changes between current and previous periods
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${Math.round(change)}%`;
  };

  // Calculate absolute amount changes between current and previous periods
  const calculateAmountChange = (current: number, previous: number) => {
    const change = current - previous;
    return change >= 0 ? `+$${Math.round(change)}` : `-$${Math.abs(Math.round(change))}`;
  };

  // Calculate non-monetary changes (for metrics like orders, uploads)
  const calculateQuantityChange = (current: number, previous: number) => {
    const change = current - previous;
    return change >= 0 ? `+${change}` : `-${Math.abs(change)}`;
  };

  // Calculate percentage changes
  const changes = previousAnalyticsData ? {
    earnings: calculateChange(analyticsData?.earnings || 0, previousAnalyticsData.earnings || 0),
    orders: calculateChange(analyticsData?.orders || 0, previousAnalyticsData.orders || 0),
    uploads: calculateChange(analyticsData?.uploads || 0, previousAnalyticsData.uploads || 0),
    courseCompletion: calculateChange(analyticsData?.courseCompletion || 0, previousAnalyticsData.courseCompletions || 0)
  } : {
    earnings: "+0%",
    orders: "+0%",
    uploads: "+0%",
    courseCompletion: "+0%"
  };

  // Calculate absolute amount changes
  const amountChanges = previousAnalyticsData ? {
    earnings: calculateAmountChange(analyticsData?.earnings || 0, previousAnalyticsData.earnings || 0),
    orders: calculateQuantityChange(analyticsData?.orders || 0, previousAnalyticsData.orders || 0),
    uploads: calculateQuantityChange(analyticsData?.uploads || 0, previousAnalyticsData.uploads || 0),
    courseCompletion: `${(analyticsData?.courseCompletion || 0) - (previousAnalyticsData.courseCompletions || 0) >= 0 ? '+' : '-'}${Math.abs((analyticsData?.courseCompletion || 0) - (previousAnalyticsData.courseCompletions || 0))}%`
  } : {
    earnings: "+$0",
    orders: "+0",
    uploads: "+0",
    courseCompletion: "+0%"
  };

  // Format date range for display
  const getDisplayDateRange = () => {
    if (!dateFilter.startDate || !dateFilter.endDate) return "";
    
    const isSameYear = dateFilter.startDate.getFullYear() === dateFilter.endDate.getFullYear();
    
    if (isSameYear) {
      return `${format(dateFilter.startDate, "d MMM")} - ${format(dateFilter.endDate, "d MMM yyyy")}`;
    } else {
      return `${format(dateFilter.startDate, "d MMM yyyy")} - ${format(dateFilter.endDate, "d MMM yyyy")}`;
    }
  };

  const displayDateRange = getDisplayDateRange();

  // Combine all errors
  const error = roleError || analyticsError || previousAnalyticsError;

  return {
    roleData,
    isRoleLoading,
    analyticsData,
    isLoading,
    changes,
    amountChanges,
    displayDateRange,
    error,
    fillMissingDates
  };
};
