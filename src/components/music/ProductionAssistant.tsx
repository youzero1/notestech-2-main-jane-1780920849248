
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Waves, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const ProductionAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [levels, setLevels] = useState({
    bass: [0],
    mids: [0],
    highs: [0],
    volume: [0],
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // TODO: Implement AI analysis logic
    setTimeout(() => {
      setFeedback(
        "Your mix could benefit from:\n- Reducing the bass frequencies around 100Hz\n- Adding more presence in the high-mids\n- Better stereo width in the chorus"
      );
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Check out the mixing suggestions below!",
      });
    }, 2000);
  };

  const SliderWithValue = ({ value, onChange, label, min, max }: { 
    value: number[], 
    onChange: (value: number[]) => void, 
    label: string,
    min: number,
    max: number
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {value[0].toFixed(1)} dB
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={onChange}
        min={min}
        max={max}
        step={0.1}
        className="relative flex items-center select-none touch-none w-full transition-colors h-5"
      />
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Mix Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderWithValue
              label="Bass (dB)"
              value={levels.bass}
              onChange={(value) => setLevels({ ...levels, bass: value })}
              min={-12}
              max={12}
            />
            <SliderWithValue
              label="Mids (dB)"
              value={levels.mids}
              onChange={(value) => setLevels({ ...levels, mids: value })}
              min={-12}
              max={12}
            />
            <SliderWithValue
              label="Highs (dB)"
              value={levels.highs}
              onChange={(value) => setLevels({ ...levels, highs: value })}
              min={-12}
              max={12}
            />
            <SliderWithValue
              label="Volume (dB)"
              value={levels.volume}
              onChange={(value) => setLevels({ ...levels, volume: value })}
              min={-24}
              max={0}
            />
          </div>

          <Button 
            onClick={handleAnalyze} 
            className="w-full"
            disabled={isAnalyzing}
          >
            <Waves className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Analyze Mix"}
          </Button>
        </CardContent>
      </Card>

      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle>AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-secondary rounded-lg whitespace-pre-line">
              {feedback}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Production Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Describe what you're working on to get personalized production tips..."
            className="min-h-[100px]"
          />
          <Button className="mt-4 w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Get Production Tips
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
