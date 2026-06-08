import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Music } from 'lucide-react';

interface Embed {
  id: string;
  platform: string;
  embed_url: string;
  embed_type: string;
  order_index: number;
  is_active: boolean;
}

interface NoteslinkEmbedsProps {
  profileId: string;
}

export function NoteslinkEmbeds({ profileId }: NoteslinkEmbedsProps) {
  const [embeds, setEmbeds] = useState<Embed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadEmbeds();
  }, [profileId]);

  const loadEmbeds = async () => {
    try {
      const { data, error } = await supabase
        .from('noteslink_embeds')
        .select('*')
        .eq('profile_id', profileId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setEmbeds(data || []);
    } catch (error) {
      console.error('Error loading embeds:', error);
      toast.error('Failed to load embeds');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmbed = async (formData: Partial<Embed>) => {
    try {
      const { error } = await supabase
        .from('noteslink_embeds')
        .insert([{
          profile_id: profileId,
          order_index: embeds.length,
          is_active: true,
          ...formData,
        }] as any);

      if (error) throw error;
      toast.success('Embed added');
      loadEmbeds();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving embed:', error);
      toast.error('Failed to save embed');
    }
  };

  const handleDeleteEmbed = async (embedId: string) => {
    if (!confirm('Delete this embed?')) return;

    try {
      const { error } = await supabase
        .from('noteslink_embeds')
        .delete()
        .eq('id', embedId);

      if (error) throw error;
      toast.success('Embed deleted');
      loadEmbeds();
    } catch (error) {
      console.error('Error deleting embed:', error);
      toast.error('Failed to delete embed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Media Embeds</h2>
          <p className="text-sm text-muted-foreground">Spotify, YouTube, and more</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Embed
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Media Embed</DialogTitle>
            </DialogHeader>
            <EmbedForm
              onSave={handleSaveEmbed}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {embeds.map((embed) => (
          <div key={embed.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold capitalize">{embed.platform}</div>
                <div className="text-sm text-muted-foreground">{embed.embed_type}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteEmbed(embed.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {embeds.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No embeds yet. Add Spotify or YouTube content!
        </div>
      )}
    </Card>
  );
}

function EmbedForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<Embed>) => void;
  onCancel: () => void;
}) {
  const [platform, setPlatform] = useState<string>('spotify');
  const [embedType, setEmbedType] = useState<string>('player');
  const [url, setUrl] = useState('');

  // Extract URL from iframe code or direct URL
  const extractEmbedUrl = (input: string): string => {
    // Check if it's an iframe code
    const iframeMatch = input.match(/src=["']([^"']+)["']/);
    if (iframeMatch) {
      return iframeMatch[1];
    }
    // Return as-is if it's already a URL
    return input;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extractedUrl = extractEmbedUrl(url);
    onSave({
      platform,
      embed_type: embedType,
      embed_url: extractedUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spotify">Spotify</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {platform === 'spotify' && (
        <div>
          <Label htmlFor="embedType">Type</Label>
          <Select value={embedType} onValueChange={setEmbedType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">Album/Playlist</SelectItem>
              <SelectItem value="track">Single Track</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="url">Embed Code or URL</Label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            platform === 'spotify'
              ? 'Paste entire <iframe> code or just the URL'
              : 'Paste entire <iframe> code or just the URL'
          }
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {platform === 'spotify'
            ? 'Paste the full iframe code from Spotify (Share → Embed) or just the URL'
            : 'Paste the full iframe code from YouTube or just the embed URL'}
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Embed</Button>
      </div>
    </form>
  );
}
