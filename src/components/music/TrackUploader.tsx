import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import MiniTrendChart from "@/components/ui/MiniTrendChart";

interface TrackUploaderProps {
  onUploadSuccess?: () => void;
}

export const TrackUploader: React.FC<TrackUploaderProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const getAudioDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(audio.src);
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      });
    });
  };

  // Simulate upload progress
  const simulateUploadProgress = () => {
    setUploadProgress([]);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        // Start with some random initial progress
        if (prev.length === 0) {
          return [10 + Math.random() * 10];
        }
        
        const lastValue = prev[prev.length - 1];
        // Add a new progress point that's higher than the previous one
        // but with some randomness to simulate network fluctuations
        const newValue = Math.min(
          lastValue + 5 + Math.random() * 10, 
          100
        );
        
        // If we've reached 100%, clear the interval
        if (newValue >= 100) {
          clearInterval(interval);
        }
        
        return [...prev, newValue];
      });
    }, 500);
    
    return () => clearInterval(interval);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files[0]) {
        toast({ 
          title: "Error", 
          description: "Please select a file to upload", 
          variant: "destructive" 
        });
        return;
      }

      if (!user) {
        toast({ 
          title: "Error", 
          description: "Please login to upload tracks", 
          variant: "destructive" 
        });
        return;
      }

      if (!title) {
        toast({ 
          title: "Error", 
          description: "Please enter a title for the track", 
          variant: "destructive" 
        });
        return;
      }

      setUploading(true);
      const file = event.target.files[0];

      // Start simulating upload progress
      const stopSimulation = simulateUploadProgress();

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size exceeds 50MB limit",
          variant: "destructive"
        });
        setUploading(false);
        stopSimulation();
        return;
      }

      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Invalid file type. Please upload MP3, WAV, or FLAC files only",
          variant: "destructive"
        });
        setUploading(false);
        stopSimulation();
        return;
      }
      
      // Get audio duration
      const duration = await getAudioDuration(file);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        stopSimulation();
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(filePath);

      // Create track record in database
      const { error: dbError } = await supabase.from('tracks').insert({
        title,
        genre,
        file_url: publicUrl,
        duration,
        user_id: user.id,
        plays: 0,
        revenue: 0
      });

      if (dbError) {
        stopSimulation();
        throw dbError;
      }

      // Reset form
      setTitle('');
      setGenre('');
      if (event.target) {
        event.target.value = '';
      }

      toast({
        title: "Success",
        description: "Track uploaded successfully",
      });

      // Notify parent component to refresh the track list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Error uploading track:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload track",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-light text-xl">Upload Track</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Track Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter track title"
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Select value={genre} onValueChange={setGenre} disabled={uploading}>
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="hiphop">Hip Hop</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="jazz">Jazz</SelectItem>
              <SelectItem value="classical">Classical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            {uploading ? 'Uploading your track...' : 'Drag and drop your track here, or click to browse'}
          </p>
          
          {uploading && uploadProgress.length > 0 && (
            <div className="mb-4 flex justify-center">
              <div className="w-40 h-12">
                <MiniTrendChart 
                  isPositive={true} 
                  color="#987D4D" 
                  data={uploadProgress} 
                  width={160} 
                  height={48}
                  strokeWidth={3}
                />
              </div>
            </div>
          )}
          
          <Button variant="secondary" size="sm" disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <label className="cursor-pointer w-full">
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </>
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Supported formats: MP3, WAV, FLAC (max 50MB)
        </div>
      </CardContent>
    </Card>
  );
};
