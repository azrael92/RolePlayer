import { useLibrary, useCreateLibraryItem, useUpdateLibraryItem, useDeleteLibraryItem, useAvatars, useUpdateAvatar } from "@/hooks/use-social";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Image as ImageIcon, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

const SPECIES_LABELS: Record<string, string> = {
  human: "Human",
  elf: "Elf",
  demon: "Demon",
  centaur: "Centaur",
  fae: "Fae",
};

export default function Library() {
  const { data: items, isLoading } = useLibrary();
  const { data: avatarList } = useAvatars();
  const createItem = useCreateLibraryItem();
  const updateAvatar = useUpdateAvatar();
  const deleteItem = useDeleteLibraryItem();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<"background" | "character">("background");
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null);

  const backgrounds = items?.filter(i => i.type === "background") || [];
  const characters = items?.filter(i => i.type === "character") || [];

  const handleAdd = () => {
    createItem.mutate({ type: newItemType, name: newItemName, url: newItemUrl }, {
      onSuccess: () => { setIsOpen(false); setNewItemUrl(""); setNewItemName(""); }
    });
  };

  const handleScaleChange = (avatarId: number, newScale: number) => {
    updateAvatar.mutate({ id: avatarId, scale: newScale });
  };

  const handleDelete = (id: number) => {
    deleteItem.mutate(id, {
      onSuccess: () => toast({ title: "Item removed" }),
    });
  };

  const getAvatarForCharacter = (character: any) => {
    return avatarList?.find(a =>
      a.species === character.species && a.gender === character.gender
    );
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
              <Input placeholder="Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="text-sm" data-testid="input-asset-name" />
              <Input placeholder="Image URL" value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} className="text-sm" data-testid="input-asset-url" />
              <Button className="w-full" onClick={handleAdd} disabled={createItem.isPending} data-testid="button-submit-asset">
                {createItem.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="characters" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="characters" className="text-xs" data-testid="tab-characters">Characters</TabsTrigger>
            <TabsTrigger value="backgrounds" className="text-xs" data-testid="tab-backgrounds">Backgrounds</TabsTrigger>
          </TabsList>

          <TabsContent value="characters">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {characters.map(item => {
                  const avatar = getAvatarForCharacter(item);
                  const isEditing = editingCharacterId === item.id;
                  return (
                    <CharacterCard
                      key={item.id}
                      item={item}
                      avatar={avatar}
                      isEditing={isEditing}
                      onToggleEdit={() => setEditingCharacterId(isEditing ? null : item.id)}
                      onScaleChange={handleScaleChange}
                      onDelete={handleDelete}
                    />
                  );
                })}
                {characters.length === 0 && <EmptyState type="characters" />}
              </div>
            )}
          </TabsContent>

          <TabsContent value="backgrounds">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {backgrounds.map(item => (
                  <Card key={item.id} className="overflow-visible group relative" data-testid={`card-background-${item.id}`}>
                    <div className="aspect-video overflow-hidden rounded-t-md">
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2.5 flex items-center justify-between gap-1">
                      <span className="text-xs font-medium truncate">{item.name}</span>
                      {!item.isDefault && (
                        <Button size="icon" variant="ghost" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)} data-testid={`button-delete-bg-${item.id}`}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {backgrounds.length === 0 && <EmptyState type="backgrounds" />}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CharacterCard({
  item,
  avatar,
  isEditing,
  onToggleEdit,
  onScaleChange,
  onDelete,
}: {
  item: any;
  avatar: any;
  isEditing: boolean;
  onToggleEdit: () => void;
  onScaleChange: (avatarId: number, scale: number) => void;
  onDelete: (id: number) => void;
}) {
  const scale = avatar?.scale || 100;
  const speciesLabel = SPECIES_LABELS[item.species || "human"] || item.species || "Human";
  const genderLabel = item.gender === "female" ? "F" : "M";

  return (
    <Card className="overflow-visible relative" data-testid={`card-character-${item.id}`}>
      <div className="aspect-[3/4] overflow-hidden rounded-t-md bg-secondary/30 relative">
        <img
          src={item.url}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${scale / 100})`, transformOrigin: "bottom center" }}
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{speciesLabel}</Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{genderLabel}</Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-1 right-1"
          onClick={onToggleEdit}
          data-testid={`button-edit-char-${item.id}`}
        >
          {isEditing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
        </Button>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium truncate text-center mb-1">{item.name}</p>
        {isEditing && avatar && (
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">Scale</span>
              <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{scale}%</span>
            </div>
            <Slider
              value={[scale]}
              min={50}
              max={200}
              step={5}
              onValueCommit={(v) => onScaleChange(avatar.id, v[0])}
              className="w-full"
              data-testid={`slider-scale-${item.id}`}
            />
            {!item.isDefault && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/20 text-[10px]"
                onClick={() => onDelete(item.id)}
                data-testid={`button-delete-char-${item.id}`}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
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
