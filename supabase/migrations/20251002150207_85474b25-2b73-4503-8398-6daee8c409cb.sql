-- ============================================
-- NOTESLINK: Digital Stage & Link-in-Bio System
-- Phase 1: Core Tables for MVP
-- ============================================

-- Core Noteslink profile (extends existing profiles table)
CREATE TABLE IF NOT EXISTS noteslink_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  
  -- Customization (Basic tier)
  theme_color TEXT DEFAULT '#D4AF37',
  background_type TEXT DEFAULT 'solid' CHECK (background_type IN ('solid', 'gradient', 'image', 'video')),
  background_value TEXT,
  custom_bio TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Settings
  is_public BOOLEAN DEFAULT TRUE,
  show_notes_badge BOOLEAN DEFAULT TRUE,
  
  -- Pro tier features (locked for Basic)
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'pro')),
  verified_badge BOOLEAN DEFAULT FALSE,
  custom_domain TEXT UNIQUE,
  custom_theme_id UUID,
  enable_tips BOOLEAN DEFAULT FALSE,
  enable_store BOOLEAN DEFAULT FALSE,
  
  -- Stripe (Pro only)
  stripe_account_id TEXT,
  payout_enabled BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's links
CREATE TABLE IF NOT EXISTS noteslink_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  thumbnail_url TEXT,
  
  -- Styling
  button_style TEXT DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'sharp', 'pill', 'soft')),
  custom_color TEXT,
  
  -- Management
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  
  -- AI optimization
  ai_priority_score REAL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media embeds
CREATE TABLE IF NOT EXISTS noteslink_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'soundcloud', 'youtube', 'tiktok', 'instagram')),
  embed_url TEXT NOT NULL,
  embed_type TEXT DEFAULT 'player' CHECK (embed_type IN ('player', 'grid', 'carousel')),
  
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email captures
CREATE TABLE IF NOT EXISTS noteslink_email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  email TEXT NOT NULL,
  name TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, email)
);

-- Analytics events
CREATE TABLE IF NOT EXISTS noteslink_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'link_click', 'email_capture', 'share', 'tip', 'purchase')),
  link_id UUID REFERENCES noteslink_links(id) ON DELETE SET NULL,
  
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  country_code TEXT,
  city TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pro tier: Pre-built themes
CREATE TABLE IF NOT EXISTS noteslink_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  config JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT TRUE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pro tier: Tips/donations
CREATE TABLE IF NOT EXISTS noteslink_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  tipper_email TEXT NOT NULL,
  tipper_name TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  message TEXT,
  
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pro tier: Micro-storefront products
CREATE TABLE IF NOT EXISTS noteslink_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('digital', 'physical', 'ticket', 'exclusive')),
  
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  
  image_url TEXT,
  download_url TEXT,
  stock_count INTEGER,
  
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER,
  
  sales_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for custom themes
ALTER TABLE noteslink_profiles 
ADD CONSTRAINT fk_custom_theme 
FOREIGN KEY (custom_theme_id) 
REFERENCES noteslink_themes(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_noteslink_profiles_slug ON noteslink_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_noteslink_profiles_profile_id ON noteslink_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_noteslink_links_profile ON noteslink_links(profile_id, order_index);
CREATE INDEX IF NOT EXISTS idx_noteslink_links_active ON noteslink_links(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_noteslink_analytics_profile_created ON noteslink_analytics(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_noteslink_analytics_event_type ON noteslink_analytics(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_noteslink_embeds_profile ON noteslink_embeds(profile_id, order_index);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE noteslink_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE noteslink_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE noteslink_embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE noteslink_email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE noteslink_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE noteslink_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE noteslink_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE noteslink_products ENABLE ROW LEVEL SECURITY;

-- Noteslink Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON noteslink_profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own noteslink profile" ON noteslink_profiles
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own noteslink profile" ON noteslink_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own noteslink profile" ON noteslink_profiles
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own noteslink profile" ON noteslink_profiles
  FOR DELETE USING (profile_id = auth.uid());

-- Noteslink Links Policies
CREATE POLICY "Public links are viewable by everyone" ON noteslink_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM noteslink_profiles np
      WHERE np.profile_id = noteslink_links.profile_id
      AND np.is_public = true
      AND noteslink_links.is_active = true
    )
  );

CREATE POLICY "Users can view their own links" ON noteslink_links
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their own links" ON noteslink_links
  FOR ALL USING (profile_id = auth.uid());

-- Noteslink Embeds Policies
CREATE POLICY "Public embeds are viewable by everyone" ON noteslink_embeds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM noteslink_profiles np
      WHERE np.profile_id = noteslink_embeds.profile_id
      AND np.is_public = true
      AND noteslink_embeds.is_active = true
    )
  );

CREATE POLICY "Users can manage their own embeds" ON noteslink_embeds
  FOR ALL USING (profile_id = auth.uid());

-- Email Captures Policies
CREATE POLICY "Anyone can submit email captures" ON noteslink_email_captures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own email captures" ON noteslink_email_captures
  FOR SELECT USING (profile_id = auth.uid());

-- Analytics Policies
CREATE POLICY "Anyone can track analytics events" ON noteslink_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own analytics" ON noteslink_analytics
  FOR SELECT USING (profile_id = auth.uid());

-- Themes Policies
CREATE POLICY "Everyone can view themes" ON noteslink_themes
  FOR SELECT USING (true);

-- Tips Policies
CREATE POLICY "Anyone can create tips" ON noteslink_tips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view tips they received" ON noteslink_tips
  FOR SELECT USING (profile_id = auth.uid());

-- Products Policies
CREATE POLICY "Public products are viewable" ON noteslink_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM noteslink_profiles np
      WHERE np.profile_id = noteslink_products.profile_id
      AND np.is_public = true
      AND noteslink_products.is_active = true
    )
  );

CREATE POLICY "Users can manage their own products" ON noteslink_products
  FOR ALL USING (profile_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_noteslink_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_noteslink_profiles_updated_at
  BEFORE UPDATE ON noteslink_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_noteslink_updated_at();

CREATE TRIGGER update_noteslink_links_updated_at
  BEFORE UPDATE ON noteslink_links
  FOR EACH ROW
  EXECUTE FUNCTION update_noteslink_updated_at();

CREATE TRIGGER update_noteslink_products_updated_at
  BEFORE UPDATE ON noteslink_products
  FOR EACH ROW
  EXECUTE FUNCTION update_noteslink_updated_at();