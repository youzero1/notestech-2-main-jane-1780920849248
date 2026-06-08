
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  first_name: string;
  last_name: string;
}

export interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
  liked_by_user: boolean;
  author_id: string;
  media_count: number;
  author: Profile | null;
}
