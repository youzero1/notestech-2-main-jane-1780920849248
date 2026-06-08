
import React from 'react';
import { CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ 
  isOnline, 
  className 
}) => {
  return (
    <div className={cn("relative", className)}>
      <CircleDot 
        fill={isOnline ? "#4ADE80" : "#6B7280"}
        color={isOnline ? "#4ADE80" : "#6B7280"}
        className={cn(
          "h-2.5 w-2.5", 
          isOnline ? "text-green-500" : "text-gray-500 opacity-40"
        )} 
      />
    </div>
  );
};
