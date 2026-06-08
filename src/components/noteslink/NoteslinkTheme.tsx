import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Upload, X, Sparkles, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NoteslinkThemeProps {
  profileId: string;
  noteslinkProfile: any;
  onUpdate: () => void;
}

export function NoteslinkTheme({ profileId, noteslinkProfile, onUpdate }: NoteslinkThemeProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(
    noteslinkProfile?.custom_theme_id || null
  );
  const [gradientColor1, setGradientColor1] = useState('#667eea');
  const [gradientColor2, setGradientColor2] = useState('#764ba2');
  const [gradientDirection, setGradientDirection] = useState('135deg');
  
  const [formData, setFormData] = useState({
    theme_color: noteslinkProfile?.theme_color || '#D4AF37',
    background_type: noteslinkProfile?.background_type || 'solid',
    background_value: noteslinkProfile?.background_value || '#000000',
    custom_bio: noteslinkProfile?.custom_bio || '',
    show_notes_badge: noteslinkProfile?.show_notes_badge ?? true,
    meta_title: noteslinkProfile?.meta_title || '',
    meta_description: noteslinkProfile?.meta_description || '',
    enable_tips: noteslinkProfile?.enable_tips ?? false,
    enable_store: noteslinkProfile?.enable_store ?? false,
  });

  // Update gradient value when colors or direction change
  useEffect(() => {
    if (formData.background_type === 'gradient') {
      const gradientValue = `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})`;
      setFormData(prev => ({ ...prev, background_value: gradientValue }));
    }
  }, [gradientColor1, gradientColor2, gradientDirection, formData.background_type]);

  useEffect(() => {
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', profileId)
        .single();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, [profileId]);

  useEffect(() => {
    const fetchThemes = async () => {
      setLoadingThemes(true);
      const { data, error } = await supabase
        .from('noteslink_themes')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) {
        console.error('Error fetching themes:', error);
      } else {
        setThemes(data || []);
      }
      setLoadingThemes(false);
    };
    
    fetchThemes();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded successfully');
      onUpdate();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingBg(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `bg-${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, background_value: publicUrl });
      toast.success('Background image uploaded');
    } catch (error) {
      console.error('Error uploading background:', error);
      toast.error('Failed to upload background image');
    } finally {
      setUploadingBg(false);
    }
  };

  const applyTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const config = theme.config;
    setFormData({
      ...formData,
      theme_color: config.colors?.primary || formData.theme_color,
      background_type: config.gradients?.background ? 'gradient' : 'solid',
      background_value: config.gradients?.background || config.colors?.background || formData.background_value,
    });

    setSelectedThemeId(themeId);

    const { error } = await supabase
      .from('noteslink_profiles')
      .update({ 
        custom_theme_id: themeId,
        theme_color: config.colors?.primary || formData.theme_color,
        background_type: config.gradients?.background ? 'gradient' : 'solid',
        background_value: config.gradients?.background || config.colors?.background || formData.background_value,
      })
      .eq('profile_id', profileId);

    if (error) {
      toast.error('Error applying theme');
    } else {
      toast.success('Theme applied successfully!');
      onUpdate();
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('noteslink_profiles')
        .update(formData)
        .eq('profile_id', profileId);

      if (error) throw error;

      toast.success('Theme updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  const themesByCategory = themes.reduce((acc, theme) => {
    const category = theme.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(theme);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Settings Panel */}
      <div className="space-y-6">
        {/* Theme Gallery */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur shadow-[0_20px_60px_-20px_hsl(var(--vinyl-black)/0.6)]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[hsl(var(--noteslink-gold))]" />
            <h3 className="font-bebas tracking-wider text-xl text-[hsl(var(--noteslink-gold))]">Pre-Built Themes</h3>
          </div>
          
          {loadingThemes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="people" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="graffiti">Graffiti</TabsTrigger>
                <TabsTrigger value="minimalist">Minimal</TabsTrigger>
                <TabsTrigger value="creative">Creative</TabsTrigger>
              </TabsList>
              
              {Object.entries(themesByCategory).map(([category, categoryThemes]) => (
                <TabsContent key={category} value={category} className="space-y-3">
                  {(categoryThemes as any[]).map((theme) => (
                    <div
                      key={theme.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:border-[hsl(var(--noteslink-gold))] cursor-pointer transition-colors"
                      onClick={() => applyTheme(theme.id)}
                    >
                      <img
                        src={theme.preview_image_url || '/placeholder.svg'}
                        alt={theme.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{theme.name}</h4>
                          {theme.is_premium && (
                            <span className="text-xs bg-[hsl(var(--noteslink-gold))]/20 text-[hsl(var(--noteslink-gold))] px-2 py-0.5 rounded">Premium</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{theme.description}</p>
                      </div>
                      {selectedThemeId === theme.id && (
                        <Check className="w-5 h-5 text-[hsl(var(--noteslink-gold))]" />
                      )}
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </Card>

        {/* Custom Styling */}
        <Card className="p-6 space-y-6 bg-gradient-to-br from-card to-card/50 backdrop-blur shadow-[0_20px_60px_-20px_hsl(var(--vinyl-black)/0.6)]">
          <h2 className="text-2xl font-bebas tracking-wider bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] bg-clip-text text-transparent">
            CUSTOM STYLING
          </h2>

          <div className="space-y-4">
            <div>
              <Label>Profile Avatar</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-[hsl(var(--noteslink-gold))]">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-[hsl(var(--vinyl-black))] text-[hsl(var(--noteslink-gold))]">
                    {uploadingAvatar ? <Loader2 className="h-6 w-6 animate-spin" /> : 'You'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingAvatar}
                      className="cursor-pointer"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      {uploadingAvatar ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Upload Avatar</>
                      )}
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or GIF (max 5MB)</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="theme_color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="theme_color"
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.theme_color}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                  placeholder="#D4AF37"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="background_type">Background Type</Label>
              <Select
                value={formData.background_type}
                onValueChange={(value) => setFormData({ ...formData, background_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.background_type === 'solid' && (
              <div>
                <Label htmlFor="bg_color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bg_color"
                    type="color"
                    value={formData.background_value || '#000000'}
                    onChange={(e) => setFormData({ ...formData, background_value: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.background_value || '#000000'}
                    onChange={(e) => setFormData({ ...formData, background_value: e.target.value })}
                  />
                </div>
              </div>
            )}

            {formData.background_type === 'gradient' && (
              <div className="space-y-3">
                <Label>Gradient Colors</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="grad_color1" className="text-xs">Start Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="grad_color1"
                        type="color"
                        value={gradientColor1}
                        onChange={(e) => setGradientColor1(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={gradientColor1}
                        onChange={(e) => setGradientColor1(e.target.value)}
                        placeholder="#667eea"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="grad_color2" className="text-xs">End Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="grad_color2"
                        type="color"
                        value={gradientColor2}
                        onChange={(e) => setGradientColor2(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={gradientColor2}
                        onChange={(e) => setGradientColor2(e.target.value)}
                        placeholder="#764ba2"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="gradient_direction">Direction</Label>
                  <Select
                    value={gradientDirection}
                    onValueChange={setGradientDirection}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to right">→ Left to Right</SelectItem>
                      <SelectItem value="to left">← Right to Left</SelectItem>
                      <SelectItem value="to bottom">↓ Top to Bottom</SelectItem>
                      <SelectItem value="to top">↑ Bottom to Top</SelectItem>
                      <SelectItem value="135deg">↘ Diagonal (Top-Left to Bottom-Right)</SelectItem>
                      <SelectItem value="45deg">↗ Diagonal (Bottom-Left to Top-Right)</SelectItem>
                      <SelectItem value="225deg">↙ Diagonal (Top-Right to Bottom-Left)</SelectItem>
                      <SelectItem value="315deg">↖ Diagonal (Bottom-Right to Top-Left)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {formData.background_type === 'image' && (
              <div className="space-y-3">
                <Label>Background Image</Label>
                <div className="flex items-center gap-2">
                  <label htmlFor="bg-upload" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingBg}
                      className="w-full cursor-pointer"
                      onClick={() => document.getElementById('bg-upload')?.click()}
                    >
                      {uploadingBg ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Upload Image</>
                      )}
                    </Button>
                  </label>
                  <input
                    id="bg-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  {formData.background_value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData({ ...formData, background_value: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Or paste an image URL:
                </div>
                <Input
                  id="bg_image"
                  value={formData.background_value || ''}
                  onChange={(e) => setFormData({ ...formData, background_value: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        </Card>

        {/* Monetization */}
        <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-card/50 backdrop-blur shadow-[0_20px_60px_-20px_hsl(var(--vinyl-black)/0.6)]">
          <h3 className="font-bebas tracking-wider text-xl text-[hsl(var(--noteslink-gold))]">💰 Monetization</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Tips</Label>
              <p className="text-sm text-muted-foreground">Allow fans to tip you</p>
            </div>
            <Switch
              checked={formData.enable_tips}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enable_tips: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Store</Label>
              <p className="text-sm text-muted-foreground">Sell products directly</p>
            </div>
            <Switch
              checked={formData.enable_store}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enable_store: checked })
              }
            />
          </div>
        </Card>

        {/* Profile Info & SEO */}
        <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-card/50 backdrop-blur shadow-[0_20px_60px_-20px_hsl(var(--vinyl-black)/0.6)]">
          <h3 className="font-bebas tracking-wider text-xl text-[hsl(var(--noteslink-gold))]">Profile & SEO</h3>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.custom_bio}
              onChange={(e) => setFormData({ ...formData, custom_bio: e.target.value })}
              rows={3}
              placeholder="Tell people about yourself..."
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="badge">Show "Created with Notes" Badge</Label>
            <Switch
              id="badge"
              checked={formData.show_notes_badge}
              onCheckedChange={(checked) => setFormData({ ...formData, show_notes_badge: checked })}
            />
          </div>
          
          <div>
            <Label htmlFor="meta_title">Page Title</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              placeholder="Your Name - Noteslink"
            />
          </div>

          <div>
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              rows={2}
              placeholder="Check out my links..."
            />
          </div>
        </Card>

        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] hover:shadow-[0_0_20px_hsl(var(--noteslink-gold)/0.3)] transition-all"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span className="font-bebas tracking-wider text-lg">
            {saving ? 'Saving...' : '💾 Save Your Style'}
          </span>
        </Button>
      </div>

      {/* Preview Panel */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur shadow-[0_20px_60px_-20px_hsl(var(--vinyl-black)/0.6)] sticky top-6">
        <h3 className="font-bebas tracking-wider text-xl text-[hsl(var(--noteslink-gold))] mb-4">🎭 LIVE PREVIEW</h3>
        <div
          className="rounded-xl overflow-hidden border-2 border-[hsl(var(--noteslink-gold))]/20 aspect-[9/16] max-h-[600px] shadow-[0_0_20px_hsl(var(--noteslink-gold)/0.3)]"
          style={
            formData.background_type === 'gradient'
              ? { background: formData.background_value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
              : formData.background_type === 'image'
              ? { backgroundImage: `url(${formData.background_value})`, backgroundSize: 'cover' }
              : { backgroundColor: formData.background_value || '#000000' }
          }
        >
          <div className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-[hsl(var(--vinyl-black))] text-white text-2xl">You</AvatarFallback>
            </Avatar>
            <div className="font-bold text-white text-xl mb-2 drop-shadow-lg">Your Noteslink</div>
            {formData.custom_bio && (
              <p className="text-sm mt-3 text-white/90 max-w-xs mx-auto drop-shadow">{formData.custom_bio}</p>
            )}
            <div className="mt-6 space-y-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                Sample Link
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}