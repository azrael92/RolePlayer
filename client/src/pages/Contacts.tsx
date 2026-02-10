import { Navigation } from "@/components/Navigation";
import { useContacts, useInviteContact } from "@/hooks/use-social";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contacts() {
  const { data: contacts, isLoading } = useContacts();
  const invite = useInviteContact();
  const { toast } = useToast();
  const [inviteUsername, setInviteUsername] = useState("");

  const handleInvite = () => {
    if (!inviteUsername) return;
    invite.mutate({ username: inviteUsername }, {
      onSuccess: () => {
        toast({ title: "Invite sent", description: `Sent friend request to ${inviteUsername}` });
        setInviteUsername("");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Contacts</h1>
            <p className="text-muted-foreground mt-1">Connect with other roleplayers</p>
          </div>

          <Card className="p-6 glass-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Add Contact
            </h2>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter username..." 
                  className="pl-10"
                  value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)}
                />
              </div>
              <Button onClick={handleInvite} disabled={invite.isPending}>
                {invite.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Friends</h2>
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            ) : (
              <div className="grid gap-4">
                {contacts?.map(({ contact, status }) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-white/5 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={contact.profileImageUrl || undefined} />
                        <AvatarFallback>{contact.username?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{contact.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {status === 'pending' ? 'Request Pending' : 'Online'}
                        </div>
                      </div>
                    </div>
                    {status === 'pending' ? (
                      <Badge variant="secondary">Pending</Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Message</Button>
                      </div>
                    )}
                  </div>
                ))}
                {contacts?.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No contacts yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
