
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Invoice {
  id: string;
  profile_id: string;
  membership_type: string;
  amount: number;
  currency: string;
  status: string;
  payment_date: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
}

const ITEMS_PER_PAGE = 10;

const Subscriptions = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'payment_date' | 'amount' | 'membership_type'>('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['user-invoices', user?.id, page, sortBy, sortOrder],
    queryFn: async () => {
      if (!user) return { data: [], count: 0 };
      
      // Get the total count first
      const { count, error: countError } = await supabase
        .from('user_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id);
      
      if (countError) throw countError;
      
      // Get the paginated data
      const { data, error: dataError } = await supabase
        .from('user_invoices')
        .select('*')
        .eq('profile_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
      
      if (dataError) throw dataError;
      
      return { data: data as Invoice[], count: count || 0 };
    },
    enabled: !!user,
  });

  const totalPages = invoices?.count ? Math.ceil(invoices.count / ITEMS_PER_PAGE) : 0;

  const handleSort = (column: 'payment_date' | 'amount' | 'membership_type') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
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
      headerDescription="View your subscription payment history"
      showLink={true}
      redirectionLink="/dashboard"
      linkText="Back to Dashboard"
    >
      <div className="space-y-6">
        <Card className="bg-[#1C1C1E] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Subscription Payments</CardTitle>
            <CardDescription className="text-gray-400">
              Your complete subscription payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-6 text-center text-red-500">
                Error loading subscription history. Please try again.
              </div>
            ) : invoices?.data.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                No subscription payments found. Subscribe to a membership plan to see your payment history.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('payment_date')}
                            className="p-0 h-auto font-medium text-gray-400 hover:text-white"
                          >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-gray-400">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('membership_type')}
                            className="p-0 h-auto font-medium text-gray-400 hover:text-white"
                          >
                            Type
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-gray-400">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('amount')}
                            className="p-0 h-auto font-medium text-gray-400 hover:text-white"
                          >
                            Amount
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Invoice ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices?.data.map((invoice) => (
                        <TableRow key={invoice.id} className="border-gray-800">
                          <TableCell className="text-white">
                            {formatDate(invoice.payment_date)}
                          </TableCell>
                          <TableCell className="text-white capitalize">
                            {invoice.membership_type}
                          </TableCell>
                          <TableCell className="text-white">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                invoice.status === 'succeeded'
                                  ? 'bg-green-500/20 text-green-500'
                                  : invoice.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-500'
                                  : 'bg-red-500/20 text-red-500'
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-400 font-mono text-xs">
                            {invoice.stripe_invoice_id
                              ? invoice.stripe_invoice_id.substring(0, 8) + '...'
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Enhanced Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-800">
                    <div className="text-sm text-white font-medium">
                      Page <span className="text-primary">{page}</span> of {totalPages}
                    </div>
                    <div className="flex gap-3">
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
};

export default Subscriptions;
