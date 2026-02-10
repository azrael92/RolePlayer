import { useContacts, useInviteContact } from "@/hooks/use-social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Contacts() {
  const { data: contacts, isLoading } = useContacts();
  const invite = useInviteContact();
  const { toast } = useToast();
  const [inviteUsername, setInviteUsername] = useState("");

  const handleInvite = () => {
    if (!inviteUsername) return;
    invite.mutate({ username: inviteUsername }, {
      onSuccess: () => { toast({ title: "Invite sent" }); setInviteUsername(""); },
      onError: (err) => { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 h-12 border-b bg-card/50 shrink-0">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <h1 className="text-sm font-semibold" data-testid="text-contacts-title">Contacts</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex gap-2 max-w-lg">
            <Input 
              placeholder="Add by username..." 
              className="text-sm bg-secondary border-none"
              value={inviteUsername}
              onChange={e => setInviteUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
              data-testid="input-invite-username"
            />
            <Button onClick={handleInvite} disabled={invite.isPending} data-testid="button-send-invite">
              <UserPlus className="w-4 h-4 mr-1.5" />
              {invite.isPending ? "..." : "Add"}
            </Button>
          </div>
        </div>

        <div className="p-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Friends {contacts?.length ? `(${contacts.length})` : ""}
          </p>
          
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-0.5">
              {contacts?.map(({ contact, status }: any) => (
                <div key={contact.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors" data-testid={`contact-${contact.id}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={contact.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs bg-secondary">{contact.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{contact.username}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {status === "pending" ? "Pending" : "Online"}
                    </p>
                  </div>
                  {status === "pending" && <Badge variant="secondary" className="text-[10px]">Pending</Badge>}
                </div>
              ))}
              {contacts?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No contacts yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
