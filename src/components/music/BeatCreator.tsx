
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Square, Music, Download, Plus, Volume2, Waves } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Track {
  id: number;
  name: string;
  pattern: boolean[];
  sound: string;
  volume: number;
}

export const BeatCreator = () => {
  const { user } = useAuth();
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState([120]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<number>(0);
  const [tracks, setTracks] = useState<Track[]>([
    { id: 0, name: "Kick", pattern: Array(15).fill(false), sound: "kick", volume: 100 },
    { id: 1, name: "Snare", pattern: Array(15).fill(false), sound: "snare", volume: 100 },
    { id: 2, name: "Hi-Hat", pattern: Array(15).fill(false), sound: "hihat", volume: 100 },
    { id: 3, name: "Clap", pattern: Array(15).fill(false), sound: "clap", volume: 100 },
  ]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate beats.",
        variant: "destructive",
      });
      return;
    }

    if (!genre) {
      toast({
        title: "Select a Genre",
        description: "Please select a genre before generating a beat",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-beat', {
        body: {
          prompt: `Generate a ${genre} beat`,
          genre: genre,
          bpm: bpm[0],
        },
      });

      if (error) throw error;

      if (data?.data?.audioUrl) {
        setAudioUrl(data.data.audioUrl);
        const newTracks = tracks.map(track => ({
          ...track,
          pattern: Array(15).fill(false).map(() => Math.random() > 0.7)
        }));
        setTracks(newTracks);
        
        toast({
          title: "Beat Generated",
          description: "Your beat is ready to play!",
        });
      } else {
        throw new Error('No audio URL received');
      }
    } catch (error) {
      console.error('Error generating beat:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate beat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioUrl) {
      toast({
        title: "No Beat Available",
        description: "Please generate a beat first",
        variant: "destructive",
      });
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentStep(-1);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentStep(-1);
    } else {
      audioRef.current.play();
      startStepAnimation();
    }
    setIsPlaying(!isPlaying);
  };

  const startStepAnimation = () => {
    let step = 0;
    const interval = setInterval(() => {
      if (!isPlaying) {
        clearInterval(interval);
        setCurrentStep(-1);
        return;
      }
      setCurrentStep(step);
      step = (step + 1) % 15;
    }, (60 / bpm[0]) * 1000 / 4);
  };

  const handleDownload = () => {
    if (!audioUrl) {
      toast({
        title: "No Beat Available",
        description: "Please generate a beat first",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${genre.toLowerCase()}-beat-${bpm}bpm.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleStep = (trackId: number, stepIndex: number) => {
    const newTracks = tracks.map(track => {
      if (track.id === trackId) {
        const newPattern = [...track.pattern];
        newPattern[stepIndex] = !newPattern[stepIndex];
        return { ...track, pattern: newPattern };
      }
      return track;
    });
    setTracks(newTracks);
  };

  const addTrack = () => {
    const newTrack: Track = {
      id: tracks.length,
      name: `Track ${tracks.length + 1}`,
      pattern: Array(15).fill(false),
      sound: "custom",
      volume: 100
    };
    setTracks([...tracks, newTrack]);
  };

  const updateTrackVolume = (trackId: number, volume: number[]) => {
    const newTracks = tracks.map(track => {
      if (track.id === trackId) {
        return { ...track, volume: volume[0] };
      }
      return track;
    });
    setTracks(newTracks);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-primary font-bold">Genre</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="border-2 border-primary/50 bg-secondary">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trap">Trap</SelectItem>
              <SelectItem value="boombap">Boom Bap</SelectItem>
              <SelectItem value="lofi">Lo-Fi</SelectItem>
              <SelectItem value="drill">Drill</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-primary font-bold">BPM: {bpm}</Label>
          <Slider
            value={bpm}
            onValueChange={setBpm}
            min={60}
            max={180}
            step={1}
            className="mt-2"
          />
        </div>
      </div>

      <Card className="bg-gradient-to-b from-secondary to-background border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary animate-pulse" />
            Beat Machine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
              className={`w-12 h-12 rounded-full bg-secondary border-2 ${
                isPlaying 
                  ? 'border-destructive shadow-lg shadow-destructive/20 animate-pulse' 
                  : 'border-primary shadow-lg hover:bg-primary/20'
              }`}
              disabled={!audioUrl}
            >
              {isPlaying ? (
                <Square className="h-6 w-6 text-destructive" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 ${
                isGenerating ? 'animate-pulse' : ''
              }`}
            >
              <Music className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate New Beat"}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-12 h-12 rounded-full bg-secondary border-2 border-primary shadow-lg hover:bg-primary/20"
              onClick={handleDownload}
              disabled={!audioUrl}
            >
              <Download className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-black via-secondary to-black border-2 border-primary/30 backdrop-blur-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Volume2 className={`h-5 w-5 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
            Drum Board
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addTrack} className="hover:bg-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            Add Track
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {tracks.map((track) => (
                <div key={track.id} className="relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary/30 rounded-full" />
                  <div className="flex items-center gap-4 bg-black/40 p-4 rounded-lg border border-primary/10">
                    <RadioGroup
                      value={selectedTrack.toString()}
                      onValueChange={(value) => setSelectedTrack(parseInt(value))}
                      className="flex items-center"
                    >
                      <RadioGroupItem 
                        value={track.id.toString()} 
                        id={`track-${track.id}`} 
                        className="border-primary data-[state=checked]:bg-primary"
                      />
                    </RadioGroup>
                    <Label 
                      htmlFor={`track-${track.id}`} 
                      className="min-w-[100px] text-primary font-bold tracking-wide"
                    >
                      {track.name}
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 15 }, (_, index) => (
                        <button
                          key={index}
                          onClick={() => toggleStep(track.id, index)}
                          className={`
                            w-8 h-8 rounded-lg transition-all transform
                            ${track.pattern[index] 
                              ? `bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/50 scale-105
                                 ${isPlaying && index === currentStep ? 'ring-2 ring-white animate-ping' : ''} 
                                 hover:from-primary/90 hover:to-accent/90` 
                              : `bg-secondary/60 border border-primary/20 hover:bg-primary/20
                                 ${isPlaying && index === currentStep ? 'bg-primary/30 ring-1 ring-primary/50' : ''}`
                            }
                            ${(index + 1) % 5 === 0 ? 'mr-2' : ''}
                            group relative
                          `}
                          aria-label={`Toggle step ${index + 1}`}
                        >
                          <span className={`absolute inset-0 rounded-lg ${
                            track.pattern[index] ? 'bg-white/10' : 'bg-black/20'
                          } group-hover:bg-white/5 transition-colors`} />
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Label className="text-xs text-primary/70">Volume</Label>
                      <Slider
                        value={[track.volume]}
                        onValueChange={(value) => updateTrackVolume(track.id, value)}
                        min={0}
                        max={100}
                        step={1}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
