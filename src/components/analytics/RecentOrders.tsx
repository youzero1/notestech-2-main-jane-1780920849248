import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateFilterState } from "./DateRangeFilter";
import { format, startOfDay, endOfDay } from "date-fns";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { toast } from "@/components/ui/use-toast";

interface RawOrderItem {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  items: OrderItem[];
  profile_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
  product_id: string;
  products?: {
    main_image: string;
  };
}

// Recent Orders Component
const RecentOrders = ({ 
  isLoading, 
  dateFilter 
}: { 
  isLoading: boolean; 
  dateFilter: DateFilterState 
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Changed from 10 to 5 orders per page
  const ORDERS_PER_PAGE = 5;
  
  // Format dates for query with proper timezone handling
  const formatDateForQuery = (date: Date) => {
    return date.toISOString();
  };
    
  // Format start and end dates for proper querying
  const formattedStartDate = dateFilter.startDate ?
    formatDateForQuery(startOfDay(dateFilter.startDate)) :
    formatDateForQuery(startOfDay(new Date()));
    
  const formattedEndDate = dateFilter.endDate ?
    formatDateForQuery(endOfDay(dateFilter.endDate)) :
    formatDateForQuery(endOfDay(new Date()));
  
  const { data: orderData, isLoading: isOrdersLoading, error } = useQuery({
    queryKey: ['admin-recent-orders', currentPage, formattedStartDate, formattedEndDate],
    queryFn: async () => {
      try {
        console.log("Fetching orders with date range:", {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          currentPage
        });
        
        // Fetch the total count first
        const countResult = await supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .gte('created_at', formattedStartDate)
          .lte('created_at', formattedEndDate);
        
        if (countResult.error) {
          console.error("Count query error:", countResult.error);
          throw countResult.error;
        }
        
        const totalCount = countResult.count || 0;
        console.log("Total order count:", totalCount);
        console.log("Date range:", {
          start: formattedStartDate,
          end: formattedEndDate
        });

        // Fetch paginated orders with profile data
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id, 
            amount, 
            currency,
            status, 
            items,
            profile_id,
            created_at,
            profiles:profile_id (username, avatar_url),
            product_id,
            products:product_id (main_image)
          `)
          .gte('created_at', formattedStartDate)
          .lte('created_at', formattedEndDate)
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE - 1);

        if (error) {
          console.error("Orders query error:", error);
          throw error;
        }
        
        console.log("Fetched orders:", orders?.length);
        console.log("Raw orders data sample:", orders?.slice(0, 3));
        // Log created_at values for debugging
        console.log("Order dates:", orders?.map(o => ({ id: o.id, created_at: o.created_at, status: o.status })));
        
        // Transform the orders data to ensure proper typing
        const transformedOrders = orders.map(order => {
          try {
            return {
              ...order,
              items: (order.items as RawOrderItem[]).map((item): OrderItem => ({
                id: item.id || '',
                name: item.name || '',
                price: item.price || 0,
                quantity: item.quantity || 1,
                selectedSize: item.selectedSize,
                selectedColor: item.selectedColor
              }))
            };
          } catch (err) {
            console.error('Error transforming order:', order.id, err);
            throw new Error(`Failed to transform order ${order.id}: ${err.message}`);
          }
        });
        
        return {
          orders: transformedOrders,
          totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / ORDERS_PER_PAGE))
        };
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
        throw error;
      }
    }
  });

  useEffect(() => {
    if (orderData) {
      setOrders(orderData.orders);
      setTotalPages(orderData.totalPages);
      console.log("Orders set in state:", orderData.orders.length);
    }
  }, [orderData]);

  useEffect(() => {
    // Reset to page 1 when date filter changes
    setCurrentPage(1);
    console.log("Date filter changed, resetting to page 1");
  }, [dateFilter]);

  useEffect(() => {
    if (error) {
      console.error("Error in orders query:", error);
      toast({
        title: "Error loading orders",
        description: "Failed to load recent orders. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "processing": return "text-orange-500";
      case "shipping": return "text-blue-500";
      case "completed": return "text-green-500";
      case "canceled": return "text-red-500";
      case "pending": return "text-yellow-500"; 
      default: return "text-gray-500";
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    // Always show: page 1, page 2, current page, and last page
    const items = [];
    
    // Show page 1
    if (totalPages >= 1) {
      items.push(
        <PaginationItem key={1} className="list-none">
          <PaginationLink 
            className={`px-3 py-1 rounded-lg text-gray-400 transition-colors ${
              currentPage === 1 
                ? "bg-[#987D4D] text-white" 
                : "hover:bg-[#987D4D] hover:text-white"
            }`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show page 2 if total pages > 1
    if (totalPages >= 2) {
      items.push(
        <PaginationItem key={2} className="list-none">
          <PaginationLink
            className={`px-3 py-1 rounded-lg text-gray-400 transition-colors ${
              currentPage === 2 
                ? "bg-[#987D4D] text-white" 
                : "hover:bg-[#987D4D] hover:text-white"
            }`}
            onClick={() => setCurrentPage(2)}
          >
            2
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add single ellipsis if there are pages between shown pages
    if (totalPages > 3) {
      items.push(
        <span key="ellipsis" className="text-gray-400 px-1">...</span>
      );
    }
    
    // Show current page if it's not 1, 2, or the last page
    if (currentPage > 2 && currentPage < totalPages) {
      items.push(
        <PaginationItem key={currentPage} className="list-none">
          <PaginationLink
            className="px-3 py-1 rounded-lg bg-[#987D4D] text-white"
            onClick={() => setCurrentPage(currentPage)}
          >
            {currentPage}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show last page if total pages > 2
    if (totalPages > 2) {
      items.push(
        <PaginationItem key={totalPages} className="list-none">
          <PaginationLink
            className={`px-3 py-1 rounded-lg text-gray-400 transition-colors ${
              currentPage === totalPages 
                ? "bg-[#987D4D] text-white" 
                : "hover:bg-[#987D4D] hover:text-white"
            }`}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Card className="bg-[#1C1C1E] border border-[#2A2A2A] shadow-[0_4px_12px_rgba(0,0,0,0.25)] overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Recent Orders</h2>
            {/* <p className="text-base text-gray-400">Monitor recent customer orders</p> */}
          </div>
          {/* <button className="text-gray-400 hover:text-white">
            <ArrowRight className="h-5 w-5" />
          </button> */}
        </div>
        {isLoading || isOrdersLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-6 text-red-400">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>Failed to load orders. Please try again.</span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md">
            <Table>
              <TableHeader className="bg-[#252529]">
                <TableRow className="hover:bg-[#252529]">
                  <TableHead className="text-xs text-gray-400 font-medium">PRODUCT</TableHead>
                  <TableHead className="text-xs text-gray-400 font-medium">CUSTOMER</TableHead>
                  <TableHead className="text-xs text-gray-400 font-medium">TOTAL</TableHead>
                  <TableHead className="text-xs text-gray-400 font-medium">STATUS</TableHead>
                  <TableHead className="text-xs text-gray-400 font-medium">DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      No orders found for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    // Get the first item from the order
                    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                    const productName = firstItem ? firstItem.name : 'Unknown Product';
                    const productImage = order.products?.main_image || "/public/lovable-uploads/58b209c3-66f2-494a-a2e4-47136d77ee59.png";
                    const username = order.profiles?.username || '@username';
                    const status = order.status || 'Processing';
                    const total = order.currency ? 
                      new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.amount) : 
                      '$0.00';
                    const orderDate = order.created_at ? new Date(order.created_at) : new Date();
                    const formattedDate = format(orderDate, 'MMM d, yyyy');
                    
                    return (
                      <TableRow key={order.id} className="border-b border-[#2A2A2A] hover:bg-[#252529]">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-[#252529]">
                              <img 
                                src={productImage} 
                                alt={productName} 
                                className="h-full w-full object-cover" 
                                onError={e => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/40x40/252529/gray?text=IMG";
                                }}
                              />
                            </div>
                            <span className="text-sm text-white">{productName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">{username}</TableCell>
                        <TableCell className="text-sm text-white">{total}</TableCell>
                        <TableCell>
                          <span className={`text-sm ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">{formattedDate}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mt-4 sm:mt-0">
            Show {ORDERS_PER_PAGE} from {orderData?.totalCount || 0}
          </div>
          <div className="flex items-center gap-4 list-none">
            <PaginationItem className="list-none">
              <button
                onClick={() => currentPage > 1 && setCurrentPage(prev => prev - 1)}
                className={`flex items-center justify-center ${currentPage === 1 ? "opacity-50" : ""}`}
                disabled={currentPage === 1}
              >
                <img 
                  src="/lovable-uploads/back.png" 
                  alt="Previous" 
                  className="w-8 h-8"
                />
              </button>
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem className="list-none">
              <button
                onClick={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)}
                className={`flex items-center justify-center ${currentPage === totalPages ? "opacity-50" : ""}`}
                disabled={currentPage === totalPages}
              >
                <img 
                  src="/lovable-uploads/next.png" 
                  alt="Next" 
                  className="w-8 h-8"
                />
              </button>
            </PaginationItem>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RecentOrders;
