
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LyricsAssistant } from "./LyricsAssistant";
import { BeatCreator } from "./BeatCreator";
import { ProductionAssistant } from "./ProductionAssistant";
import { Music, Mic2, Waves } from "lucide-react";
import { MembershipGuard } from "@/components/auth/MembershipGuard";

export const AIMusicTools = () => {
  return (
    <Card className="p-4">
      <Tabs defaultValue="lyrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lyrics" className="flex items-center gap-2">
            <Mic2 className="h-4 w-4" />
            Lyrics
          </TabsTrigger>
          <TabsTrigger value="beats" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Beats
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-2">
            <Waves className="h-4 w-4" />
            Production
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lyrics">
          <LyricsAssistant />
        </TabsContent>
        <TabsContent value="beats">
          <MembershipGuard feature="beats">
            <BeatCreator />
          </MembershipGuard>
        </TabsContent>
        <TabsContent value="production">
          <MembershipGuard feature="production">
            <ProductionAssistant />
          </MembershipGuard>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
