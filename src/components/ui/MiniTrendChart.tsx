import React from "react";

interface MiniTrendChartProps {
  isPositive?: boolean;
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  data?: number[]; // Optional data points to use instead of random generation
}

const MiniTrendChart: React.FC<MiniTrendChartProps> = ({
  isPositive = true,
  color,
  width = 80,
  height = 30,
  strokeWidth = 2,
  data
}) => {
  // Determine color based on trend direction if not explicitly provided
  const chartColor = color || (isPositive ? "#5CB660" : "#FF4D4F");
  
  // Generate random points for the trend line if data is not provided
  const generatePoints = () => {
    const points = [];
    const segments = 8;
    
    // If data is provided, use it to generate points
    if (data && data.length > 0) {
      const maxValue = Math.max(...data);
      const minValue = Math.min(...data);
      const range = maxValue - minValue || 1;
      
      return data.map((value, i) => {
        const x = (i * width) / (data.length - 1);
        // Normalize the value to fit within the height
        const normalizedValue = ((value - minValue) / range);
        // Invert y-axis (SVG coordinates start from top)
        const y = height - (normalizedValue * height * 0.8) - (height * 0.1);
        return { x, y };
      });
    }
    
    // Otherwise generate random points
    for (let i = 0; i <= segments; i++) {
      const x = (i * width) / segments;
      
      // For positive trend, generally go up with some randomness
      // For negative trend, generally go down with some randomness
      let y;
      if (isPositive) {
        // Start higher, dip in the middle, end higher
        if (i < segments / 3) {
          y = height - (height * 0.3) - (Math.random() * height * 0.2);
        } else if (i < segments * 2/3) {
          y = height - (height * 0.7) + (Math.random() * height * 0.3);
        } else {
          y = height - (height * 0.2) - (Math.random() * height * 0.2);
        }
      } else {
        // Start lower, rise in the middle, end lower
        if (i < segments / 3) {
          y = height - (height * 0.7) - (Math.random() * height * 0.2);
        } else if (i < segments * 2/3) {
          y = height - (height * 0.3) + (Math.random() * height * 0.3);
        } else {
          y = height - (height * 0.8) - (Math.random() * height * 0.2);
        }
      }
      
      points.push({ x, y });
    }
    
    return points;
  };
  
  const points = generatePoints();
  
  // Create the SVG path from the points
  const createPath = (points: { x: number, y: number }[]) => {
    return points.map((point, i) => 
      i === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`
    ).join(' ');
  };
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d={createPath(points)}
        stroke={chartColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MiniTrendChart; 