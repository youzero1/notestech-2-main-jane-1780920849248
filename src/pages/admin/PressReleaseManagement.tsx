
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import PressReleaseList from '@/components/press-release/PressReleaseList';
import { PressRelease } from '@/types/press-release';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ITEMS_PER_PAGE = 5;

const PressReleaseManagement = () => {
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeType, setActiveType] = useState<'all' | 'company' | 'media'>('all');
  const { toast } = useToast();

  const fetchPressReleases = async (page: number, type?: 'company' | 'media') => {
    try {
      setLoading(true);
      
      // Build the base query for count
      let countQuery = supabase
        .from('press_releases')
        .select('id', { count: 'exact', head: false });
      
      // Add type filter if specified
      if (type) {
        countQuery = countQuery.eq('type', type);
      }
      
      // Get total count for pagination
      const { count: totalItems, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      const total = totalItems || 0;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
      
      // Calculate offset
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      // Build the data query
      let dataQuery = supabase
        .from('press_releases')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      // Add type filter if specified
      if (type) {
        dataQuery = dataQuery.eq('type', type);
      }

      const { data, error } = await dataQuery;

      if (error) throw error;
      
      setPressReleases((data || []) as any);
    } catch (error) {
      console.error('Error fetching press releases:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load press releases. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPressReleases(page, activeType === 'all' ? undefined : activeType);
  };

  const handleTypeChange = (type: 'all' | 'company' | 'media') => {
    setActiveType(type);
    setCurrentPage(1); // Reset to first page
    fetchPressReleases(1, type === 'all' ? undefined : type);
  };

  const handleDeletePressRelease = async (id: string) => {
    try {
      const { error } = await supabase
        .from('press_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPressReleases(pressReleases.filter(pr => pr.id !== id));
      
      // If we've deleted the last item on a page and it's not the first page,
      // go back one page
      if (pressReleases.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
        fetchPressReleases(currentPage - 1, activeType === 'all' ? undefined : activeType);
      } else {
        fetchPressReleases(currentPage, activeType === 'all' ? undefined : activeType);
      }
      
      toast({
        title: "Press release deleted",
        description: "The press release has been successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting press release:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete press release. Please try again."
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPressReleases(currentPage);
  }, []);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Press Release Management</h1>
        
        <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => handleTypeChange(value as 'all' | 'company' | 'media')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="company">Company Press</TabsTrigger>
            <TabsTrigger value="media">Media Outlet</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <PressReleaseList 
            pressReleases={pressReleases} 
            onDelete={handleDeletePressRelease}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PressReleaseManagement;
