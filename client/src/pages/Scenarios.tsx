import { useScenarios, useCreateScenario } from "@/hooks/use-scenarios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScenarioSchema } from "@shared/schema";
import { Loader2, Plus, Play, BookOpen } from "lucide-react";
import { useState } from "react";
import { useCreateChat } from "@/hooks/use-chats";
import { useLocation } from "wouter";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Scenarios() {
  const { data: scenarios, isLoading } = useScenarios();
  const createScenario = useCreateScenario();
  const createChat = useCreateChat();
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertScenarioSchema),
    defaultValues: { title: "", description: "", genre: "Fantasy", maturityRating: "PG-13", isPublic: false }
  });

  const onSubmit = (data: any) => {
    createScenario.mutate(data, { onSuccess: () => { setIsOpen(false); form.reset(); } });
  };

  const handleStartChat = (scenarioId: number) => {
    createChat.mutate({ scenarioId, participantIds: [], title: `Roleplay: ${scenarios?.find(s => s.id === scenarioId)?.title}` }, {
      onSuccess: (chat) => setLocation(`/chats/${chat.id}`)
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-3 px-4 h-12 border-b bg-card/50 shrink-0">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <h1 className="text-sm font-semibold" data-testid="text-scenarios-title">Scenarios</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-create-scenario"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Scenario</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input {...form.register("title")} placeholder="The Cursed Kingdom" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea {...form.register("description")} placeholder="Describe the setting..." className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Genre</label>
                  <Input {...form.register("genre")} placeholder="Fantasy" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Rating</label>
                  <Select onValueChange={v => form.setValue("maturityRating", v)} defaultValue="PG-13">
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="PG">PG</SelectItem>
                      <SelectItem value="PG-13">PG-13</SelectItem>
                      <SelectItem value="R">R</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createScenario.isPending}>
                {createScenario.isPending ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl">
            {scenarios?.map(scenario => (
              <Card key={scenario.id} className="p-4 space-y-3 hover-elevate" data-testid={`scenario-card-${scenario.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{scenario.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{scenario.description || "No description"}</p>
                  </div>
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {scenario.genre && <Badge variant="secondary" className="text-[10px]">{scenario.genre}</Badge>}
                    {scenario.maturityRating && <Badge variant="outline" className="text-[10px]">{scenario.maturityRating}</Badge>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleStartChat(scenario.id)} data-testid={`button-start-${scenario.id}`}>
                    <Play className="w-3 h-3 mr-1" /> Start
                  </Button>
                </div>
              </Card>
            ))}
            {scenarios?.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scenarios yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
