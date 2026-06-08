import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MiniTrendChart from "@/components/ui/MiniTrendChart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DataPoint {
  date: string;
  value: number;
}

// Stat card component with icon, title, value, and trend
const StatCard = ({
  icon: Icon,
  title,
  value,
  change,
  children,
  isLoading,
  dateRange,
  dateFilterType,
  trendData,
  amountChange,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  change: string;
  children: React.ReactNode;
  isLoading: boolean;
  dateRange: string;
  dateFilterType?: string;
  trendData?: DataPoint[];
  amountChange?: string;
}) => {
  // Determine if change is positive, negative or neutral
  const isPositive = change.startsWith('+');
  const isNeutral = change === '0%' || change === '+0%';

  // Format the change value to remove the + or - sign
  const formattedChange = isNeutral ? '0%' : change.replace(/^[+-]/, '');

  // Determine the comparison text based on the dateFilterType
  const getComparisonText = () => {
    if (dateFilterType) {
      switch (dateFilterType) {
        case "daily": return "yesterday";
        case "weekly": return "last week";
        case "monthly": return "last month";
        case "custom": return "previous period";
        default: return "yesterday";
      }
    }
    
    // Fallback to inferring from dateRange string
    if (dateRange.includes("Today")) return "yesterday";
    if (dateRange.includes("Last 7 days")) return "last week";
    if (dateRange.includes("This month")) return "last month";
    
    return "yesterday"; // Default fallback
  };

  // Get previous period text for tooltip
  const getPreviousPeriodText = () => {
    if (dateFilterType) {
      switch (dateFilterType) {
        case "daily": return "yesterday";
        case "weekly": return "last week";
        case "monthly": return "last month";
        case "custom": return "previous period";
        default: return "yesterday";
      }
    }
    
    // Fallback to inferring from dateRange string
    if (dateRange.includes("Today")) return "yesterday";
    if (dateRange.includes("Last 7 days")) return "last week";
    if (dateRange.includes("This month")) return "last month";
    
    return "previous period"; // Default fallback
  };

  // Arrow up component
  const ArrowUp = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2.5L6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 6L6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Arrow down component
  const ArrowDown = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9.5L6 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 6L6 9.5L2.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Extract numeric values from trendData if available
  const chartData = trendData ? trendData.map(point => point.value) : undefined;

  return (
    <Card className="bg-[#1C1C1E] border border-[#2A2A2A] shadow-[0_4px_12px_rgba(0,0,0,0.25)] h-full">
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-xs text-gray-400">{dateRange}</p>
              </div>
              <div className="p-2 bg-black rounded-lg">
                <Icon className="h-4 w-4 text-[#987D4D]" />
              </div>
            </div>
            
            <div className="flex-grow">
              {/* Amount and trend chart in a flex row */}
              <div className="flex justify-between items-center mb-3">
                <div className="text-[28px] font-bold text-white leading-none">{value}</div>
                {!isNeutral && (
                  <div className="w-20 h-8 flex items-center">
                    {children || <MiniTrendChart isPositive={isPositive} data={chartData} />}
                  </div>
                )}
              </div>
              
              {/* Percentage change and amount change */}
              <div>
                {!isNeutral && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <span className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-[#5CB660]' : 'text-red-500'}`}>
                            {formattedChange}
                            {isPositive ? <ArrowUp /> : <ArrowDown />}
                          </span>
                          {amountChange && (
                            <span className="ml-2 text-sm" style={{ color: '#A3A3A3' }}>
                              {amountChange} vs {getComparisonText()}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1C1C1E] border border-[#2A2A2A] text-white p-2">
                        <p>Compared to {getPreviousPeriodText()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isNeutral && (
                  <div className="text-sm text-gray-400">
                    No change vs {getComparisonText()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
