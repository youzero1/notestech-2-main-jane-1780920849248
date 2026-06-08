import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface Invoice {
  id: string;
  profile_id: string;
  amount: number;
  currency: string;
  membership_type: string;
  status: string;
  payment_date: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const ITEMS_PER_PAGE = 10;

// Update the MobileSubscriptionCard component to receive formatDate as a prop
const MobileInvoiceCard = ({ 
  invoice, 
  formatDate 
}: { 
  invoice: Invoice;
  formatDate: (date: string) => string;
}) => {
  return (
    <div className="bg-[#1C1C1E] p-4 rounded-lg border border-gray-800 mb-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-white">
              {`${invoice.profiles?.first_name || ''} ${invoice.profiles?.last_name || ''}`}
            </h3>
            <p className="text-sm text-gray-400">Customer</p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              invoice.status === 'succeeded'
                ? 'bg-green-500/20 text-green-500'
                : 'bg-red-500/20 text-red-500'
            }`}
          >
            {invoice.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Package</p>
            <p className="text-white capitalize">{invoice.membership_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Amount</p>
            <p className="text-white">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: invoice.currency.toUpperCase()
              }).format(invoice.amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Payment Date</p>
            <p className="text-white">{formatDate(invoice.payment_date)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionHistory() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'profiles.first_name' | 'membership_type' | 'payment_date'>('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['user_invoices', page, sortBy, sortOrder],
    queryFn: async () => {
      // Get the total count first
      const { count, error: countError } = await supabase
        .from('user_invoices')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get the paginated data with profile information
      const { data, error: dataError } = await supabase
        .from('user_invoices')
        .select(`
          id,
          profile_id,
          amount,
          currency,
          membership_type,
          status,
          payment_date,
          profiles (
            first_name,
            last_name
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (dataError) throw dataError;

      return { 
        data: data as Invoice[], 
        count: count || 0 
      };
    },
  });

  const totalPages = invoices?.count ? Math.ceil(invoices.count / ITEMS_PER_PAGE) : 0;

  const handleSort = (column: 'profiles.first_name' | 'membership_type' | 'payment_date') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <DashboardLayout
      headerTitle="Subscription History"
      headerDescription=""
      showSearchBar={false}
    >
      <div className="p-4 sm:p-8">
        <Card className="bg-[#1C1C1E] border-gray-800">
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-gray-400">Loading payment history...</p>
              </div>
            ) : invoices?.data.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                No payment records found.
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">
                          <Button
                            variant="ghost"
                            className="p-2 pl-1 h-auto font-medium text-gray-400 hover:text-white"
                          >
                            Customer Name
                          </Button>
                        </TableHead>
                        <TableHead className="text-gray-400">
                          <Button
                            variant="ghost"
                            className="p-2 pl-1 h-auto font-medium text-gray-400 hover:text-white"
                          >
                            Package
                          </Button>
                        </TableHead>
                        <TableHead className="text-gray-400">
                              <Button
                                variant="ghost"
                                className="p-2 pl-1 h-auto font-medium text-gray-400 hover:text-white"
                              >
                                Amount
                              </Button>
                          </TableHead>
                        <TableHead className="text-gray-400">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('payment_date')}
                            className="p-2 pl-1 h-auto font-medium text-gray-400 hover:text-white"
                          >
                            Payment Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-gray-400">
                          <Button
                                variant="ghost"
                                className="p-2 pl-1 h-auto font-medium text-gray-400 hover:text-white"
                              >
                                Status
                              </Button>
                          </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices?.data.map((invoice) => (
                        <TableRow key={invoice.id} className="border-gray-800">
                          <TableCell className="text-white">
                            {`${invoice.profiles?.first_name || ''} ${invoice.profiles?.last_name || ''}`}
                          </TableCell>
                          <TableCell className="text-white capitalize">
                            {invoice.membership_type}
                          </TableCell>
                          <TableCell className="text-white ">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: invoice.currency.toUpperCase()
                            }).format(invoice.amount)}
                          </TableCell>
                          <TableCell className="text-white">
                            {formatDate(invoice.payment_date)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                invoice.status === 'succeeded'
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-red-500/20 text-red-500'
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden">
                  {invoices?.data.map((invoice) => (
                    <MobileInvoiceCard 
                      key={invoice.id} 
                      invoice={invoice}
                      formatDate={formatDate}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-4 border-t border-gray-800 gap-4">
                    <div className="text-sm text-white font-medium order-2 sm:order-1">
                      Page <span className="text-primary">{page}</span> of {totalPages}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="border-primary/50 text-white hover:bg-primary/20 hover:border-primary disabled:opacity-50 shadow-sm transition-all"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="border-primary/50 text-white hover:bg-primary/20 hover:border-primary disabled:opacity-50 shadow-sm transition-all"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 