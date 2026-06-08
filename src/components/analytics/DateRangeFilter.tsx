import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, endOfDay, startOfMonth, endOfMonth, subDays, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export type DateRangeType = "daily" | "weekly" | "monthly" | "custom";

export interface DateFilterState {
  rangeType: DateRangeType;
  startDate: Date;
  endDate: Date;
}

interface DateRangeFilterProps {
  onChange: (filter: DateFilterState) => void;
}

const DateRangeFilter = ({ onChange }: DateRangeFilterProps) => {
  const [rangeType, setRangeType] = useState<DateRangeType>("monthly");
  const [customRange, setCustomRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    startDate: undefined,
    endDate: undefined,
  });
  
  // Get the current date
  const today = new Date();
  
  // Calculate dates based on selected range type
  const calculateDateRange = (type: DateRangeType): { startDate: Date, endDate: Date } => {
    console.log("Calculating date range for type:", type);
    
    // Changed from const to let so it can be reassigned
    let endDate = new Date();
    let startDate = new Date();
    
    switch (type) {
      case "daily":
        // Today
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case "weekly":
        // Last 7 days
        startDate = startOfDay(subDays(today, 6));
        endDate = endOfDay(today);
        break;
      case "monthly":
        // Current month
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "custom":
        // Use the selected custom range or default to current month
        if (customRange.startDate && customRange.endDate) {
          startDate = startOfDay(customRange.startDate);
          endDate = endOfDay(customRange.endDate);
        } else {
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
        }
        break;
    }
    
    console.log("Calculated date range:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type
    });
    
    return { startDate, endDate };
  };
  
  // Handle range type change
  const handleRangeTypeChange = (value: DateRangeType) => {
    console.log("Range type changed to:", value);
    setRangeType(value);
    const dateRange = calculateDateRange(value);
    
    // Log raw date objects for debugging
    console.log("Raw date objects before onChange:", {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      startDateISO: dateRange.startDate.toISOString(),
      endDateISO: dateRange.endDate.toISOString()
    });
    
    onChange({
      rangeType: value,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  };
  
  // Handle custom date selection
  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const newCustomRange = { ...customRange };
    
    // If no start date or both dates selected, set start date
    if (!customRange.startDate || (customRange.startDate && customRange.endDate)) {
      newCustomRange.startDate = date;
      newCustomRange.endDate = undefined;
      
      console.log("Custom range: Set start date", date);
    } 
    // If start date selected but no end date, set end date
    else if (customRange.startDate && !customRange.endDate) {
      // Ensure end date is not before start date
      if (date < customRange.startDate) {
        newCustomRange.endDate = customRange.startDate;
        newCustomRange.startDate = date;
      } else {
        newCustomRange.endDate = date;
      }
      
      console.log("Custom range: Set end date", date);
      
      // Trigger onChange with custom range
      const finalRange = {
        rangeType: "custom" as DateRangeType,
        startDate: startOfDay(newCustomRange.startDate),
        endDate: endOfDay(newCustomRange.endDate as Date)
      };
      
      console.log("Custom range complete:", {
        startDate: finalRange.startDate.toISOString(),
        endDate: finalRange.endDate.toISOString()
      });
      
      onChange(finalRange);
    }
    
    setCustomRange(newCustomRange);
  };
  
  // Format the custom date range for display
  const formatCustomDateRange = () => {
    if (customRange.startDate && customRange.endDate) {
      return `${format(customRange.startDate, "MMM d, yyyy")} - ${format(customRange.endDate, "MMM d, yyyy")}`;
    }
    if (customRange.startDate) {
      return `${format(customRange.startDate, "MMM d, yyyy")} - Select end date`;
    }
    return "Select date range";
  };
  
  // Initialize with default monthly range
  useEffect(() => {
    console.log("Initializing date filter with monthly range");
    const initialRange = calculateDateRange("monthly");
    
    // Log initial range for debugging
    console.log("Initial date range:", {
      startDate: initialRange.startDate.toISOString(),
      endDate: initialRange.endDate.toISOString()
    });
    
    onChange({
      rangeType: "monthly",
      startDate: initialRange.startDate,
      endDate: initialRange.endDate
    });
  }, []);
  
  return (
    <div className="flex items-center gap-4">
      <Select value={rangeType} onValueChange={(value) => handleRangeTypeChange(value as DateRangeType)}>
        <SelectTrigger className="w-[130px] bg-[#1C1C1E] border-[#2A2A2A] text-white">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent className="bg-[#1C1C1E] border-[#2A2A2A] text-white">
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      
      {rangeType === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="min-w-[240px] justify-start text-left font-normal bg-[#1C1C1E] border-[#2A2A2A] text-white"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatCustomDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#1C1C1E] border-[#2A2A2A]" align="start">
            <Calendar
              mode="single"
              selected={customRange.endDate || customRange.startDate}
              onSelect={handleCustomDateSelect}
              initialFocus
              className="bg-[#1C1C1E] text-white"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default DateRangeFilter;
