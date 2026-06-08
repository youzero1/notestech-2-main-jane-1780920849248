
import React, { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DataPoint {
  date: string;
  value: number;
}

interface MiniLineChartProps {
  color: string;
  data?: DataPoint[];
  isPositive?: boolean;
  isLoading?: boolean;
  title?: string;
  valueText?: string;
}

const MiniLineChart = ({ 
  color, 
  data = [], 
  isPositive = true,
  isLoading = false,
  title,
  valueText
}: MiniLineChartProps) => {
  const svgWidth = 100;
  const svgHeight = 30;
  const padding = 2; // Padding to prevent line from touching the edge

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const generatePathData = useMemo(() => {
    if (!data || data.length < 2 || isLoading) {
      // Default static path if no data is provided
      return `M0,${svgHeight/2} Q20,${isPositive ? svgHeight/4 : (3*svgHeight)/4} 40,${svgHeight/2} T60,${isPositive ? svgHeight/4 : (3*svgHeight)/4} T100,${isPositive ? 2 : svgHeight-2}`;
    }

    // Normalize data to fit in the SVG space
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1; // Prevent division by zero

    // Calculate SVG points mapped to the chart space
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (svgWidth - padding * 2) + padding;
      const y = svgHeight - ((d.value - minValue) / range) * (svgHeight - padding * 2) - padding;
      return { x, y };
    });

    // Generate SVG path with smooth curves instead of sharp lines
    if (points.length === 2) {
      // For just two points, use a simple curve
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;
      return `M${points[0].x},${points[0].y} Q${midX},${points[0].y} ${midX},${midY} Q${midX},${points[1].y} ${points[1].x},${points[1].y}`;
    }

    // For more points, use a smooth curve through all points
    let path = `M${points[0].x},${points[0].y}`;
    
    // Use cubic bezier curves for smoother transitions between points
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = points[i].x + (points[i+1].x - points[i].x) / 3;
      const y1 = points[i].y;
      const x2 = points[i].x + 2 * (points[i+1].x - points[i].x) / 3;
      const y2 = points[i+1].y;
      
      path += ` C${x1},${y1} ${x2},${y2} ${points[i+1].x},${points[i+1].y}`;
    }
    
    return path;
  }, [data, isPositive, isLoading, svgHeight]);

  if (isLoading) {
    return (
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="opacity-60">
        <path
          d={`M0,${svgHeight/2} Q20,${svgHeight/2} 40,${svgHeight/2} T60,${svgHeight/2} T100,${svgHeight/2}`}
          fill="none"
          stroke="#666"
          strokeWidth="1.5"
          strokeDasharray="3,3"
        />
      </svg>
    );
  }

  // Calculate trend information
  const trendInfo = useMemo(() => {
    if (data && data.length > 1) {
      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      const difference = lastValue - firstValue;
      const percentChange = firstValue !== 0 ? (difference / firstValue) * 100 : 0;
      
      return {
        startDate: formatDate(data[0].date),
        endDate: formatDate(data[data.length - 1].date),
        difference: Math.abs(difference),
        percentChange: percentChange.toFixed(1),
        isPositive: difference >= 0
      };
    }
    return null;
  }, [data]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="opacity-80 cursor-pointer">
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Add a gradient fill under the line */}
            {data && data.length > 1 && (
              <path
                d={`${generatePathData} L${svgWidth-padding},${svgHeight} L${padding},${svgHeight} Z`}
                fill={`url(#gradient-${color.replace('#', '')})`}
                strokeWidth="0"
              />
            )}
            
            {/* Main line path with increased stroke width for better visibility */}
            <path
              d={generatePathData}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Add pulse animation at the end of the line for visual effect */}
            {data && data.length > 1 && (
              <circle
                cx={svgWidth - padding}
                cy={svgHeight - ((data[data.length-1].value - Math.min(...data.map(d => d.value))) / 
                   (Math.max(...data.map(d => d.value)) - Math.min(...data.map(d => d.value)) || 1)) * 
                   (svgHeight - padding * 2) - padding}
                r="2"
                fill={color}
                className="animate-pulse"
              />
            )}
          </svg>
        </TooltipTrigger>
        <TooltipContent className="bg-[#1C1C1E] border border-[#2A2A2A] text-white p-3 rounded-md shadow-lg">
          <div className="text-xs space-y-2">
            {data && data.length > 0 ? (
              <>
                <div className="font-semibold text-sm">{title || (isPositive ? 'Trending Up' : 'Trending Down')}</div>
                {trendInfo && (
                  <>
                    <div className="text-gray-400">
                      {`${trendInfo.startDate} - ${trendInfo.endDate}`}
                    </div>
                    <div className="font-medium flex items-center space-x-1">
                      <span>{valueText || 'Value'}: </span>
                      <span className={trendInfo.isPositive ? 'text-[#5CB660]' : 'text-red-500'}>
                        {trendInfo.isPositive ? '+' : '-'}{trendInfo.difference.toFixed(0)}
                      </span>
                      <span className={trendInfo.isPositive ? 'text-[#5CB660]' : 'text-red-500'}>
                        ({trendInfo.isPositive ? '+' : '-'}{trendInfo.percentChange}%)
                      </span>
                    </div>
                  </>
                )}
                <div className="pt-1 border-t border-[#2A2A2A]">
                  {data.length} data points over time
                </div>
              </>
            ) : (
              <span>No trend data available</span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MiniLineChart;
