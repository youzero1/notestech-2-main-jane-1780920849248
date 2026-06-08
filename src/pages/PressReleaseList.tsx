
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { PressRelease } from '@/types/press-release';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ITEMS_PER_PAGE = 9;

type SortOption = 'newest' | 'oldest';

const PressReleaseList = () => {
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeType, setActiveType] = useState<'company' | 'media'>('company');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchPressReleases = async () => {
      try {
        setLoading(true);
        
        // Get total count for pagination
        const { count: totalItems, error: countError } = await supabase
          .from('press_releases')
          .select('id', { count: 'exact', head: false })
          .eq('status', 'published')
          .eq('type', activeType);
        
        if (countError) throw countError;
        
        const total = totalItems || 0;
        setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
        
        // Calculate offset
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        
        const query = supabase
          .from('press_releases')
          .select('*')
          .eq('status', 'published')
          .eq('type', activeType)
          .order('created_at', { ascending: sortBy === 'oldest' })
          .range(from, to);

        const { data, error } = await query;

        if (error) throw error;
        
        // Cast to ensure types match
        setPressReleases((data || []) as PressRelease[]);
      } catch (error) {
        console.error('Error fetching press releases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPressReleases();
  }, [currentPage, sortBy, activeType]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleTypeChange = (type: 'company' | 'media') => {
    setActiveType(type);
    setCurrentPage(1); // Reset to first page when type changes
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Always show the first page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="page-1">
          <PaginationLink onClick={() => handlePageChange(1)}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if there's a gap
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Show numbered pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Always show the last page
    if (endPage < totalPages) {
      // Show ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Layout>
      <div className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-[48px] font-bold mb-2 mt-12">Latest Press Release</h1>
          <p className="text-lg text-[#A3A3A3]">Stay Updated with Our Latest Announcements</p>
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div 
              onClick={() => handleTypeChange('company')}
              style={{ 
                backgroundColor: activeType === 'company' ? '#F3F4F6' : 'transparent', 
                color: activeType === 'company' ? 'black' : '#A3A3A3',
                padding: '8px 16px', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Company Press
            </div>
            <div
              onClick={() => handleTypeChange('media')}
              style={{
                backgroundColor: activeType === 'media' ? '#F3F4F6' : 'transparent',
                color: activeType === 'media' ? 'black' : '#A3A3A3',
                fontWeight: 500,
                fontSize: '16px',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Press from Media Outlet
            </div>
          </div>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger
              style={{ backgroundColor: '#F3F4F6', color: 'black', width: '320px', height: '48px' }}
            >
              <SelectValue placeholder="Most recent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="container mx-auto py-16 px-4">

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : pressReleases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400">No press releases available.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {pressReleases.map((pr) => (
                <Link key={pr.id} to={`/press-releases/${pr.slug}`} className="group">
                  <Card className="overflow-hidden h-full transition-all hover:shadow-lg rounded-[16px] bg-black text-white">
                    {pr.thumbnail_image && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={pr.thumbnail_image}
                          alt={pr.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-2 group-hover:text-[#987d4d] transition-colors line-clamp-2">
                        {pr.title}
                      </h2>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                        {pr.description || 'Explore cost-effective marketing strategies to promote your product business.'}
                      </p>
                      <Button variant="link" className="p-0 h-auto text-[#987d4d] flex items-center text-sm font-medium group-hover:underline">
                        Learn more <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {renderPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default PressReleaseList;
