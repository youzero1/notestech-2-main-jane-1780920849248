
import type { Database } from "@/integrations/supabase/types";

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string | null;
  products?: {
    name: string | null;
    main_image: string | null;
  } | null;
};

export type ReviewFormData = {
  rating: number;
  review_text: string;
};
