import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateFilterState } from "./DateRangeFilter";
import { toast } from "@/components/ui/use-toast";
import USMap from "./USMap";

// Customer Growth Component
const CustomerGrowth = ({ 
  isLoading,
  dateFilter
}: { 
  isLoading: boolean; 
  dateFilter: DateFilterState
}) => {
  const [stateData, setStateData] = useState<{id: string, name: string, count: number, color: string}[]>([]);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  const { data: customerData, isLoading: isCustomersLoading, error } = useQuery({
    queryKey: ['admin-customer-growth', dateFilter.startDate?.toISOString(), dateFilter.endDate?.toISOString()],
    queryFn: async () => {
      try {
        console.log("Fetching customer growth with date range:", {
          startDate: dateFilter.startDate?.toISOString(),
          endDate: dateFilter.endDate?.toISOString()
        });
        
        // Format dates for query
        const startDate = dateFilter.startDate ? 
          dateFilter.startDate.toISOString() :
          new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
        
        const endDate = dateFilter.endDate ? 
          dateFilter.endDate.toISOString() :
          new Date().toISOString();
        
        // Get all users with profile information including state, created within the date range
        const { data, error } = await supabase
          .from('profiles')
          .select('id, state, created_at')
          .not('state', 'is', null)
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        
        if (error) throw error;
        
        console.log("Fetched profiles:", data?.length);
        
        // Map and count profiles by state
        const stateMap = new Map<string, number>();
        
        data?.forEach(profile => {
          if (profile.state) {
            const state = profile.state.trim();
            stateMap.set(state, (stateMap.get(state) || 0) + 1);
          }
        });
        
        // Convert to array and sort by count
        const statesArray = Array.from(stateMap.entries())
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count);
        
        return statesArray.slice(0, 6); // Get top 6 states (increased from 4)
      } catch (error) {
        console.error("Error fetching customer growth:", error);
        throw error;
      }
    }
  });
  
  useEffect(() => {
    if (customerData) {
      // Map states to full names and assign colors
      const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F97316", "#EC4899", "#F43F5E"];
      const stateNames: {[key: string]: string} = {
        "CA": "California",
        "NY": "New York",
        "TX": "Texas",
        "FL": "Florida",
        "IL": "Illinois",
        "PA": "Pennsylvania",
        "OH": "Ohio",
        "GA": "Georgia",
        "NC": "North Carolina",
        "MI": "Michigan",
        "NJ": "New Jersey",
        "VA": "Virginia",
        "WA": "Washington",
        "AZ": "Arizona",
        "MA": "Massachusetts",
        "TN": "Tennessee",
        "IN": "Indiana",
        "MO": "Missouri",
        "MD": "Maryland",
        "WI": "Wisconsin"
      };
      
      const formattedData = customerData.map((state, index) => ({
        id: state.state.substring(0, 2).toUpperCase(),
        name: stateNames[state.state.substring(0, 2).toUpperCase()] || state.state,
        count: state.count,
        color: colors[index % colors.length]
      }));
      
      setStateData(formattedData);
    }
  }, [customerData]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading customer data",
        description: "Failed to load customer growth data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleStateHover = (stateId: string | null) => {
    setHoveredState(stateId);
  };

  const totalCustomers = stateData.reduce((sum, state) => sum + state.count, 0);

  return (
    <Card className="bg-[#1C1C1E] border border-[#2A2A2A] shadow-[0_4px_12px_rgba(0,0,0,0.25)] h-[620px]">
      <div className="flex flex-col h-full">
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-white">Customer Growth</h2>
            {/* <a href="#" className="flex items-center text-sm text-[#9A6AFE] hover:text-primary transition-colors">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </a> */}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-[#1C1C1E] pr-2">
            {isLoading || isCustomersLoading ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Skeleton className="h-[164px] w-[312px] rounded-md bg-black" />
                </div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-4 text-red-400">
                <AlertCircle className="mr-2 h-5 w-5" />
                <span>Failed to load customer data. Please try again.</span>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex justify-center">
                  <div className="relative h-[164px] w-[312px] mb-1 bg-black rounded-lg overflow-hidden">
                    <div className="absolute inset-0">
                      <USMap 
                        stateData={stateData} 
                        isLoading={isLoading || isCustomersLoading}
                        onStateHover={handleStateHover}
                        hoveredState={hoveredState}
                      />
                    </div>
                    
                    {hoveredState && stateData.find(s => s.id === hoveredState) && (
                      <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg">
                        <div className="text-white">
                          <div className="text-xs font-medium">{stateData.find(s => s.id === hoveredState)?.name}</div>
                          <div className="text-sm font-semibold">
                            {stateData.find(s => s.id === hoveredState)?.count.toLocaleString()} Customers
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  {stateData.length > 0 ? (
                    stateData.map((state) => (
                      <div 
                        key={state.id} 
                        className={`flex items-center gap-3 p-1.5 rounded-lg transition-colors duration-200 ${hoveredState === state.id ? 'bg-[#252529]' : 'hover:bg-[#252529]/50'}`}
                        onMouseEnter={() => setHoveredState(state.id)}
                        onMouseLeave={() => setHoveredState(null)}
                      >
                        <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-medium" 
                             style={{ backgroundColor: state.color }}>
                          {state.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-xs text-white font-medium">{state.name}</span>
                            <span className="text-xs text-white font-medium">
                              {state.count.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#252529] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${Math.min(100, (state.count / (stateData[0]?.count || 1)) * 100)}%`, 
                                backgroundColor: state.color 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No customer data available for the selected period
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CustomerGrowth;
