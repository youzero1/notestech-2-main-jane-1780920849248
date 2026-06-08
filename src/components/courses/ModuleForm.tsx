import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RichTextEditor from "./RichTextEditor";
import FileUpload from "./FileUpload";
import VideoUpload from "./VideoUpload";
import { QuizForm } from "./QuizForm";
import { Trash2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const moduleSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  content: z.string()
    .min(1, "Content is required")
    .min(50, "Content must be at least 50 characters"),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

interface ModuleFormProps {
  onSave: (data: ModuleFormValues) => void;
  onDelete?: () => void;
  defaultValues?: Partial<ModuleFormValues>;
  index: number;
  isImageRequired?: boolean;
}

export function ModuleForm({ onSave, onDelete, defaultValues, index, isImageRequired = false }: ModuleFormProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [contentFiles, setContentFiles] = useState<string[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [newKeyPoint, setNewKeyPoint] = useState("");
  const [moduleImage, setModuleImage] = useState<string | null>(null);
  const [uploadingModuleImage, setUploadingModuleImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      content: defaultValues?.content || "",
    },
    mode: "onChange",
  });

  const handleAddKeyPoint = () => {
    if (newKeyPoint.trim()) {
      const updatedKeyPoints = [...keyPoints, newKeyPoint.trim()];
      setKeyPoints(updatedKeyPoints);
      setNewKeyPoint("");

      // Update hidden input for key points
      const keyPointsInput = document.createElement('input');
      keyPointsInput.type = 'hidden';
      keyPointsInput.name = 'key_points';
      keyPointsInput.value = JSON.stringify(updatedKeyPoints);
      
      // Remove any existing key_points input before adding the new one
      const existingKeyPointsInput = document.querySelector(`form[data-module="${index}"] input[name="key_points"]`);
      if (existingKeyPointsInput) {
        existingKeyPointsInput.remove();
      }
      document.querySelector(`form[data-module="${index}"]`)?.appendChild(keyPointsInput);
    }
  };

  const handleRemoveKeyPoint = (indexToRemove: number) => {
    const updatedKeyPoints = keyPoints.filter((_, i) => i !== indexToRemove);
    setKeyPoints(updatedKeyPoints);

    // Update hidden input for key points
    const keyPointsInput = document.querySelector<HTMLInputElement>(`form[data-module="${index}"] input[name="key_points"]`);
    if (keyPointsInput) {
      keyPointsInput.value = JSON.stringify(updatedKeyPoints);
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      setUploadingVideo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('course_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course_attachments')
        .getPublicUrl(filePath);

      setVideoUrl(publicUrl);
      
      // Set hidden input value for form submission
      const videoInput = document.createElement('input');
      videoInput.type = 'hidden';
      videoInput.name = 'video_url';
      videoInput.value = publicUrl;
      document.querySelector(`form[data-module="${index}"]`)?.appendChild(videoInput);

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      setUploadingFiles(true);
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } =  supabase.storage
        .from('course_attachments')
        .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      const updatedFiles = [...contentFiles, ...uploadedPaths];
      setContentFiles(updatedFiles);

      // Update hidden input for content files
      const filesInput = document.createElement('input');
      filesInput.type = 'hidden';
      filesInput.name = 'content_files';
      filesInput.value = JSON.stringify(updatedFiles);
      
      // Remove any existing content_files input before adding the new one
      const existingInput = document.querySelector(`form[data-module="${index}"] input[name="content_files"]`);
      if (existingInput) {
        existingInput.remove();
      }
      document.querySelector(`form[data-module="${index}"]`)?.appendChild(filesInput);

      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleModuleImageUpload = async (file: File) => {
    try {
      setUploadingModuleImage(true);
      setImageError("");
      const fileExt = file.name.split('.').pop();
      const fileName = `module-image-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course_attachments')
        .getPublicUrl(filePath);

      setModuleImage(publicUrl);

      // Set hidden input value for form submission
      const imageInput = document.createElement('input');
      imageInput.type = 'hidden';
      imageInput.name = 'image_url';
      imageInput.value = publicUrl;
      
      // Remove any existing image_url input before adding the new one
      const existingInput = document.querySelector(`form[data-module="${index}"] input[name="image_url"]`);
      if (existingInput) {
        existingInput.remove();
      }
      document.querySelector(`form[data-module="${index}"]`)?.appendChild(imageInput);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingModuleImage(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)} data-module={index} className="space-y-4">
          <input type="hidden" name="content" value={form.getValues("content") || ""} />
          <input type="hidden" name="key_points" value={JSON.stringify(keyPoints)} />
          <input type="hidden" name="content_files" value={JSON.stringify(contentFiles)} />
          <input type="hidden" name="image_url" value={moduleImage || ""} />
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chapter {index + 1}</h3>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Chapter Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter chapter title" 
                        {...field} 
                        className={form.formState.errors.title ? "border-destructive" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Chapter Description <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter chapter description" 
                        {...field}
                        className={form.formState.errors.description ? "border-destructive" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel className="flex items-center">
                  Chapter Image {isImageRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FileUpload
                  onUpload={(files) => handleModuleImageUpload(files[0])}
                  acceptedFileTypes={{
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif']
                  }}
                  maxFiles={1}
                />
                {uploadingModuleImage && <p className="text-sm text-muted-foreground">Uploading image...</p>}
                {moduleImage ? (
                  <div className="mt-2">
                    <img src={moduleImage} alt="Chapter preview" className="w-full max-w-[200px] rounded-lg" />
                  </div>
                ) : isImageRequired && imageError ? (
                  <p className="text-sm text-destructive">{imageError}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <FormLabel>Key Learning Points</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a key learning point"
                    value={newKeyPoint}
                    onChange={(e) => setNewKeyPoint(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyPoint();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddKeyPoint}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 mt-2">
                  {keyPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary/30 p-2 rounded">
                      <span className="flex-1">{point}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveKeyPoint(idx)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
{/* 
              <div className="space-y-2">
                <FormLabel>Chapter Video</FormLabel>
                <VideoUpload
                  onUpload={handleVideoUpload}
                />
                {uploadingVideo && <p className="text-sm text-muted-foreground">Uploading video...</p>}
                {videoUrl && <p className="text-sm text-green-600">Video uploaded successfully</p>}
              </div> */}

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Chapter Content <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className={form.formState.errors.content ? "border border-destructive rounded-md" : ""}>
                        <RichTextEditor 
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <div className="space-y-2">
                <FormLabel>Documents & Resources</FormLabel>
                <FileUpload
                  onUpload={handleFileUpload}
                  acceptedFileTypes={{
                    'application/pdf': ['.pdf'],
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif']
                  }}
                  maxFiles={5}
                />
                {uploadingFiles && <p className="text-sm text-muted-foreground">Uploading files...</p>}
                {contentFiles.length > 0 && (
                  <p className="text-sm text-green-600">{contentFiles.length} file(s) uploaded successfully</p>
                )}
              </div> */}

              {!showQuiz && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuiz(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quiz
                </Button>
              )}
            </div>
          </Card>
        </form>
      </Form>

      {showQuiz && (
        <QuizForm 
          onSave={() => {}} 
          moduleIndex={index}
        />
      )}
    </div>
  );
};

export default ModuleForm;
