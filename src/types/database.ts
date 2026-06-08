/**
 * Centralized Database Types
 * Single source of truth for all Supabase database types
 */

import { Database } from "@/integrations/supabase/types";

// Core table types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];
export type Highlight = Database['public']['Tables']['highlights']['Row'];
export type HighlightMedia = Database['public']['Tables']['highlight_media']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];

// Noteslink types
export type NoteslinkProfile = Database['public']['Tables']['noteslink_profiles']['Row'];
export type NoteslinkLink = Database['public']['Tables']['noteslink_links']['Row'];
export type NoteslinkProduct = Database['public']['Tables']['noteslink_products']['Row'];
export type NoteslinkEmbed = Database['public']['Tables']['noteslink_embeds']['Row'];
export type NoteslinkTip = Database['public']['Tables']['noteslink_tips']['Row'];
export type NoteslinkAnalytics = Database['public']['Tables']['noteslink_analytics']['Row'];

// Legacy affiliate types (will be deprecated)
export type AffiliateProgram = Database['public']['Tables']['affiliate_programs']['Row'];

// Extended types with relationships
export interface ProfileWithStats extends Profile {
  follower_count?: number;
  following_count?: number;
  posts_count?: number;
}

export interface HighlightWithMedia extends Highlight {
  media: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    order_index: number;
  }>;
}

export interface PostWithAuthor extends Post {
  author: Profile | null;
  media: Array<{
    url: string;
    type: 'image' | 'video';
    order_index: number;
  }>;
}

export interface ConversationWithParticipants extends Conversation {
  participants: Profile[];
  unread_count?: number;
}

// Helper type for Json columns
export type Json = Database['public']['Tables']['posts']['Row']['media'];

// Helper function to safely parse Json to array
export function parseJsonArray<T = any>(json: Json): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json as T[];
  return [];
}

// Helper function to safely cast highlight media type
export function castHighlightMediaType(type: string): 'image' | 'video' {
  return (type === 'image' || type === 'video') ? type : 'image';
}
