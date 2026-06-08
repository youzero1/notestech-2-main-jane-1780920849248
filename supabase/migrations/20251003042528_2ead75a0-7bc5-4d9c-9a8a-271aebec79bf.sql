-- Insert pre-built Noteslink themes
INSERT INTO noteslink_themes (name, description, category, config, preview_image_url, is_premium) VALUES
-- People Themes
('Rakim Gold', 'Legendary hip-hop inspired theme with gold accents', 'people', '{
  "colors": {
    "primary": "45 93% 47%",
    "background": "240 10% 3.9%",
    "accent": "45 93% 47%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(45 93% 47%), hsl(38 92% 50%))",
    "background": "linear-gradient(180deg, hsl(240 10% 3.9%), hsl(240 5% 6%))"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  }
}'::jsonb, '/lovable-uploads/rakim-performance.png', false),

('Hip-Hop Legends', 'Bold urban style with street art vibes', 'people', '{
  "colors": {
    "primary": "0 0% 100%",
    "background": "0 0% 0%",
    "accent": "271 91% 65%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(271 91% 65%), hsl(280 100% 70%))",
    "background": "linear-gradient(180deg, hsl(0 0% 0%), hsl(0 0% 10%))"
  }
}'::jsonb, '/lovable-uploads/thomas-performance.png', false),

-- Graffiti Styles
('Graffiti Blast', 'Explosive colors and urban energy', 'graffiti', '{
  "colors": {
    "primary": "271 91% 65%",
    "background": "240 10% 3.9%",
    "accent": "330 81% 60%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(271 91% 65%), hsl(330 81% 60%), hsl(45 93% 47%))",
    "background": "linear-gradient(180deg, hsl(240 10% 3.9%), hsl(280 20% 10%))"
  }
}'::jsonb, '/lovable-uploads/image1.png', true),

('Street Art', 'Raw concrete textures with vibrant tags', 'graffiti', '{
  "colors": {
    "primary": "173 80% 40%",
    "background": "20 14% 10%",
    "accent": "0 84% 60%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(173 80% 40%), hsl(158 64% 52%))",
    "background": "linear-gradient(180deg, hsl(20 14% 10%), hsl(20 10% 5%))"
  }
}'::jsonb, '/lovable-uploads/image2.png', true),

-- Minimalist Themes
('Clean Stage', 'Minimalist design with maximum impact', 'minimalist', '{
  "colors": {
    "primary": "0 0% 9%",
    "background": "0 0% 100%",
    "accent": "0 0% 45%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 20%))",
    "background": "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 98%))"
  }
}'::jsonb, '/lovable-uploads/signin.png', false),

('Monochrome Pro', 'Professional black and white aesthetic', 'minimalist', '{
  "colors": {
    "primary": "0 0% 100%",
    "background": "0 0% 9%",
    "accent": "0 0% 70%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(0 0% 100%), hsl(0 0% 90%))",
    "background": "linear-gradient(180deg, hsl(0 0% 9%), hsl(0 0% 5%))"
  }
}'::jsonb, '/lovable-uploads/signup.png', false),

-- Creative Expression
('Pharrell Vibes', 'Playful colors and creative freedom', 'creative', '{
  "colors": {
    "primary": "45 93% 47%",
    "background": "195 100% 50%",
    "accent": "330 81% 60%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(45 93% 47%), hsl(330 81% 60%), hsl(271 91% 65%))",
    "background": "linear-gradient(180deg, hsl(195 100% 50%), hsl(271 91% 65%))"
  }
}'::jsonb, '/lovable-uploads/image3.png', true),

('Neon Dreams', 'Vibrant neon colors and futuristic feel', 'creative', '{
  "colors": {
    "primary": "280 100% 70%",
    "background": "240 10% 3.9%",
    "accent": "173 80% 40%"
  },
  "gradients": {
    "primary": "linear-gradient(135deg, hsl(280 100% 70%), hsl(173 80% 40%))",
    "background": "linear-gradient(180deg, hsl(240 10% 3.9%), hsl(280 30% 10%))"
  }
}'::jsonb, '/lovable-uploads/image4.png', true);