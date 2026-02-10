import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src?: string;
  autoPlay?: boolean;
}

export function AudioPlayer({ src, autoPlay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (src && autoPlay) {
      setIsPlaying(true);
    }
  }, [src, autoPlay]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio playback error:", error);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  if (!src) return null;

  return (
    <div className="flex items-center gap-2 bg-secondary/50 rounded-full pl-2 pr-4 py-1.5 border border-white/5">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        className="hidden"
      />
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full",
          isPlaying ? "text-primary bg-primary/10" : "text-muted-foreground"
        )}
        onClick={togglePlay}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </Button>
      
      <div className="flex flex-col justify-center">
        <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
          <div className={cn(
            "h-full bg-primary origin-left animate-[pulse_1s_ease-in-out_infinite]",
            !isPlaying && "w-0 animate-none",
            isPlaying && "w-full"
          )} />
        </div>
      </div>
      
      <span className="text-xs font-medium text-muted-foreground">Voice</span>
    </div>
  );
}
