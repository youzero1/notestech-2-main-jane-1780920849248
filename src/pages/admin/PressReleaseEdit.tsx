
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import PressReleaseForm from '@/components/press-release/PressReleaseForm';
import { PressReleaseFormData } from '@/types/press-release';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PressReleaseEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [pressRelease, setPressRelease] = useState<PressReleaseFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPressRelease = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('press_releases')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast({
            variant: "destructive",
            title: "Not found",
            description: "Press release not found or you don't have permission to access it.",
          });
          navigate('/admin/press-releases');
          return;
        }
        
        setPressRelease({
          title: data.title,
          content: data.content,
          slug: data.slug,
          status: data.status as 'draft' | 'published',
          thumbnail_image: data.thumbnail_image,
          publish_date: data.publish_date || '',
          description: data.description,
          cover_image: data.cover_image,
          type: (data.type || 'company') as 'company' | 'media'
        });
      } catch (error) {
        console.error('Error fetching press release:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load press release. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPressRelease();
  }, [id, navigate, toast]);

  const handleUpdatePressRelease = async (formData: PressReleaseFormData) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('press_releases')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating press release:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!pressRelease) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Press Release Not Found</h1>
            <p>The press release you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Edit Press Release</h1>
        
        <PressReleaseForm
          initialData={pressRelease}
          onSubmit={handleUpdatePressRelease}
          isEditing
        />
      </div>
    </DashboardLayout>
  );
};

export default PressReleaseEdit;
