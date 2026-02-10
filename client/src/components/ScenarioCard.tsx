import { type Scenario } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Play } from "lucide-react";

interface ScenarioCardProps {
  scenario: Scenario;
  onStartChat: (id: number) => void;
}

export function ScenarioCard({ scenario, onStartChat }: ScenarioCardProps) {
  return (
    <Card className="p-4 space-y-3 hover-elevate" data-testid={`scenario-card-${scenario.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{scenario.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {scenario.description || "No description"}
          </p>
        </div>
        <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {scenario.genre && <Badge variant="secondary" className="text-[10px]">{scenario.genre}</Badge>}
          {scenario.maturityRating && <Badge variant="outline" className="text-[10px]">{scenario.maturityRating}</Badge>}
        </div>
        <Button size="sm" variant="ghost" onClick={() => onStartChat(scenario.id)}>
          <Play className="w-3 h-3 mr-1" /> Start
        </Button>
      </div>
    </Card>
  );
}
