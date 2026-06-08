
import React from "react";
import { Card } from "@/components/ui/card";
import { PostMedia } from "./types";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface MediaCarouselProps {
  media: PostMedia[];
  className?: string;
}

export const MediaCarousel = ({ media, className }: MediaCarouselProps) => {
  if (!media || media.length === 0) return null;

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {media.map((item, index) => (
          <CarouselItem key={index}>
            <div className="relative aspect-square">
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {media.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
          {media.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-white/50",
                index === 0 && "bg-white"
              )}
            />
          ))}
        </div>
      )}
    </Carousel>
  );
};
