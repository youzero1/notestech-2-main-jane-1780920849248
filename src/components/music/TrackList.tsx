import React, { useEffect, useState, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays } from 'date-fns';

interface Track {
  id: string;
  title: string;
  duration: string;
  plays: number;
  revenue: number;
  genre: string;
  file_url: string;
  created_at: string;
}

interface TrackListProps {
  sortBy?: string;
  genre?: string;
  timePeriod?: string;
}

export const TrackList = ({ sortBy = 'date-new', genre = 'all', timePeriod = 'all' }: TrackListProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.removeEventListener('timeupdate', () => {});
      audioRef.current.removeEventListener('ended', () => {});
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    fetchTracks();
    return () => {
      cleanupAudio();
    };
  }, [sortBy, genre, timePeriod]);

  const getTimeFilter = () => {
    const now = new Date();
    switch (timePeriod) {
      case 'week':
        return subDays(now, 7).toISOString();
      case 'month':
        return subDays(now, 30).toISOString();
      case 'year':
        return subDays(now, 365).toISOString();
      default:
        return null;
    }
  };

  const convertDurationToSeconds = (duration: string): number => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const fetchTracks = async () => {
    try {
      setLoading(true);
      let query = supabase.from('tracks').select('*');

      if (genre !== 'all') {
        query = query.eq('genre', genre);
      }

      const timeFilter = getTimeFilter();
      if (timeFilter) {
        query = query.gte('created_at', timeFilter);
      }

      switch (sortBy) {
        case 'date-new':
          query = query.order('created_at', { ascending: false });
          break;
        case 'date-old':
          query = query.order('created_at', { ascending: true });
          break;
        case 'plays':
          query = query.order('plays', { ascending: false });
          break;
        case 'revenue':
          query = query.order('revenue', { ascending: false });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        case 'duration':
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      let sortedData = data || [];

      if (sortBy === 'duration') {
        sortedData = sortedData.sort((a, b) => {
          const durationA = convertDurationToSeconds(a.duration);
          const durationB = convertDurationToSeconds(b.duration);
          return durationB - durationA;
        });
      }

      setTracks(sortedData);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load tracks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (track: Track) => {
    try {
      if (currentlyPlaying === track.id && audioRef.current) {
        if (audioRef.current.paused) {
          await audioRef.current.play();
          setIsPlaying(true);
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      cleanupAudio();

      const audio = new Audio(track.file_url);
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setIsPlaying(false);
      });

      await audio.play();
      setCurrentlyPlaying(track.id);
      setIsPlaying(true);

      const { error } = await supabase
        .from('tracks')
        .update({ plays: track.plays + 1 })
        .eq('id', track.id);

      if (error) throw error;

      setTracks(tracks.map(t => 
        t.id === track.id ? { ...t, plays: t.plays + 1 } : t
      ));
    } catch (error) {
      console.error('Error playing track:', error);
      toast({
        title: "Error",
        description: "Failed to play track",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (currentlyPlaying === id) {
        cleanupAudio();
        setCurrentlyPlaying(null);
      }

      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTracks(tracks.filter(track => track.id !== id));
      toast({
        title: "Success",
        description: "Track deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (track: Track) => {
    setOpenDropdownId(null);
    setTimeout(() => {
      setEditingTrack({ ...track });
      setIsDialogOpen(true);
    }, 0);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingTrack) return;

    try {
      const { error } = await supabase
        .from('tracks')
        .update({
          title: editingTrack.title,
          genre: editingTrack.genre,
        })
        .eq('id', editingTrack.id);

      if (error) throw error;

      setTracks(prevTracks => 
        prevTracks.map(track =>
          track.id === editingTrack.id ? editingTrack : track
        )
      );
      
      handleDialogClose();
      setEditingTrack(null);
      fetchTracks();
      
      toast({
        title: "Success",
        description: "Track updated successfully",
      });
    } catch (error) {
      console.error('Error updating track:', error);
      toast({
        title: "Error",
        description: "Failed to update track",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-muted-foreground mb-2">No tracks found</div>
        <p className="text-sm text-muted-foreground">
          Upload some tracks in the Create Music tab to get started
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 h-12 px-2"></TableHead>
            <TableHead className="h-12 px-2">Title</TableHead>
            <TableHead className="h-12 px-2">Duration</TableHead>
            <TableHead className="h-12 px-2">Plays</TableHead>
            {/* <TableHead className="h-12 px-2">Revenue</TableHead> */}
            <TableHead className="h-12 px-2">Genre</TableHead>
            <TableHead className="h-12 px-2">Date Added</TableHead>
            <TableHead className="w-12 h-12 px-2"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id} className="group hover:bg-secondary/20">
              <TableCell className="py-2 px-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={`${currentlyPlaying === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  onClick={() => handlePlay(track)}
                >
                  {currentlyPlaying === track.id && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
              <TableCell className="font-medium py-2 px-2">{track.title}</TableCell>
              <TableCell className="py-2 px-2">{track.duration}</TableCell>
              <TableCell className="py-2 px-2">{track.plays.toLocaleString()}</TableCell>
              {/* <TableCell className="py-2 px-2">${track.revenue.toFixed(2)}</TableCell> */}
              <TableCell className="capitalize py-2 px-2">{track.genre}</TableCell>
              <TableCell className="py-2 px-2">{new Date(track.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="py-2 px-2">
                <DropdownMenu
                  open={openDropdownId === track.id}
                  onOpenChange={(open) => {
                    setOpenDropdownId(open ? track.id : null);
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(track)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(track.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTrack(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
          </DialogHeader>
          {editingTrack && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTrack.title}
                  onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-genre">Genre</Label>
                <Select
                  value={editingTrack.genre}
                  onValueChange={(value) => setEditingTrack({ ...editingTrack, genre: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="hiphop">Hip Hop</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
