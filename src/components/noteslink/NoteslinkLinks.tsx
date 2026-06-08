import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  thumbnail_url: string | null;
  button_style: string;
  custom_color: string | null;
  order_index: number;
  is_active: boolean;
  click_count: number;
}

interface NoteslinkLinksProps {
  profileId: string;
}

function SortableLink({ link, onEdit, onDelete }: { link: Link; onEdit: () => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="group bg-gradient-to-r from-card to-card/50 border border-border/50 hover:border-[hsl(var(--noteslink-gold))]/50 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_8px_32px_-8px_hsl(var(--vinyl-black)/0.4)]"
    >
      <div className="flex items-center gap-4">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing hover:text-[hsl(var(--noteslink-gold))] transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="font-semibold group-hover:text-[hsl(var(--noteslink-gold))] transition-colors">{link.title}</div>
          {link.description && (
            <div className="text-sm text-muted-foreground">{link.description}</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">{link.url}</div>
          <div className="text-xs text-muted-foreground mt-1">Clicks: {link.click_count || 0}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NoteslinkLinks({ profileId }: NoteslinkLinksProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadLinks();
  }, [profileId]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('noteslink_links')
        .select('*')
        .eq('profile_id', profileId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((link) => link.id === active.id);
    const newIndex = links.findIndex((link) => link.id === over.id);

    const reorderedLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(reorderedLinks);

    // Update order_index in database
    try {
      const updates = reorderedLinks.map((link, index) => ({
        id: link.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('noteslink_links')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
      loadLinks(); // Reload on error
    }
  };

  const handleSaveLink = async (formData: Partial<Link>) => {
    try {
      if (editingLink) {
        // Update existing
        const { error } = await supabase
          .from('noteslink_links')
          .update(formData as any)
          .eq('id', editingLink.id);

        if (error) throw error;
        toast.success('Link updated');
      } else {
        // Create new
        const { error } = await supabase
          .from('noteslink_links')
          .insert([{
            profile_id: profileId,
            order_index: links.length,
            ...formData,
          }] as any);

        if (error) throw error;
        toast.success('Link created');
      }

      loadLinks();
      setIsDialogOpen(false);
      setEditingLink(null);
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Failed to save link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Delete this link?')) return;

    try {
      const { error } = await supabase
        .from('noteslink_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      toast.success('Link deleted');
      loadLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur shadow-[0_20px_60px_-20px_hsl(var(--vinyl-black)/0.6)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bebas tracking-wider bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] bg-clip-text text-transparent">
            YOUR TRACKLIST
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <GripVertical className="h-3 w-3" />
            Spin the order like a DJ
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingLink(null)}
              className="bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] hover:shadow-[0_0_20px_hsl(var(--noteslink-gold)/0.3)] transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="font-bebas tracking-wide">Drop a Link</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            </DialogHeader>
            <LinkForm
              link={editingLink}
              onSave={handleSaveLink}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingLink(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {links.map((link) => (
              <SortableLink
                key={link.id}
                link={link}
                onEdit={() => {
                  setEditingLink(link);
                  setIsDialogOpen(true);
                }}
                onDelete={() => handleDeleteLink(link.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {links.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block p-6 rounded-full bg-gradient-to-br from-[hsl(var(--vinyl-black))] to-card mb-4">
            <Plus className="h-12 w-12 text-[hsl(var(--noteslink-gold))]" />
          </div>
          <p className="text-muted-foreground font-inter">
            Your stage is empty. Drop your first link to start the show!
          </p>
        </div>
      )}
    </Card>
  );
}

function LinkForm({
  link,
  onSave,
  onCancel,
}: {
  link: Link | null;
  onSave: (data: Partial<Link>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(link?.title || '');
  const [url, setUrl] = useState(link?.url || '');
  const [description, setDescription] = useState(link?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      url,
      description: description || null,
      button_style: 'rounded',
      is_active: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Link"
          required
        />
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          rows={2}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Link</Button>
      </div>
    </form>
  );
}
