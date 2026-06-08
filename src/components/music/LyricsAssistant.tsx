
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export const LyricsAssistant = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate lyrics.",
        variant: "destructive",
      });
      return;
    }

    if (!topic || !genre || !mood) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating lyrics.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: {
          prompt: topic,
          style: genre,
          mood: mood,
        },
      });

      if (error) throw error;

      if (data?.content) {
        const lyricsContent = data.content;
        setSuggestions([lyricsContent]);
        toast({
          title: "Lyrics Generated",
          description: "Check out the suggested lyrics below!",
        });
      }
    } catch (error) {
      console.error('Error generating lyrics:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate lyrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Topic</Label>
          <Input 
            placeholder="Success, love, struggle..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div>
          <Label>Genre</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hiphop">Hip Hop</SelectItem>
              <SelectItem value="rnb">R&B</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="trap">Trap</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mood</Label>
          <Select value={mood} onValueChange={setMood}>
            <SelectTrigger>
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="energetic">Energetic</SelectItem>
              <SelectItem value="melancholic">Melancholic</SelectItem>
              <SelectItem value="confident">Confident</SelectItem>
              <SelectItem value="romantic">Romantic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Your Lyrics</Label>
        <Textarea 
          placeholder="Write your lyrics here or get AI suggestions..."
          className="min-h-[200px]"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />
      </div>

      <Button 
        onClick={handleGenerate} 
        className="w-full"
        disabled={isGenerating}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isGenerating ? "Generating..." : "Generate Lyrics"}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Lyrics</h3>
          {suggestions.map((suggestion, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(), 'PPp')}
                  </span>
                </div>
                <div className="p-4 bg-secondary rounded-lg whitespace-pre-line">
                  {suggestion}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
