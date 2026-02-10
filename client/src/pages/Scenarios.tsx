import { Navigation } from "@/components/Navigation";
import { useScenarios, useCreateScenario } from "@/hooks/use-scenarios";
import { ScenarioCard } from "@/components/ScenarioCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScenarioSchema } from "@shared/schema";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useCreateChat } from "@/hooks/use-chats";
import { useLocation } from "wouter";

export default function Scenarios() {
  const { data: scenarios, isLoading } = useScenarios();
  const createScenario = useCreateScenario();
  const createChat = useCreateChat();
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertScenarioSchema),
    defaultValues: {
      title: "",
      description: "",
      genre: "Fantasy",
      maturityRating: "PG-13",
      isPublic: false
    }
  });

  const onSubmit = (data: any) => {
    createScenario.mutate(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const handleStartChat = (scenarioId: number) => {
    // For MVP, instantly creates a chat with just me. 
    // Ideally prompts to invite users.
    createChat.mutate({
      scenarioId,
      participantIds: [], // Just me
      title: `Roleplay: ${scenarios?.find(s => s.id === scenarioId)?.title}`
    }, {
      onSuccess: (chat) => {
        setLocation(`/chats/${chat.id}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">Scenarios</h1>
              <p className="text-muted-foreground mt-1">Choose a setting for your next adventure</p>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" /> Create Scenario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Scenario</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input {...form.register("title")} placeholder="E.g., The Cursed Kingdom" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea {...form.register("description")} placeholder="Describe the setting..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Genre</label>
                      <Input {...form.register("genre")} placeholder="Fantasy" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rating</label>
                      <Select 
                        onValueChange={v => form.setValue("maturityRating", v)} 
                        defaultValue="PG-13"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
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
                    {createScenario.isPending ? "Creating..." : "Create Scenario"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios?.map(scenario => (
                <ScenarioCard 
                  key={scenario.id} 
                  scenario={scenario} 
                  onStartChat={handleStartChat}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
