export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      affiliate_programs: {
        Row: {
          annual_fee: string
          benefits: string
          card_details: string | null
          cash_advance_apr: string | null
          category: Database["public"]["Enums"]["affiliate_program_type"] | null
          click_rate: string | null
          commission: number
          created_at: string
          estimated_apr: number | null
          id: string
          interest_and_fees: number | null
          intro_balance_transfer_apr: string | null
          intro_purchase_apr: string | null
          loan_details: string | null
          loan_origination: string | null
          loan_tags: string[] | null
          loan_type: string | null
          logo: string | null
          name: string
          per_month: number | null
          product_image: string | null
          program_link: string | null
          regular_balance_transfer_apr: string | null
          regular_purchase_apr: string | null
          tag_type: string[] | null
          total_amount: number | null
          total_months: number | null
          updated_at: string
        }
        Insert: {
          annual_fee: string
          benefits: string
          card_details?: string | null
          cash_advance_apr?: string | null
          category?:
            | Database["public"]["Enums"]["affiliate_program_type"]
            | null
          click_rate?: string | null
          commission: number
          created_at?: string
          estimated_apr?: number | null
          id?: string
          interest_and_fees?: number | null
          intro_balance_transfer_apr?: string | null
          intro_purchase_apr?: string | null
          loan_details?: string | null
          loan_origination?: string | null
          loan_tags?: string[] | null
          loan_type?: string | null
          logo?: string | null
          name: string
          per_month?: number | null
          product_image?: string | null
          program_link?: string | null
          regular_balance_transfer_apr?: string | null
          regular_purchase_apr?: string | null
          tag_type?: string[] | null
          total_amount?: number | null
          total_months?: number | null
          updated_at?: string
        }
        Update: {
          annual_fee?: string
          benefits?: string
          card_details?: string | null
          cash_advance_apr?: string | null
          category?:
            | Database["public"]["Enums"]["affiliate_program_type"]
            | null
          click_rate?: string | null
          commission?: number
          created_at?: string
          estimated_apr?: number | null
          id?: string
          interest_and_fees?: number | null
          intro_balance_transfer_apr?: string | null
          intro_purchase_apr?: string | null
          loan_details?: string | null
          loan_origination?: string | null
          loan_tags?: string[] | null
          loan_type?: string | null
          logo?: string | null
          name?: string
          per_month?: number | null
          product_image?: string | null
          program_link?: string | null
          regular_balance_transfer_apr?: string | null
          regular_purchase_apr?: string | null
          tag_type?: string[] | null
          total_amount?: number | null
          total_months?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliated_mlm: {
        Row: {
          applied: boolean | null
          category: Database["public"]["Enums"]["affiliate_program_type"] | null
          clicked: boolean | null
          commission: number | null
          created_at: string
          id: string
          program_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied?: boolean | null
          category?:
            | Database["public"]["Enums"]["affiliate_program_type"]
            | null
          clicked?: boolean | null
          commission?: number | null
          created_at?: string
          id?: string
          program_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied?: boolean | null
          category?:
            | Database["public"]["Enums"]["affiliate_program_type"]
            | null
          clicked?: boolean | null
          commission?: number | null
          created_at?: string
          id?: string
          program_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliated_mlm_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliated_mlm_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_attachments: {
        Row: {
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id: string
          public_url: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          public_url?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          public_url?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          search_enabled: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_enabled?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          search_enabled?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collaboration_projects: {
        Row: {
          cover_image: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          genre: string | null
          id: string
          status: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          genre?: string | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          genre?: string | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          project_id: string | null
          role: string
          sender_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string | null
          role?: string
          sender_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string | null
          role?: string
          sender_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collaboration_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          profile_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          profile_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          attachments: Json | null
          category: string
          content: Json | null
          created_at: string
          creator_id: string | null
          description: string
          icon: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          status: string | null
          subject: string
          title: string
          total_modules: number | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          category: string
          content?: Json | null
          created_at?: string
          creator_id?: string | null
          description: string
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          status?: string | null
          subject: string
          title: string
          total_modules?: number | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          category?: string
          content?: Json | null
          created_at?: string
          creator_id?: string | null
          description?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          status?: string | null
          subject?: string
          title?: string
          total_modules?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          prompt: string
          type: Database["public"]["Enums"]["generation_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt: string
          type: Database["public"]["Enums"]["generation_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt?: string
          type?: Database["public"]["Enums"]["generation_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      highlight_media: {
        Row: {
          caption: string | null
          created_at: string
          highlight_id: string
          id: string
          order_index: number
          type: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          highlight_id: string
          id?: string
          order_index: number
          type: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          highlight_id?: string
          id?: string
          order_index?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_media_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          cover_image: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          content: string | null
          content_files: Json | null
          content_type: Database["public"]["Enums"]["content_type"]
          course_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          key_points: Json | null
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          content_files?: Json | null
          content_type: Database["public"]["Enums"]["content_type"]
          course_id?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          key_points?: Json | null
          order_index: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          content_files?: Json | null
          content_type?: Database["public"]["Enums"]["content_type"]
          course_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          key_points?: Json | null
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          newsletter_id: string
          sent_at: string | null
          status: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          newsletter_id: string
          sent_at?: string | null
          status?: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          newsletter_id?: string
          sent_at?: string | null
          status?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_logs_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
          verification_token: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          verification_token?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          verification_token?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      noteslink_analytics: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          event_type: string
          id: string
          link_id: string | null
          metadata: Json | null
          profile_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          link_id?: string | null
          metadata?: Json | null
          profile_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          link_id?: string | null
          metadata?: Json | null
          profile_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noteslink_analytics_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "noteslink_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noteslink_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noteslink_email_captures: {
        Row: {
          created_at: string | null
          email: string
          id: string
          metadata: Json | null
          name: string | null
          profile_id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          profile_id: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          profile_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noteslink_email_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noteslink_embeds: {
        Row: {
          created_at: string | null
          embed_type: string | null
          embed_url: string
          id: string
          is_active: boolean | null
          order_index: number
          platform: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          embed_type?: string | null
          embed_url: string
          id?: string
          is_active?: boolean | null
          order_index: number
          platform: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          embed_type?: string | null
          embed_url?: string
          id?: string
          is_active?: boolean | null
          order_index?: number
          platform?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "noteslink_embeds_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noteslink_links: {
        Row: {
          ai_priority_score: number | null
          button_style: string | null
          click_count: number | null
          created_at: string | null
          custom_color: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          last_clicked_at: string | null
          order_index: number
          profile_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          ai_priority_score?: number | null
          button_style?: string | null
          click_count?: number | null
          created_at?: string | null
          custom_color?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          last_clicked_at?: string | null
          order_index: number
          profile_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          ai_priority_score?: number | null
          button_style?: string | null
          click_count?: number | null
          created_at?: string | null
          custom_color?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          last_clicked_at?: string | null
          order_index?: number
          profile_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "noteslink_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noteslink_products: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          download_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_index: number | null
          price: number
          profile_id: string
          sales_count: number | null
          stock_count: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_index?: number | null
          price: number
          profile_id: string
          sales_count?: number | null
          stock_count?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          price?: number
          profile_id?: string
          sales_count?: number | null
          stock_count?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noteslink_products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noteslink_profiles: {
        Row: {
          background_type: string | null
          background_value: string | null
          created_at: string | null
          custom_bio: string | null
          custom_domain: string | null
          custom_theme_id: string | null
          enable_store: boolean | null
          enable_tips: boolean | null
          id: string
          is_public: boolean | null
          meta_description: string | null
          meta_title: string | null
          payout_enabled: boolean | null
          profile_id: string
          show_notes_badge: boolean | null
          slug: string
          stripe_account_id: string | null
          theme_color: string | null
          tier: string | null
          updated_at: string | null
          verified_badge: boolean | null
        }
        Insert: {
          background_type?: string | null
          background_value?: string | null
          created_at?: string | null
          custom_bio?: string | null
          custom_domain?: string | null
          custom_theme_id?: string | null
          enable_store?: boolean | null
          enable_tips?: boolean | null
          id?: string
          is_public?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          payout_enabled?: boolean | null
          profile_id: string
          show_notes_badge?: boolean | null
          slug: string
          stripe_account_id?: string | null
          theme_color?: string | null
          tier?: string | null
          updated_at?: string | null
          verified_badge?: boolean | null
        }
        Update: {
          background_type?: string | null
          background_value?: string | null
          created_at?: string | null
          custom_bio?: string | null
          custom_domain?: string | null
          custom_theme_id?: string | null
          enable_store?: boolean | null
          enable_tips?: boolean | null
          id?: string
          is_public?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          payout_enabled?: boolean | null
          profile_id?: string
          show_notes_badge?: boolean | null
          slug?: string
          stripe_account_id?: string | null
          theme_color?: string | null
          tier?: string | null
          updated_at?: string | null
          verified_badge?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_custom_theme"
            columns: ["custom_theme_id"]
            isOneToOne: false
            referencedRelation: "noteslink_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noteslink_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noteslink_themes: {
        Row: {
          category: string | null
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_premium: boolean | null
          name: string
          preview_image_url: string | null
        }
        Insert: {
          category?: string | null
          config: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
          preview_image_url?: string | null
        }
        Update: {
          category?: string | null
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          preview_image_url?: string | null
        }
        Relationships: []
      }
      noteslink_tips: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          message: string | null
          profile_id: string
          status: string | null
          stripe_payment_intent_id: string
          tipper_email: string
          tipper_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          message?: string | null
          profile_id: string
          status?: string | null
          stripe_payment_intent_id: string
          tipper_email: string
          tipper_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          message?: string | null
          profile_id?: string
          status?: string | null
          stripe_payment_intent_id?: string
          tipper_email?: string
          tipper_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noteslink_tips_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          entity_id: string
          id: string
          is_read: boolean | null
          readers: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          entity_id: string
          id?: string
          is_read?: boolean | null
          readers?: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          entity_id?: string
          id?: string
          is_read?: boolean | null
          readers?: Json | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          items: Json
          payment_date: string | null
          payment_error: string | null
          product_id: string | null
          profile_id: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          items: Json
          payment_date?: string | null
          payment_error?: string | null
          product_id?: string | null
          profile_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          items?: Json
          payment_date?: string | null
          payment_error?: string | null
          product_id?: string | null
          profile_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          minimum_threshold: number | null
          partner_id: string | null
          payout_amount: number
          terms: string | null
          trigger_type: Database["public"]["Enums"]["trigger_type"]
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_threshold?: number | null
          partner_id?: string | null
          payout_amount: number
          terms?: string | null
          trigger_type: Database["public"]["Enums"]["trigger_type"]
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_threshold?: number | null
          partner_id?: string | null
          payout_amount?: number
          terms?: string | null
          trigger_type?: Database["public"]["Enums"]["trigger_type"]
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          post_id: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          post_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          post_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comments: number | null
          content: string
          created_at: string
          id: string
          image: string | null
          likes: number | null
          media: Json | null
          media_count: number | null
          shares: number | null
          updated_at: string
        }
        Insert: {
          author_id: string
          comments?: number | null
          content: string
          created_at?: string
          id?: string
          image?: string | null
          likes?: number | null
          media?: Json | null
          media_count?: number | null
          shares?: number | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          comments?: number | null
          content?: string
          created_at?: string
          id?: string
          image?: string | null
          likes?: number | null
          media?: Json | null
          media_count?: number | null
          shares?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      press_releases: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          publish_date: string | null
          slug: string
          status: string
          thumbnail_image: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          publish_date?: string | null
          slug: string
          status?: string
          thumbnail_image?: string | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          publish_date?: string | null
          slug?: string
          status?: string
          thumbnail_image?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          rating: number | null
          review_text: string
          status: Database["public"]["Enums"]["review_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number | null
          review_text: string
          status?: Database["public"]["Enums"]["review_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number | null
          review_text?: string
          status?: Database["public"]["Enums"]["review_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_link: string | null
          affiliate_partner_id: string | null
          colors: Json | null
          created_at: string
          description: string | null
          gallery_images: Json | null
          id: string
          main_image: string | null
          name: string
          original_price: number | null
          price: number
          sizes: Json | null
          status: Database["public"]["Enums"]["product_status"]
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
        }
        Insert: {
          affiliate_link?: string | null
          affiliate_partner_id?: string | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          gallery_images?: Json | null
          id?: string
          main_image?: string | null
          name: string
          original_price?: number | null
          price: number
          sizes?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Update: {
          affiliate_link?: string | null
          affiliate_partner_id?: string | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          gallery_images?: Json | null
          id?: string
          main_image?: string | null
          name?: string
          original_price?: number | null
          price?: number
          sizes?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          first_name: string
          id: string
          instagram: string | null
          last_name: string
          phone: string | null
          state: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name: string
          id: string
          instagram?: string | null
          last_name: string
          phone?: string | null
          state?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string
          id?: string
          instagram?: string | null
          last_name?: string
          phone?: string | null
          state?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      program_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          program_id: string
          rating: number
          status: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          program_id: string
          rating: number
          status: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          program_id?: string
          rating?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_reviews_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_collaborators: {
        Row: {
          id: string
          joined_at: string | null
          project_id: string | null
          role: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          project_id?: string | null
          role: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          project_id?: string | null
          role?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collaboration_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          project_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          project_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          project_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collaboration_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tracks: {
        Row: {
          created_at: string | null
          duration: string | null
          file_url: string
          id: string
          metadata: Json | null
          project_id: string | null
          title: string
          uploader_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          title: string
          uploader_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          title?: string
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collaboration_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tracks_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json
          question: string
          quiz_id: string | null
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options?: Json
          question: string
          quiz_id?: string | null
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json
          question?: string
          quiz_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string
          id: string
          module_id: string | null
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          module_id?: string | null
          questions: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          module_id?: string | null
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      rakim_chat_attachments: {
        Row: {
          created_at: string | null
          file_path: string | null
          file_type: string
          filename: string
          id: string
          public_url: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          file_type: string
          filename: string
          id?: string
          public_url?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          file_type?: string
          filename?: string
          id?: string
          public_url?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rakim_chat_attachments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rakim_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rakim_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rakim_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rakim_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rakim_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          search_enabled: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          search_enabled?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          search_enabled?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          created_at: string
          duration: string
          file_url: string
          genre: string | null
          id: string
          plays: number | null
          revenue: number | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: string
          file_url: string
          genre?: string | null
          id?: string
          plays?: number | null
          revenue?: number | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: string
          file_url?: string
          genre?: string | null
          id?: string
          plays?: number | null
          revenue?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          membership_type: string
          payment_date: string | null
          profile_id: string
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          membership_type: string
          payment_date?: string | null
          profile_id: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          membership_type?: string
          payment_date?: string | null
          profile_id?: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invoices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          type: Database["public"]["Enums"]["membership_type"]
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          type?: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          type?: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string
          course_id: string | null
          created_at: string
          id: string
          module_id: string | null
          quiz_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          quiz_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          quiz_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          last_watched: string | null
          timestamp: number
          total_watched: number
          updated_at: string | null
          user_id: string | null
          video_url: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          last_watched?: string | null
          timestamp?: number
          total_watched?: number
          updated_at?: string | null
          user_id?: string | null
          video_url: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          last_watched?: string | null
          timestamp?: number
          total_watched?: number
          updated_at?: string | null
          user_id?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_shortened_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_product_reviews: {
        Args: { p_product_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          id: string
          product_id: string
          rating: number
          review_text: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_user_conversations: {
        Args: { user_id: string }
        Returns: {
          created_at: string
          id: string
          last_message: string
          unread_count: number
          updated_at: string
        }[]
      }
      has_premium_membership: {
        Args: { profile_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { role: Database["public"]["Enums"]["app_role"]; user_id: string }
        Returns: boolean
      }
      track_affiliate_click: {
        Args: { link_id: string }
        Returns: undefined
      }
    }
    Enums: {
      affiliate_program_type: "loan" | "card" | "shop"
      app_role: "admin" | "user"
      content_type: "pdf" | "sheet" | "audio" | "video" | "text"
      generation_type: "lyrics" | "beats" | "production"
      membership_type:
        | "free"
        | "premium"
        | "annual"
        | "basic"
        | "advanced"
        | "enterprise"
      notification_type: "post" | "course" | "affiliate" | "follow" | "merch"
      post_attachment_type: "image" | "video"
      product_status: "draft" | "active" | "archived"
      product_type: "direct" | "affiliate"
      project_status: "open" | "in_progress" | "completed"
      review_status: "pending" | "approved" | "rejected"
      trigger_type: "click" | "sale" | "lead" | "subscription"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      affiliate_program_type: ["loan", "card", "shop"],
      app_role: ["admin", "user"],
      content_type: ["pdf", "sheet", "audio", "video", "text"],
      generation_type: ["lyrics", "beats", "production"],
      membership_type: [
        "free",
        "premium",
        "annual",
        "basic",
        "advanced",
        "enterprise",
      ],
      notification_type: ["post", "course", "affiliate", "follow", "merch"],
      post_attachment_type: ["image", "video"],
      product_status: ["draft", "active", "archived"],
      product_type: ["direct", "affiliate"],
      project_status: ["open", "in_progress", "completed"],
      review_status: ["pending", "approved", "rejected"],
      trigger_type: ["click", "sale", "lead", "subscription"],
    },
  },
} as const
