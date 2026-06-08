
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MiniDonutChartProps {
  percentage: number;
  color: string;
  isLoading?: boolean;
  size?: number;
  trackColor?: string;
  trackWidth?: number;
}

const MiniDonutChart: React.FC<MiniDonutChartProps> = ({
  percentage,
  color,
  isLoading = false,
  size = 64,
  trackColor = "#333333",
  trackWidth = 6,
}) => {
  // Ensure percentage is between 0-100
  const safePercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate circle properties
  const radius = size / 2;
  const circumference = 2 * Math.PI * (radius - trackWidth / 2);
  const dashOffset = circumference - (circumference * safePercentage) / 100;
  
  // Center position
  const center = size / 2;

  if (isLoading) {
    return <Skeleton className="h-16 w-16 rounded-full" />;
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius - trackWidth / 2}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={trackWidth}
          className="opacity-40"
        />
        
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius - trackWidth / 2}
          fill="transparent"
          stroke={color}
          strokeWidth={trackWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-500 ease-in-out"
        />
        
        {/* Add subtle inner glow/shadow */}
        <circle
          cx={center}
          cy={center}
          r={radius - trackWidth - 2}
          fill="transparent"
          filter="url(#innerShadow)"
          className="opacity-10"
        />
        
        {/* Define filters */}
        <defs>
          <filter id="innerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="0" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0" />
          </filter>
        </defs>
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-sm font-medium text-white">
          {safePercentage}%
        </div>
      </div>
    </div>
  );
};

export default MiniDonutChart;
