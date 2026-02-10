import { useChats, useCreateChat } from "@/hooks/use-chats";
import { useContacts } from "@/hooks/use-social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MessageSquare, Search, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Chats() {
  const { data: chats, isLoading } = useChats();
  const { data: contacts } = useContacts();
  const createChat = useCreateChat();
  const [search, setSearch] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const filteredChats = chats?.filter(chat => 
    chat.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateChat = () => {
    if (!selectedContact) return;
    createChat.mutate({ participantIds: [selectedContact], title: "New Roleplay" }, {
      onSuccess: () => { setIsNewChatOpen(false); setSelectedContact(null); }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-3 px-4 h-12 border-b bg-card/50 shrink-0">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <h1 className="text-sm font-semibold" data-testid="text-chats-title">Chats</h1>
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-new-chat">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start New Chat</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">Select a contact to chat with</p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {contacts?.map((c: any) => (
                  <button 
                    key={c.contactId}
                    onClick={() => setSelectedContact(c.contactId)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors text-sm",
                      selectedContact === c.contactId ? "bg-primary/10 text-foreground" : "hover:bg-accent"
                    )}
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-secondary">{c.contact?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{c.contact?.username}</span>
                  </button>
                ))}
                {(!contacts || contacts.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No contacts yet.</p>
                )}
              </div>
              <Button className="w-full" disabled={!selectedContact || createChat.isPending} onClick={handleCreateChat}>
                {createChat.isPending ? "Creating..." : "Start Chat"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-8 bg-secondary border-none h-8 text-sm rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-chats"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-1">
            {filteredChats?.map(chat => (
              <Link key={chat.id} href={`/chats/${chat.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer" data-testid={`chat-item-${chat.id}`}>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{chat.title || "Untitled Chat"}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {chat.updatedAt ? format(new Date(chat.updatedAt), "MMM d") : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {chat.scenarioId ? "Scenario active" : "Tap to open"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {filteredChats?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No chats yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
