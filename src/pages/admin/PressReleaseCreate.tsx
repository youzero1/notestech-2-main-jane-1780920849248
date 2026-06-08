
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import PressReleaseForm from '@/components/press-release/PressReleaseForm';
import { PressReleaseFormData } from '@/types/press-release';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const PressReleaseCreate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreatePressRelease = async (formData: PressReleaseFormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to create a press release.",
      });
      navigate('/auth');
      return;
    }

    const { error } = await supabase
      .from('press_releases')
      .insert([{
        ...formData,
        created_by: user.id
      }]);

    if (error) throw error;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Create Press Release</h1>
        
        <PressReleaseForm onSubmit={handleCreatePressRelease} />
      </div>
    </DashboardLayout>
  );
};

export default PressReleaseCreate;
