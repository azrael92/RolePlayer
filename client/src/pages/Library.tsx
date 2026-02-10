import { Navigation } from "@/components/Navigation";
import { useLibrary, useCreateLibraryItem } from "@/hooks/use-social";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Library() {
  const { data: items, isLoading } = useLibrary();
  const createItem = useCreateLibraryItem();
  const [isOpen, setIsOpen] = useState(false);
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<"background" | "character">("background");

  const backgrounds = items?.filter(i => i.type === "background") || [];
  const characters = items?.filter(i => i.type === "character") || [];

  const handleAdd = () => {
    createItem.mutate({
      type: newItemType,
      name: newItemName,
      url: newItemUrl
    }, {
      onSuccess: () => {
        setIsOpen(false);
        setNewItemUrl("");
        setNewItemName("");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold">Asset Library</h1>
              <p className="text-muted-foreground mt-1">Manage backgrounds and character portraits</p>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                  <Plus className="w-4 h-4" /> Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <div className="flex gap-4">
                      <Button 
                        variant={newItemType === "background" ? "default" : "outline"} 
                        onClick={() => setNewItemType("background")}
                        className="flex-1"
                      >
                        Background
                      </Button>
                      <Button 
                        variant={newItemType === "character" ? "default" : "outline"} 
                        onClick={() => setNewItemType("character")}
                        className="flex-1"
                      >
                        Character
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input 
                      placeholder="E.g., Dark Forest" 
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image URL</label>
                    <Input 
                      placeholder="https://..." 
                      value={newItemUrl}
                      onChange={e => setNewItemUrl(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAdd} disabled={createItem.isPending}>
                    {createItem.isPending ? "Adding..." : "Add to Library"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="backgrounds" className="space-y-6">
            <TabsList className="bg-card border border-white/5">
              <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
            </TabsList>

            <TabsContent value="backgrounds" className="animate-in-fade">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto mt-12 text-primary" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {backgrounds.map(item => (
                    <Card key={item.id} className="overflow-hidden group glass-card">
                      <div className="aspect-video relative overflow-hidden">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" size="sm">Select</Button>
                        </div>
                      </div>
                      <div className="p-3 text-sm font-medium truncate">{item.name}</div>
                    </Card>
                  ))}
                  {backgrounds.length === 0 && <EmptyState type="backgrounds" />}
                </div>
              )}
            </TabsContent>

            <TabsContent value="characters" className="animate-in-fade">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto mt-12 text-primary" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {characters.map(item => (
                    <Card key={item.id} className="overflow-hidden group glass-card">
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="p-3 text-sm font-medium truncate text-center">{item.name}</div>
                    </Card>
                  ))}
                  {characters.length === 0 && <EmptyState type="characters" />}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No {type} found. Add some to get started!</p>
    </div>
  );
}
