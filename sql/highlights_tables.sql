
-- Create a table for highlights
CREATE TABLE IF NOT EXISTS public.highlights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a table for highlight media items
CREATE TABLE IF NOT EXISTS public.highlight_media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  highlight_id uuid REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  caption TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for highlights
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY highlights_select_policy ON public.highlights 
  FOR SELECT USING (true);

CREATE POLICY highlights_insert_policy ON public.highlights 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY highlights_update_policy ON public.highlights 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY highlights_delete_policy ON public.highlights 
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for highlight_media
ALTER TABLE public.highlight_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY highlight_media_select_policy ON public.highlight_media 
  FOR SELECT USING (true);

CREATE POLICY highlight_media_insert_policy ON public.highlight_media 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.highlights 
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );

CREATE POLICY highlight_media_update_policy ON public.highlight_media 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.highlights 
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );

CREATE POLICY highlight_media_delete_policy ON public.highlight_media 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.highlights 
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );

-- Create a storage bucket for highlights if it doesn't exist already
INSERT INTO storage.buckets (id, name, public)
VALUES ('highlights', 'highlights', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policy to allow authenticated users to upload files
CREATE POLICY highlights_insert_policy ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'highlights' AND auth.role() = 'authenticated'
  );

-- Add storage policy to allow public to view highlight files
CREATE POLICY highlights_select_policy ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'highlights'
  );
