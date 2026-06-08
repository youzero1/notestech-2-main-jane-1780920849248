
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DateFilterState } from "@/components/analytics/DateRangeFilter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, subWeeks, subDays, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types for the chart data
type ChartData = {
  name: string;
  income: number;
  expenses: number;
};

interface StatisticsProps {
  dateFilter?: DateFilterState;
}

const Statistics = ({ dateFilter }: StatisticsProps) => {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  
  // Default filter if not provided
  const defaultFilter: DateFilterState = {
    rangeType: "monthly",
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  };
  
  const filter = dateFilter || defaultFilter;
  
  // Function to generate formatted date range text
  const getDateRangeText = (filter: DateFilterState) => {
    switch (filter.rangeType) {
      case "daily":
        return format(filter.startDate, "MMM d, yyyy");
      case "weekly":
        return `${format(filter.startDate, "MMM d")} - ${format(filter.endDate, "MMM d, yyyy")}`;
      case "monthly":
        return format(filter.startDate, "MMMM yyyy");
      case "custom":
        return `${format(filter.startDate, "MMM d")} - ${format(filter.endDate, "MMM d, yyyy")}`;
      default:
        return "Current Period";
    }
  };
  
  // Function to get the appropriate comparison text based on the filter type
  const getPeriodComparisonText = (rangeType: string) => {
    switch (rangeType) {
      case "daily": return "yesterday";
      case "weekly": return "last week";
      case "monthly": return "last month";
      case "custom": return "previous period";
      default: return "previous period";
    }
  };
  
  // Function to calculate previous period dates based on filter type
  const getPreviousPeriodDates = (filter: DateFilterState) => {
    const { rangeType, startDate, endDate } = filter;
    
    switch (rangeType) {
      case "daily":
        return {
          startDate: startOfDay(subDays(startDate, 1)),
          endDate: endOfDay(subDays(endDate, 1)),
          label: "Previous Day"
        };
      case "weekly":
        return {
          startDate: startOfDay(subWeeks(startDate, 1)),
          endDate: endOfDay(subWeeks(endDate, 1)),
          label: "Previous Week"
        };
      case "monthly":
        return {
          startDate: startOfMonth(subMonths(startDate, 1)),
          endDate: endOfMonth(subMonths(startDate, 1)),
          label: "Previous Month"
        };
      case "custom":
        // For custom range, determine the number of days and subtract
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          startDate: startOfDay(subDays(startDate, diffDays)),
          endDate: endOfDay(subDays(endDate, diffDays)),
          label: "Previous Period"
        };
      default:
        return {
          startDate: startOfMonth(subMonths(startDate, 1)),
          endDate: endOfMonth(subMonths(startDate, 1)),
          label: "Previous Month"
        };
    }
  };
  
  // Get previous period dates
  const previousPeriod = getPreviousPeriodDates(filter);
  
  // Fetch financial data for current period
  const { data: currentPeriodData, isLoading: isCurrentLoading } = useQuery({
    queryKey: ['statistics-current', filter.startDate?.toISOString(), filter.endDate?.toISOString()],
    queryFn: async () => {
      // Format dates for query
      const startDate = filter.startDate.toISOString();
      const endDate = filter.endDate.toISOString();
      
      // Fetch income from orders table
      const { data: incomeData, error: incomeError } = await supabase
        .from('orders')
        .select('created_at, amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'completed');
      
      if (incomeError) throw incomeError;
      
      // Fetch expenses from a relevant table (assuming there's an expenses or costs table)
      // For this example, we'll simulate expenses data as 60% of income
      const totalIncome = incomeData?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
      const simulatedExpenses = totalIncome * 0.6;
      
      const formattedData: ChartData[] = [];
      
      // Format data for chart based on period type
      if (filter.rangeType === 'daily') {
        // For daily view, show hourly data
        const hourlyData: {[key: string]: {income: number, expenses: number}} = {};
        
        // Initialize hours
        for (let i = 0; i < 24; i++) {
          const hour = i < 10 ? `0${i}` : `${i}`;
          hourlyData[hour] = { income: 0, expenses: 0 };
        }
        
        // Fill in actual data
        incomeData?.forEach(order => {
          const hour = format(parseISO(order.created_at), 'HH');
          hourlyData[hour].income += Number(order.amount);
          // Simulate expenses
          hourlyData[hour].expenses += Number(order.amount) * 0.6;
        });
        
        // Convert to array format for chart
        Object.entries(hourlyData).forEach(([hour, values]) => {
          formattedData.push({
            name: `${hour}:00`,
            income: Math.round(values.income * 100) / 100,
            expenses: Math.round(values.expenses * 100) / 100
          });
        });
      } else if (filter.rangeType === 'weekly') {
        // For weekly view, show daily data
        const dailyData: {[key: string]: {income: number, expenses: number}} = {};
        
        // Get all days in the range
        const start = new Date(filter.startDate);
        const end = new Date(filter.endDate);
        const days = [];
        
        for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
          const dateString = format(day, 'yyyy-MM-dd');
          dailyData[dateString] = { income: 0, expenses: 0 };
          days.push(new Date(day));
        }
        
        // Fill in actual data
        incomeData?.forEach(order => {
          const dateString = format(parseISO(order.created_at), 'yyyy-MM-dd');
          if (dailyData[dateString]) {
            dailyData[dateString].income += Number(order.amount);
            // Simulate expenses
            dailyData[dateString].expenses += Number(order.amount) * 0.6;
          }
        });
        
        // Convert to array format for chart
        Object.entries(dailyData).forEach(([date, values]) => {
          formattedData.push({
            name: format(parseISO(date), 'MMM d'),
            income: Math.round(values.income * 100) / 100,
            expenses: Math.round(values.expenses * 100) / 100
          });
        });
      } else {
        // For monthly or custom, aggregate by days/weeks depending on range size
        const diffTime = Math.abs(filter.endDate.getTime() - filter.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 31) {
          // Use daily aggregation for ranges up to a month
          const dailyData: {[key: string]: {income: number, expenses: number}} = {};
          
          // Get all days in the range
          const start = new Date(filter.startDate);
          const end = new Date(filter.endDate);
          
          for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
            const dateString = format(day, 'yyyy-MM-dd');
            dailyData[dateString] = { income: 0, expenses: 0 };
          }
          
          // Fill in actual data
          incomeData?.forEach(order => {
            const dateString = format(parseISO(order.created_at), 'yyyy-MM-dd');
            if (dailyData[dateString]) {
              dailyData[dateString].income += Number(order.amount);
              // Simulate expenses
              dailyData[dateString].expenses += Number(order.amount) * 0.6;
            }
          });
          
          // Convert to array format for chart
          Object.entries(dailyData).forEach(([date, values]) => {
            formattedData.push({
              name: format(parseISO(date), 'MMM d'),
              income: Math.round(values.income * 100) / 100,
              expenses: Math.round(values.expenses * 100) / 100
            });
          });
        } else {
          // Use weekly aggregation for larger ranges
          // Group by week
          const weeklyData: {[key: string]: {income: number, expenses: number}} = {};
          
          incomeData?.forEach(order => {
            const weekNum = format(parseISO(order.created_at), 'w');
            const year = format(parseISO(order.created_at), 'yyyy');
            const key = `${year}-W${weekNum}`;
            
            if (!weeklyData[key]) {
              weeklyData[key] = { income: 0, expenses: 0 };
            }
            
            weeklyData[key].income += Number(order.amount);
            // Simulate expenses
            weeklyData[key].expenses += Number(order.amount) * 0.6;
          });
          
          // Convert to array format for chart
          Object.entries(weeklyData).forEach(([weekKey, values]) => {
            formattedData.push({
              name: `Week ${weekKey.split('-W')[1]}`,
              income: Math.round(values.income * 100) / 100,
              expenses: Math.round(values.expenses * 100) / 100
            });
          });
        }
      }
      
      return {
        chartData: formattedData,
        totalIncome,
        totalExpenses: simulatedExpenses
      };
    },
    enabled: !!filter.startDate && !!filter.endDate
  });
  
  // Fetch financial data for previous period
  const { data: previousPeriodData, isLoading: isPreviousLoading } = useQuery({
    queryKey: ['statistics-previous', previousPeriod.startDate?.toISOString(), previousPeriod.endDate?.toISOString()],
    queryFn: async () => {
      // Format dates for query
      const startDate = previousPeriod.startDate.toISOString();
      const endDate = previousPeriod.endDate.toISOString();
      
      // Fetch income from orders table
      const { data: incomeData, error: incomeError } = await supabase
        .from('orders')
        .select('created_at, amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'completed');
      
      if (incomeError) throw incomeError;
      
      // Calculate total income and expenses
      const totalIncome = incomeData?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
      const simulatedExpenses = totalIncome * 0.6;
      
      return {
        totalIncome,
        totalExpenses: simulatedExpenses
      };
    },
    enabled: !!previousPeriod.startDate && !!previousPeriod.endDate
  });
  
  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${Math.round(change)}%`;
  };
  
  // Calculate absolute amount changes
  const calculateAmountChange = (current: number, previous: number) => {
    const change = current - previous;
    return change >= 0 ? `+$${Math.round(change)}` : `-$${Math.abs(Math.round(change))}`;
  };
  
  const incomeChange = currentPeriodData?.totalIncome !== undefined && 
                      previousPeriodData?.totalIncome !== undefined
    ? calculateChange(currentPeriodData.totalIncome, previousPeriodData.totalIncome)
    : "";
  
  const expensesChange = currentPeriodData?.totalExpenses !== undefined && 
                        previousPeriodData?.totalExpenses !== undefined
    ? calculateChange(currentPeriodData.totalExpenses, previousPeriodData.totalExpenses)
    : "";
  
  const incomeAmountChange = currentPeriodData?.totalIncome !== undefined && 
                        previousPeriodData?.totalIncome !== undefined
    ? calculateAmountChange(currentPeriodData.totalIncome, previousPeriodData.totalIncome)
    : "";
    
  const expensesAmountChange = currentPeriodData?.totalExpenses !== undefined && 
                        previousPeriodData?.totalExpenses !== undefined
    ? calculateAmountChange(currentPeriodData.totalExpenses, previousPeriodData.totalExpenses)
    : "";
  
  // Custom tooltip component for hover states
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium mb-1">{label}</p>
          {/* <div className="space-y-1">
            <p className="text-[#8B5CF6] text-xs flex items-center">
              <span className="w-2 h-2 bg-[#8B5CF6] rounded-full mr-1"></span>
              Income: ${payload[0].value.toLocaleString()}
            </p>
            <p className="text-[#EF4444] text-xs flex items-center">
              <span className="w-2 h-2 bg-[#EF4444] rounded-full mr-1"></span>
              Expenses: ${payload[1].value.toLocaleString()}
            </p>
          </div> */}
        </div>
      );
    }
    return null;
  };

  // Get the current comparison period text
  const currentPeriodText = () => {
    switch (filter.rangeType) {
      case "daily": return "today";
      case "weekly": return "this week";
      case "monthly": return "this month";
      case "custom": return "this period";
      default: return "this period";
    }
  };

  return (
    <Card className="bg-[#1C1C1E] border border-[#2A2A2A] shadow-[0_4px_12px_rgba(0,0,0,0.25)] h-full">
      <div className="flex flex-col h-full">
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-xl font-semibold text-white">Statistics</h2>
              <p className="text-sm text-gray-400">Income and Expenses</p>
            </div>
          </div>
          
          {/* Date range and comparison period */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div className="text-sm text-gray-400">
              {getDateRangeText(filter)}
            </div>
            <div className="text-sm text-gray-400 mt-1 md:mt-0">
              vs {previousPeriod.label}
            </div>
          </div>
          
          {/* Income and Expenses summary with changes */}
          {/* <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-sm text-gray-400">Income</div>
              <div className="text-white text-lg font-medium">
                ${isCurrentLoading 
                  ? <Skeleton className="h-6 w-20 bg-gray-800" /> 
                  : currentPeriodData?.totalIncome.toLocaleString() || "0"}
              </div>
              {!isCurrentLoading && !isPreviousLoading && (
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <div className={`text-xs ${incomeChange.startsWith('+') ? 'text-green-500' : incomeChange === '0%' ? 'text-gray-400' : 'text-red-500'}`}>
                          {incomeChange}
                        </div>
                        {incomeAmountChange && (
                          <div className="text-xs text-green-500">
                            ({incomeAmountChange} {currentPeriodText()})
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1C1C1E] border border-[#2A2A2A] text-white p-2">
                      <p>Compared to {getPeriodComparisonText(filter.rangeType)}</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-sm text-gray-400">Expenses</div>
              <div className="text-white text-lg font-medium">
                ${isCurrentLoading 
                  ? <Skeleton className="h-6 w-20 bg-gray-800" /> 
                  : currentPeriodData?.totalExpenses.toLocaleString() || "0"}
              </div>
              {!isCurrentLoading && !isPreviousLoading && (
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <div className={`text-xs ${expensesChange.startsWith('+') ? 'text-red-500' : expensesChange === '0%' ? 'text-gray-400' : 'text-green-500'}`}>
                          {expensesChange}
                        </div>
                        {expensesAmountChange && (
                          <div className={`text-xs ${expensesAmountChange.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                            ({expensesAmountChange} {currentPeriodText()})
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1C1C1E] border border-[#2A2A2A] text-white p-2">
                      <p>Compared to {getPeriodComparisonText(filter.rangeType)}</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              )}
            </div>
          </div> */}

          <div className="flex-1" style={{ minHeight: "300px", height: "100%" }}>
            {isCurrentLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[300px] w-full rounded-lg bg-gray-800" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={currentPeriodData?.chartData || []}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  onMouseMove={(e) => {
                    if (e.activeTooltipIndex !== undefined) {
                      setActiveTooltipIndex(e.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setActiveTooltipIndex(null)}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="#666" 
                    axisLine={{ stroke: '#333' }}
                    tickLine={{ stroke: '#333' }}
                  />
                  <YAxis 
                    stroke="#666" 
                    axisLine={{ stroke: '#333' }}
                    tickLine={{ stroke: '#333' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#444', strokeWidth: 1 }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30}
                    formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#8B5CF6" }}
                    activeDot={{ r: 6 }}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#EF4444" }}
                    activeDot={{ r: 6 }}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Statistics;
