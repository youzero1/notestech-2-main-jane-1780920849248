
import { Database } from "@/integrations/supabase/types";

export type Course = Database['public']['Tables']['courses']['Row'] & {
  topics?: Array<Module>;
  total_modules?: number;
  image_url?: string;
};

export type Module = Database['public']['Tables']['modules']['Row'] & {
  key_points: string[];
  content_files: string[];
  sections: any;
};

export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type UserProgress = Database['public']['Tables']['user_progress']['Row'];

export interface SubjectData {
  title: string;
  icon: any; // Lucide icon component
  description: string;
  courses: Course[];
}
