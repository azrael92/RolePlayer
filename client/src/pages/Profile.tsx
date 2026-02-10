import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import QRCode from "react-qr-code";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    defaultValues: {
      username: user?.username || "",
      aboutMe: "", // Add field to schema if needed, assuming user meta
      profileImageUrl: user?.profileImageUrl || ""
    }
  });

  const onSubmit = (data: any) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        setIsEditing(false);
        toast({ title: "Profile updated" });
      }
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-display font-bold">Profile</h1>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Information</CardTitle>
                <Button variant="ghost" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input {...form.register("username")} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Avatar URL</label>
                      <Input {...form.register("profileImageUrl")} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">About Me</label>
                      <Textarea {...form.register("aboutMe")} />
                    </div>
                    <Button type="submit" disabled={updateProfile.isPending}>
                      Save Changes
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="w-24 h-24 border-2 border-primary/20">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="text-2xl">{user.username?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">{user.username}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">About</h3>
                      <p className="leading-relaxed">No bio set yet.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="glass-card flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-4 rounded-xl mb-4">
                  <QRCode value={`user:${user.id}`} size={128} />
                </div>
                <h3 className="font-bold mb-1">Your ID Code</h3>
                <p className="text-xs text-muted-foreground mb-4">Share this with friends to add you</p>
                <code className="px-3 py-1 rounded bg-black/40 text-xs font-mono select-all">
                  {user.id}
                </code>
              </Card>

              <Card className="glass-card border-destructive/20">
                <CardContent className="pt-6">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => logout()}
                  >
                    Log Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
