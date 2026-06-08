
import { supabase } from "@/integrations/supabase/client";

export const initializeStorage = async () => {
  try {
    const { data: bucket, error } = await supabase.storage.getBucket('project-audio');
    
    if (error && error.message.includes('does not exist')) {
      await supabase.storage.createBucket('project-audio', {
        public: true,
        allowedMimeTypes: ['audio/*'],
        fileSizeLimit: 104857600 // 100MB
      });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};
