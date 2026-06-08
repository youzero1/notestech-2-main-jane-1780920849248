
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PressReleaseFormData } from '@/types/press-release';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/courses/RichTextEditor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Image, Calendar } from 'lucide-react';
import slugify from 'slugify';
import { format } from 'date-fns';

interface PressReleaseFormProps {
  initialData?: PressReleaseFormData;
  onSubmit: (formData: PressReleaseFormData) => Promise<void>;
  isEditing?: boolean;
}

const PressReleaseForm = ({ initialData, onSubmit, isEditing = false }: PressReleaseFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Define the default form state
  const defaultFormState: PressReleaseFormData = {
    title: '',
    content: '',
    description: '',
    slug: '',
    status: 'draft',
    thumbnail_image: '',
    cover_image: '',
    publish_date: '',
    type: 'company'
  };

  // Initialize with provided data or defaults
  const [formData, setFormData] = useState<PressReleaseFormData>(initialData || defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.thumbnail_image || null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialData?.cover_image || null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(initialData?.description?.length || 0);
  const MAX_DESCRIPTION_LENGTH = 300;

  // Generate slug from title if slug hasn't been manually edited
  useEffect(() => {
    if (formData.title && !isSlugManuallyEdited) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(prev.title, { lower: true, strict: true })
      }));
    }
  }, [formData.title, isSlugManuallyEdited]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If the user is editing the slug directly, mark it as manually edited
    if (name === 'slug') {
      setIsSlugManuallyEdited(true);
    }
    
    // Update character count for description
    if (name === 'description') {
      setDescriptionLength(value.length);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const handleStatusChange = (status: 'draft' | 'published') => {
    setFormData(prev => ({
      ...prev,
      status
    }));
  };

  const handleTypeChange = (type: 'company' | 'media') => {
    setFormData(prev => ({
      ...prev,
      type
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "The image must be smaller than 5MB."
      });
      return;
    }

    setImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "The cover image must be smaller than 5MB."
      });
      return;
    }

    setCoverImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let thumbnailUrl = formData.thumbnail_image;
      let coverImageUrl = formData.cover_image;

      // Upload thumbnail image if selected
      if (imageFile) {
        const filename = `${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('press_release_images')
          .upload(filename, imageFile);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('press_release_images')
          .getPublicUrl(filename);

        thumbnailUrl = urlData.publicUrl;
      }

      // Upload cover image if selected
      if (coverImageFile) {
        const filename = `cover_${Date.now()}_${coverImageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('press_release_covers')
          .upload(filename, coverImageFile);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('press_release_covers')
          .getPublicUrl(filename);

        coverImageUrl = urlData.publicUrl;
      }

      // Prepare data for submission - handle empty publish_date
      const submissionData = {
        ...formData,
        thumbnail_image: thumbnailUrl,
        cover_image: coverImageUrl,
        // Don't send empty string for publish_date to avoid SQL error
        publish_date: formData.publish_date ? formData.publish_date : null
      };

      // Submit the form data with the image URLs
      await onSubmit(submissionData);

      toast({
        title: `Press release ${isEditing ? 'updated' : 'created'}`,
        description: `The press release has been successfully ${isEditing ? 'updated' : 'created'}.`
      });

      navigate('/admin/press-releases');
    } catch (error) {
      console.error('Error saving press release:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} press release. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/press-releases')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
            </Button>
            <div className="flex items-center gap-2">
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleStatusChange(value as 'draft' | 'published')}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter press release title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleTypeChange(value as 'company' | 'media')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company Press</SelectItem>
                  <SelectItem value="media">Press from Media Outlet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="enter-press-release-slug"
                required
              />
              <p className="text-sm text-muted-foreground">
                This will be used in the URL: /press-releases/{formData.slug || 'your-slug'}
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Short Description</Label>
                <span className={`text-xs ${descriptionLength > MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter a brief description (max 300 characters)"
                className="min-h-[80px] resize-y"
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <p className="text-sm text-muted-foreground">
                This short description will appear in press release listings and at the top of the detail page.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cover-image">Cover Image</Label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('cover-image')?.click()}
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {coverImagePreview ? 'Change Cover Image' : 'Upload Cover Image'}
                  </Button>
                  {coverImagePreview && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setCoverImagePreview(null);
                        setCoverImageFile(null);
                        setFormData(prev => ({ ...prev, cover_image: '' }));
                      }}
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    id="cover-image"
                    name="cover-image"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                </div>
                
                {coverImagePreview && (
                  <div className="relative w-full h-60 border rounded overflow-hidden">
                    <img
                      src={coverImagePreview}
                      alt="Cover image preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  This image will be displayed as a hero image at the top of the press release.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('thumbnail')?.click()}
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {imagePreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
                  </Button>
                  {imagePreview && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setFormData(prev => ({ ...prev, thumbnail_image: '' }));
                      }}
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    id="thumbnail"
                    name="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                
                {imagePreview && (
                  <div className="relative w-40 h-40 border rounded overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  This image will be used in listings and previews of the press release.
                </p>
              </div>
            </div>

            {/* <div className="grid gap-2">
              <Label htmlFor="publish_date">Publish Date (optional)</Label>
              <Input
                id="publish_date"
                name="publish_date"
                type="datetime-local"
                value={formData.publish_date}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">
                If set, the press release will automatically be published at this date.
              </p>
            </div> */}

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                value={formData.content}
                onChange={handleContentChange}
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PressReleaseForm;
