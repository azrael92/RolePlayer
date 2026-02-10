import { useLibrary, useCreateLibraryItem } from "@/hooks/use-social";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
    createItem.mutate({ type: newItemType, name: newItemName, url: newItemUrl }, {
      onSuccess: () => { setIsOpen(false); setNewItemUrl(""); setNewItemName(""); }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-3 px-4 h-12 border-b bg-card/50 shrink-0">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <h1 className="text-sm font-semibold" data-testid="text-library-title">Library</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-add-asset"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <Button variant={newItemType === "background" ? "default" : "outline"} onClick={() => setNewItemType("background")} className="flex-1 text-sm">Background</Button>
                <Button variant={newItemType === "character" ? "default" : "outline"} onClick={() => setNewItemType("character")} className="flex-1 text-sm">Character</Button>
              </div>
              <Input placeholder="Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="text-sm" />
              <Input placeholder="Image URL" value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} className="text-sm" />
              <Button className="w-full" onClick={handleAdd} disabled={createItem.isPending}>
                {createItem.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="backgrounds" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="backgrounds" className="text-xs">Backgrounds</TabsTrigger>
            <TabsTrigger value="characters" className="text-xs">Characters</TabsTrigger>
          </TabsList>

          <TabsContent value="backgrounds">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {backgrounds.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-video overflow-hidden">
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2.5 text-xs font-medium truncate">{item.name}</div>
                  </Card>
                ))}
                {backgrounds.length === 0 && <EmptyState type="backgrounds" />}
              </div>
            )}
          </TabsContent>

          <TabsContent value="characters">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {characters.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 text-xs font-medium truncate text-center">{item.name}</div>
                  </Card>
                ))}
                {characters.length === 0 && <EmptyState type="characters" />}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-md">
      <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-30" />
      <p className="text-xs">No {type} yet</p>
    </div>
  );
}
