
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface MediaFile {
  file: File;
  type: 'image' | 'video';
  preview: string;
}

interface PostFormProps {
  onSubmit: (content: string, mediaFiles: File[]) => Promise<void>;
}

export const PostForm = ({ onSubmit }: PostFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleMediaClick = () => {
    fileInputRef.current?.click();
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => {
        const fileType = file.type.startsWith('video/') ? 'video' as const : 'image' as const;
        return {
          file,
          type: fileType,
          preview: URL.createObjectURL(file)
        };
      });

      const invalidFiles = newFiles.filter(file => {
        const isValidType = file.file.type.startsWith('image/') || file.file.type.startsWith('video/');
        const isValidSize = file.file.size <= 5 * 1024 * 1024;
        return !isValidType || !isValidSize;
      });

      if (invalidFiles.length > 0) {
        toast({
          title: "Error",
          description: "Some files were not added. Files must be images or videos under 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (mediaFiles.length + newFiles.length > 10) {
        toast({
          title: "Error",
          description: "You can only upload up to 10 media files per post.",
          variant: "destructive",
        });
        return;
      }

      setMediaFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, mediaFiles.map(m => m.file));
      setContent("");
      setMediaFiles([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        
        {mediaFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {mediaFiles.map((media, index) => (
              <div key={index} className="relative aspect-square">
                {media.type === 'image' ? (
                  <img
                    src={media.preview}
                    alt={`Preview ${index + 1}`}
                    className="rounded-lg w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={media.preview}
                    className="rounded-lg w-full h-full object-cover"
                    controls
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => removeMedia(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleMediaSelect}
            multiple
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleMediaClick}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!content.trim() || isSubmitting || !user}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
};
