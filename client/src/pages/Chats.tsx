import { Navigation } from "@/components/Navigation";
import { useChats, useCreateChat } from "@/hooks/use-chats";
import { useContacts } from "@/hooks/use-social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Search, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";

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
    createChat.mutate({
      participantIds: [selectedContact],
      title: "New Roleplay"
    }, {
      onSuccess: () => {
        setIsNewChatOpen(false);
        setSelectedContact(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">Your Chats</h1>
              <p className="text-muted-foreground mt-1">Manage your active roleplay sessions</p>
            </div>

            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" /> New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Partner</label>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {contacts?.map(c => (
                        <div 
                          key={c.contactId}
                          onClick={() => setSelectedContact(c.contactId)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                            selectedContact === c.contactId 
                              ? "bg-primary/10 border-primary" 
                              : "border-border hover:bg-secondary"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              {c.contact.username?.charAt(0).toUpperCase()}
                            </div>
                            <span>{c.contact.username}</span>
                          </div>
                          {selectedContact === c.contactId && (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          )}
                        </div>
                      ))}
                      {contacts?.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No contacts yet. Add contacts to start chatting.
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!selectedContact || createChat.isPending}
                    onClick={handleCreateChat}
                  >
                    {createChat.isPending ? "Creating..." : "Start Chat"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search chats..." 
              className="pl-10 bg-card border-border h-12 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredChats?.map(chat => (
                <Link key={chat.id} href={`/chats/${chat.id}`}>
                  <Card className="glass-card p-4 hover:border-primary/50 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{chat.title || "Untitled Chat"}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {chat.scenarioId && (
                              <Badge variant="secondary" className="text-xs">Scenario Active</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(chat.updatedAt || new Date()), "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Chat &rarr;
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
              {filteredChats?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No chats found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
