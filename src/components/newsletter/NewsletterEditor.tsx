
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import RichTextEditor from '@/components/courses/RichTextEditor';

export default function NewsletterEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchNewsletter();
    }
  }, [id]);

  const fetchNewsletter = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setTitle(data.title);
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching newsletter:', error);
      toast.error('Failed to load newsletter');
      navigate('/admin/newsletters');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (saveAsDraft = true) => {
    if (!title.trim()) {
      toast.error('Please enter a title for the newsletter');
      return;
    }

    if (!content.trim()) {
      toast.error('Please add content to the newsletter');
      return;
    }

    try {
      setSaving(true);
      
      const newsletterData = {
        title,
        content,
        status: saveAsDraft ? 'draft' : 'published',
        published_at: saveAsDraft ? null : new Date().toISOString(),
      };

      let response;
      
      if (isEditing) {
        response = await supabase
          .from('newsletters')
          .update(newsletterData)
          .eq('id', id);
      } else {
        response = await supabase
          .from('newsletters')
          .insert([{
            ...newsletterData,
            created_by: user?.id,
          }]);
      }

      const { error } = response;
      if (error) throw error;

      toast.success(`Newsletter ${isEditing ? 'updated' : 'created'} successfully`);
      navigate('/admin/newsletters');
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} newsletter`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p>Loading newsletter...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isEditing ? 'Edit Newsletter' : 'Create Newsletter'}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/newsletters')}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Newsletter Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter newsletter title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
