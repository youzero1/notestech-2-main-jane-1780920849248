
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VideoUploadProps {
  onUpload: (file: File) => void;
}

const VideoUpload = ({ onUpload }: VideoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        onUpload(file);
      } else {
        alert('Please select a valid video file');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-primary/5">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-primary" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload video</span>
            </p>
            <p className="text-xs text-gray-500">MP4, WebM, or Ogg (max. 100MB)</p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="video/*"
          />
        </label>
      </div>

      {selectedFile && (
        <Card className="p-4 flex justify-between items-center">
          <span className="text-sm truncate">{selectedFile.name}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      )}
    </div>
  );
};

export default VideoUpload;
