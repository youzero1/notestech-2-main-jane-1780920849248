
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
    avatar_url: string | null;
    first_name: string;
    last_name: string;
  } | null;
}

export interface PostMedia {
  url: string;
  type: 'image' | 'video';
  order_index: number;
}

export interface Post {
  id: string;
  content: string;
  image?: string;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
  liked_by_user: boolean;
  author_id: string;
  author: {
    username: string;
    avatar_url: string | null;
    first_name: string;
    last_name: string;
  } | null;
  showComments?: boolean;
  commentsList?: Comment[];
  media: PostMedia[];
  media_count: number;
}
