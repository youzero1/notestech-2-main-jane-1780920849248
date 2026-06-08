
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type GeneratedContentRow = Database['public']['Tables']['generated_content']['Row'];

interface GeneratedItem extends Omit<GeneratedContentRow, 'updated_at' | 'user_id'> {
  type: 'lyrics' | 'beats' | 'production';
  metadata: Record<string, any> | null;
}

export const GeneratedContent = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<GeneratedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [user]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match GeneratedItem type
      const transformedData: GeneratedItem[] = (data || []).map(item => ({
        id: item.id,
        type: item.type,
        content: item.content,
        prompt: item.prompt,
        created_at: item.created_at,
        metadata: item.metadata as Record<string, any> | null,
      }));

      setContent(transformedData);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load your generated content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }

    if (!isPlaying || currentAudio?.src !== audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Could not play the audio file",
          variant: "destructive",
        });
      });
      setCurrentAudio(audio);
      setIsPlaying(true);

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }
  };

  const renderContent = (item: GeneratedItem) => {
    switch (item.type) {
      case 'lyrics':
        return (
          <div className="whitespace-pre-line bg-secondary/50 p-4 rounded-lg">
            {item.content}
          </div>
        );
      case 'beats':
        try {
          const beatContent = JSON.parse(item.content);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => togglePlay(beatContent.audioUrl)}
                  className={`w-12 h-12 rounded-full ${isPlaying ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <div>
                  <p className="font-medium">Genre: {String(item.metadata?.genre || 'Unknown')}</p>
                  <p className="text-sm text-muted-foreground">BPM: {String(item.metadata?.bpm || 'N/A')}</p>
                </div>
              </div>
            </div>
          );
        } catch (error) {
          console.error('Error parsing beat content:', error);
          return <div>Error displaying beat content</div>;
        }
      case 'production':
        return (
          <div className="space-y-2">
            <p className="font-medium">Production Notes:</p>
            <div className="bg-secondary/50 p-4 rounded-lg">
              {item.content}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Generated Content</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lyrics">
          <TabsList>
            <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
            <TabsTrigger value="beats">Beats</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
          </TabsList>

          <TabsContent value="lyrics" className="space-y-4">
            {content
              .filter(item => item.type === 'lyrics')
              .map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(item.created_at), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Prompt: {item.prompt}</p>
                  {renderContent(item)}
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="beats" className="space-y-4">
            {content
              .filter(item => item.type === 'beats')
              .map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(item.created_at), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Prompt: {item.prompt}</p>
                  {renderContent(item)}
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            {content
              .filter(item => item.type === 'production')
              .map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(item.created_at), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Prompt: {item.prompt}</p>
                  {renderContent(item)}
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
