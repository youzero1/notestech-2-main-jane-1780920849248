
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ModuleForm } from "./ModuleForm";
import { useAuth } from "@/hooks/useAuth";
import FileUpload  from "./FileUpload";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export function CourseForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modules, setModules] = useState([{ id: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseImage, setCourseImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      subject: "",
      description: "",
    },
  });

  const addModule = () => {
    setModules([...modules, { id: modules.length }]);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      setImageError("");
      const fileExt = file.name.split('.').pop();
      const fileName = `course-image-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course_attachments')
        .getPublicUrl(filePath);

      setCourseImage(publicUrl);

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
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: CourseFormValues) => {
    if (isSubmitting || !user) return;

    // Validate course image
    if (!courseImage) {
      setImageError("Course image is required");
      toast({
        title: "Error",
        description: "Course image is required",
        variant: "destructive",
      });
      return;
    }

    // Check if all modules have images
    const moduleImagesValid = modules.every((_, index) => {
      const moduleForm = document.querySelector(`form[data-module="${index}"]`);
      if (!moduleForm) return false;
      
      const moduleImageInput = moduleForm.querySelector<HTMLInputElement>('input[name="image_url"]');
      return moduleImageInput && moduleImageInput.value;
    });

    if (!moduleImagesValid) {
      toast({
        title: "Error",
        description: "All chapters must have an image",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: course, error: courseError } = await supabase.from("courses").insert({
        title: data.title,
        subject: data.subject,
        description: data.description,
        category: data.subject,
        status: "active",
        creator_id: user.id,
        image_url: courseImage,
      }).select().single();

      if (courseError) throw courseError;

      const modulePromises = modules.map(async (_, index) => {
        const moduleForm = document.querySelector(`form[data-module="${index}"]`);
        
        if (!moduleForm) return;

        const titleInput = moduleForm.querySelector<HTMLInputElement>('input[name="title"]');
        const descriptionInput = moduleForm.querySelector<HTMLInputElement>('input[name="description"]');
        const contentInput = moduleForm.querySelector<HTMLInputElement>('input[name="content"]');
        const videoUrlInput = moduleForm.querySelector<HTMLInputElement>('input[name="video_url"]');
        const contentFilesInput = moduleForm.querySelector<HTMLInputElement>('input[name="content_files"]');
        const keyPointsInput = moduleForm.querySelector<HTMLInputElement>('input[name="key_points"]');
        const imageUrlInput = moduleForm.querySelector<HTMLInputElement>('input[name="image_url"]');
        
        const title = titleInput?.value;
        const description = descriptionInput?.value;
        const content = contentInput?.value || "";
        const videoUrl = videoUrlInput?.value;
        const contentFiles = contentFilesInput?.value ? JSON.parse(contentFilesInput.value) : [];
        const keyPoints = keyPointsInput?.value ? JSON.parse(keyPointsInput.value) : [];
        const imageUrl = imageUrlInput?.value;

        if (!title || !description || !imageUrl) {
          throw new Error("Missing required module fields");
        }

        const moduleData = {
          title,
          description,
          content,
          content_type: 'text' as const,
          order_index: index,
          course_id: course.id,
          video_url: videoUrl || null,
          content_files: contentFiles,
          key_points: keyPoints,
          image_url: imageUrl || null,
        };

        const { data: module, error: moduleError } = await supabase
          .from('modules')
          .insert(moduleData)
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Get the quiz data for this module
        const moduleQuizForm = document.querySelector(`form[data-quiz="${index}"]`);
        if (moduleQuizForm) {
          // Get all question elements within the quiz form
          const questionContainers = moduleQuizForm.querySelectorAll('.quiz-question');
          
          if (questionContainers && questionContainers.length > 0) {
            const questions = Array.from(questionContainers).map((questionEl) => {
              const questionInput = questionEl.querySelector<HTMLInputElement>('input[name$=".question"]');
              const optionInputs = questionEl.querySelectorAll<HTMLInputElement>('input[name*=".options."]');
              const correctAnswerInput = questionEl.querySelector<HTMLInputElement>('input[name$=".correct_answer"]');
              
              if (questionInput && optionInputs.length === 4 && correctAnswerInput) {
                return {
                  question: questionInput.value,
                  options: Array.from(optionInputs).map(input => input.value),
                  correct_answer: correctAnswerInput.value,
                };
              }
              return null;
            }).filter(Boolean);

            if (questions.length > 0) {
              const { error: quizError } = await supabase
                .from('quizzes')
                .insert({
                  module_id: module.id,
                  title: `Quiz for ${moduleData.title}`,
                  description: `Quiz for chapter ${index + 1}`,
                  questions: questions,
                });

              if (quizError) throw quizError;
            }
          }
        }
      });

      await Promise.all(modulePromises);

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      navigate(`/courses/${course.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="p-6 space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter course title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel className="flex items-center">
              Course Image <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FileUpload
              onUpload={(files) => handleImageUpload(files[0])}
              acceptedFileTypes={{
                'image/*': ['.png', '.jpg', '.jpeg', '.gif']
              }}
              maxFiles={1}
            />
            {uploadingImage && <p className="text-sm text-muted-foreground">Uploading image...</p>}
            {courseImage ? (
              <div className="mt-2">
                <img src={courseImage} alt="Course preview" className="w-full max-w-[200px] rounded-lg" />
              </div>
            ) : imageError ? (
              <p className="text-sm text-destructive">{imageError}</p>
            ) : null}
          </div>

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Financial Literacy">Financial Literacy</SelectItem>
                    <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                    <SelectItem value="Music Business">Music Business</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter course description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {modules.map((module, index) => (
          <div key={module.id}>
            <ModuleForm
              index={index}
              onSave={() => {}}
              onDelete={modules.length > 1 ? () => removeModule(index) : undefined}
              isImageRequired={true}
            />
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addModule}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Course..." : "Create Course"}
        </Button>
      </form>
    </Form>
  );
}
