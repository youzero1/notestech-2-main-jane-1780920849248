
export interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  followed_by?: string[];
}

export interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
  author: Profile;
  liked_by_user: boolean;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: Profile;
}
