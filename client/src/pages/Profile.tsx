import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import QRCode from "react-qr-code";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pencil, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Profile() {
  const { user, logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    defaultValues: {
      username: (user as any)?.username || "",
      aboutMe: "",
      profileImageUrl: (user as any)?.profileImageUrl || ""
    }
  });

  const onSubmit = (data: any) => {
    updateProfile.mutate(data, {
      onSuccess: () => { setIsEditing(false); toast({ title: "Profile updated" }); }
    });
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-3 px-4 h-12 border-b bg-card/50 shrink-0">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <h1 className="text-sm font-semibold" data-testid="text-profile-title">Profile</h1>
        <Button size="icon" variant="ghost" onClick={() => setIsEditing(!isEditing)} data-testid="button-edit-profile">
          {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-4 p-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
              <AvatarFallback className="text-lg bg-secondary">{(user as any)?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-username">{(user as any)?.username}</h2>
              <p className="text-sm text-muted-foreground">{(user as any)?.email}</p>
            </div>
          </div>

          {isEditing ? (
            <Card className="p-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Username</label>
                  <Input {...form.register("username")} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Avatar URL</label>
                  <Input {...form.register("profileImageUrl")} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">About Me</label>
                  <Textarea {...form.register("aboutMe")} className="text-sm" />
                </div>
                <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save"}
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="p-4 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">About</p>
                <p className="text-sm text-muted-foreground">No bio set yet.</p>
              </div>
            </Card>
          )}

          <Card className="p-4 flex flex-col items-center text-center">
            <div className="bg-white p-3 rounded-md mb-3">
              <QRCode value={`user:${(user as any)?.id}`} size={100} />
            </div>
            <p className="text-xs text-muted-foreground mb-2">Share to add as contact</p>
            <code className="px-2 py-1 rounded-md bg-secondary text-[10px] font-mono select-all" data-testid="text-user-id">
              {(user as any)?.id}
            </code>
          </Card>

          <Button variant="outline" className="w-full text-destructive border-destructive/20" onClick={() => logout()} data-testid="button-logout-profile">
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
