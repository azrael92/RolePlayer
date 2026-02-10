import { type Scenario } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, Play } from "lucide-react";

interface ScenarioCardProps {
  scenario: Scenario;
  onStartChat: (id: number) => void;
}

export function ScenarioCard({ scenario, onStartChat }: ScenarioCardProps) {
  return (
    <Card className="glass-card hover:border-primary/50 transition-all duration-300 group overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity duration-500">
          <ScrollText className="w-16 h-16 text-primary" />
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          {scenario.genre && (
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-none">
              {scenario.genre}
            </Badge>
          )}
          {scenario.maturityRating && (
            <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
              {scenario.maturityRating}
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-1">{scenario.title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
          {scenario.description || "No description provided."}
        </p>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full gap-2 group-hover:bg-primary group-hover:text-white transition-colors" 
          onClick={() => onStartChat(scenario.id)}
        >
          <Play className="w-4 h-4 fill-current" /> Start Roleplay
        </Button>
      </CardFooter>
    </Card>
  );
}
