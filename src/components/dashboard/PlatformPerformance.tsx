import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award, Play } from "lucide-react";

const platformData = [
  { name: "Spotify", streams: 45000, revenue: 2250 },
  { name: "Apple Music", streams: 32000, revenue: 1600 },
  { name: "YouTube Music", streams: 28000, revenue: 1400 },
];

export const PlatformPerformance = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-light">
          <Award className="h-6 w-6" />
          Platform Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platformData.map((platform) => (
            <div key={platform.name} className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-light">{platform.name}</h4>
                <span className="text-primary font-light">${platform.revenue}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="h-4 w-4" />
                <span>{platform.streams.toLocaleString()} streams</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};