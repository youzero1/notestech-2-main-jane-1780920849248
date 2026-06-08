
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  acceptedFileTypes?: Record<string, string[]>;
  maxFiles?: number;
}

const FileUpload = ({ onUpload, acceptedFileTypes, maxFiles = 10 }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} files`);
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
      onUpload(newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-primary/5">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-primary" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PDF, PPTX, DOCX, or images (max. {maxFiles} files)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept={acceptedFileTypes ? Object.entries(acceptedFileTypes).flatMap(([type, exts]) => exts).join(',') : undefined}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid gap-4 mt-4">
          {files.map((file, index) => (
            <Card key={index} className="p-4 flex justify-between items-center">
              <span className="text-sm truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
