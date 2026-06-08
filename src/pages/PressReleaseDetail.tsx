import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { PressRelease } from '@/types/press-release';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import RecentPressReleases from '@/components/press-release/RecentPressReleases';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';

const PressReleaseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pressRelease, setPressRelease] = useState<PressRelease | null>(null);
  const [recentPressReleases, setRecentPressReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPressRelease = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('press_releases')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Record not found
            navigate('/press-releases', { replace: true });
          }
          throw error;
        }
        
        // Cast the data to ensure type safety
        setPressRelease(data as PressRelease);
        
        // Fetch recent press releases (excluding the current one)
        const { data: recentData, error: recentError } = await supabase
          .from('press_releases')
          .select('id, title, slug, created_at, thumbnail_image, description')
          .eq('status', 'published')
          .neq('slug', slug)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (recentError) {
          throw recentError;
        }
        
        console.log('Recent press releases:', recentData);
        setRecentPressReleases(recentData as PressRelease[]);
      } catch (error) {
        console.error('Error fetching press release:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPressRelease();
  }, [slug, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pressRelease) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Press Release Not Found</h1>
            <p className="mb-6">The press release you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-16 px-4">
        <div className="mb-8">
          <div className="text-sm text-gray-400 mb-2 mt-20">10 min read</div>
          <h1 className="text-4xl font-bold mb-2 ">{pressRelease?.title}</h1>
          <p className="text-lg text-gray-300 mb-4">
            {pressRelease.description}
          </p>
          {pressRelease.cover_image && (
            <div className="w-full h-[400px] rounded-xl overflow-hidden mb-8 shadow-md">
              <img
                src={pressRelease.cover_image}
                alt={`${pressRelease.title} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: pressRelease?.content || '' }}
            />
          </div>
          
          <div className="w-full lg:w-1/3">
            <RecentPressReleases pressReleases={recentPressReleases} />
          </div>
        </div>

        {/* Social Media Icons Section */}
        <div className="w-full max-w-[768px] h-[64px] pt-6 gap-2 border-t border-[#292524] mt-8 flex justify-start items-center">
         <Link to="https://twitter.com">
          <button className="p-2 rounded-full border border-gray-600">
            <img src="/lovable-uploads/twitter.png" alt="Twitter" className="social-icon" />
          </button>
          </Link>
          <Link to="https://www.facebook.com">
            <button className="p-2 rounded-full border border-gray-600">
              <img src="/lovable-uploads/facebook.png" alt="Facebook" className="social-icon" />
            </button>
          </Link>
          <Link to="https://www.linkedin.com">
            <button className="p-2 rounded-full border border-gray-600">
              <img src="/lovable-uploads/linkedin.png" alt="LinkedIn" className="social-icon" />
            </button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default PressReleaseDetail;
