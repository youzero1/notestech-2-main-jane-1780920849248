
export interface PressRelease {
  id: string;
  title: string;
  content: string;
  description: string | null;
  thumbnail_image: string | null;
  cover_image: string | null;
  status: 'draft' | 'published';
  slug: string;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  type: 'company' | 'media' | null;
}

export interface PressReleaseFormData {
  title: string;
  content: string;
  description?: string | null;
  thumbnail_image?: string | null;
  cover_image?: string | null;
  slug: string;
  status: 'draft' | 'published';
  publish_date?: string | null;
  type: 'company' | 'media';
}
