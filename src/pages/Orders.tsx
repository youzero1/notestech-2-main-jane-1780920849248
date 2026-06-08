
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { Package, ChevronDown, ChevronUp, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface Order {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  payment_date: string | null;
  items: OrderItem[];
  product_id?: string;
}

// Constants for pagination
const ORDERS_PER_PAGE = 5;

const Orders = () => {
  const { user } = useAuth();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const toggleOrderExpansion = (orderId: string) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", user?.id, currentPage],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // First, get the total count of orders
      const countQuery = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("profile_id", user.id);
        
      const totalCount = countQuery.count || 0;
      
      // Then get the paginated orders
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE - 1);
      
      if (error) throw error;
      
      // Transform the Json items to properly typed OrderItem[]
      const transformedOrders = data.map(order => ({
        ...order,
        items: (order.items as any[] || []).map((item): OrderItem => ({
          id: item.id || '',
          name: item.name || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor
        }))
      })) as Order[];
      
      return {
        orders: transformedOrders,
        totalCount,
        totalPages: Math.ceil(totalCount / ORDERS_PER_PAGE)
      };
    },
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "failed":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (data && currentPage < data.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <DashboardLayout 
      headerTitle="My Orders" 
      headerDescription="View your order history"
      showSearchBar={false}
    >
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {isLoading && (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="border border-gray-800 rounded-lg p-4 bg-[#1E1E20]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))
          )}

          {error && (
            <div className="text-center py-8 border border-gray-800 rounded-lg">
              <p className="text-red-400">Error loading orders. Please try again later.</p>
            </div>
          )}

          {!isLoading && data && data.orders.length === 0 && (
            <div className="text-center py-16 border border-gray-800 rounded-lg">
              <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No orders yet</h3>
              <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
              <Button onClick={() => window.location.href = "/marketplace"}>
                Shop Now
              </Button>
            </div>
          )}

          {!isLoading && data && data.orders.map((order) => (
            <div key={order.id} className="border border-gray-800 rounded-lg p-4 bg-[#1E1E20]">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleOrderExpansion(order.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-gray-800 rounded-full p-2 mt-1">
                    <Package className="h-5 w-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Order #{order.id.substring(0, 8)}</p>
                    <p className="text-xs text-gray-400">
                      {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : "Unknown date"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge> */}
                  <p className="font-medium">
                    {formatCurrency(order.amount, order.currency)}
                  </p>
                  {expandedOrders.has(order.id) ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
              </div>

              {expandedOrders.has(order.id) && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="grid gap-4">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">Order Details</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-400">Order Date</p>
                          <p className="text-white">
                            {order.created_at ? format(new Date(order.created_at), 'PPP') : "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Payment Date</p>
                          <p className="text-white">
                            {order.payment_date ? format(new Date(order.payment_date), 'PPP') : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">Items</p>
                      <div className="space-y-3">
                        {order.items && order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start py-2 border-b border-gray-800 last:border-0">
                            <div>
                              <p className="text-white font-medium">{item.name}</p>
                              <div className="flex gap-2 text-xs text-gray-400 mt-1">
                                {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white">{formatCurrency(item.price, order.currency)}</p>
                              <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                      <p className="text-gray-400">Total</p>
                      <p className="text-white font-medium">{formatCurrency(order.amount, order.currency)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination Controls */}
          {!isLoading && data && data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="border-gray-700 hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-400">
                Page {currentPage} of {data.totalPages}
              </span>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= data.totalPages}
                className="border-gray-700 hover:bg-gray-800"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
