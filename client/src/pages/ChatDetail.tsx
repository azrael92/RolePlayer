import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useChat, useChatMessages, useSendMessage } from "@/hooks/use-chats";
import { useAuth } from "@/hooks/use-auth";
import { useAvatars, useLibrary } from "@/hooks/use-social";
import { useVoiceRecorder } from "@/replit_integrations/audio";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Mic, Send, ArrowLeft, Loader2, StopCircle, ImageIcon, Settings2, User as UserIcon } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const chatId = parseInt(id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: chat } = useChat(chatId);
  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  const { data: myAvatars } = useAvatars();
  const { data: libraryItems } = useLibrary();
  
  const [inputText, setInputText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorder = useVoiceRecorder();
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage.mutate({ content: inputText, type: "text" });
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceRecord = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      console.log("Voice recorded:", blob.size);
    } else {
      await recorder.startRecording();
    }
  };

  const chatBackground = (chat as any)?.backgroundUrl || null;
  const defaultBackgrounds = libraryItems?.filter((i: any) => i.type === "background" && i.isDefault) || [];
  const fallbackBg = defaultBackgrounds.length > 0
    ? defaultBackgrounds[chatId % defaultBackgrounds.length]?.url
    : "/backgrounds/forest.png";
  const displayBackground = chatBackground || fallbackBg;

  const participants = (chat as any)?.participants || [];
  const myParticipant = participants.find((p: any) => p.participant?.userId === (user as any)?.id);
  const otherParticipants = participants.filter((p: any) => p.participant?.userId !== (user as any)?.id);
  const myAvatar = myParticipant?.avatar || null;

  const updateBackground = useMutation({
    mutationFn: async (backgroundUrl: string) => {
      const res = await apiRequest("PATCH", `/api/chats/${chatId}/visuals`, { backgroundUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
    },
  });

  const updateMyAvatar = useMutation({
    mutationFn: async (avatarId: number) => {
      const userId = (user as any)?.id;
      const res = await apiRequest("PATCH", `/api/chats/${chatId}/participants/${userId}/avatar`, { avatarId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
    },
  });

  const sceneAvatars = [
    ...(myAvatar ? [myAvatar] : []),
    ...otherParticipants.filter((p: any) => p.avatar).map((p: any) => p.avatar),
  ];
  const fallbackAvatars = myAvatars?.filter((a: any) => a.isDefault).slice(0, 2) || [];
  const displayAvatars = sceneAvatars.length > 0 ? sceneAvatars : fallbackAvatars;

  return (
    <div className="flex flex-col h-full relative" data-testid="chat-detail-view">
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="absolute inset-0 z-0" data-testid="scene-window">
          {displayBackground ? (
            <img
              src={displayBackground}
              alt="Scene"
              className="w-full h-full object-cover transition-all duration-1000"
              data-testid="scene-background-img"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
        </div>

        <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm" data-testid="chat-header">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white" />
          <Button size="icon" variant="ghost" onClick={() => navigate("/chats")} data-testid="button-back" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate text-white" data-testid="text-chat-title">{(chat as any)?.title || "Chat"}</h2>
            <p className="text-[11px] text-white/60 truncate">
              {participants.map((p: any) => p.user?.username || "Unknown").join(", ")}
            </p>
          </div>
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-chat-settings" className="text-white hover:bg-white/10">
                <Settings2 className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Scene Settings</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <UserIcon className="w-4 h-4" /> Your Avatar
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {myAvatars?.filter((a: any) => a.isDefault).map((avatar: any) => (
                      <button
                        key={avatar.id}
                        className={cn(
                          "relative rounded-md overflow-visible p-1 transition-all border-2",
                          myAvatar?.id === avatar.id ? "border-primary" : "border-transparent hover-elevate"
                        )}
                        onClick={() => updateMyAvatar.mutate(avatar.id)}
                        data-testid={`select-avatar-${avatar.id}`}
                      >
                        <img src={avatar.imageUrl} alt={avatar.name} className="w-full aspect-square object-contain rounded-md bg-secondary/50" />
                        <p className="text-[10px] text-center mt-1 truncate text-muted-foreground">{avatar.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4" /> Background
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultBackgrounds.map((bg: any) => (
                      <button
                        key={bg.id}
                        className={cn(
                          "relative rounded-md overflow-visible transition-all border-2",
                          displayBackground === bg.url ? "border-primary" : "border-transparent hover-elevate"
                        )}
                        onClick={() => updateBackground.mutate(bg.url)}
                        data-testid={`select-bg-${bg.id}`}
                      >
                        <img src={bg.url} alt={bg.name} className="w-full aspect-video object-cover rounded-md" />
                        <p className="text-[10px] text-center mt-1 truncate text-muted-foreground">{bg.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height: "60%" }}>
          <div className="absolute inset-0 flex items-end justify-center gap-4 px-8 pb-4">
            {displayAvatars.map((avatar: any) => {
              const scale = (avatar.scale || 100) / 100;
              const baseHeight = 160;
              const height = baseHeight * scale;
              return (
                <div
                  key={avatar.id}
                  className="relative transition-all duration-500"
                  style={{ height: `${height}px`, width: `${height * 0.6}px` }}
                  data-testid={`scene-avatar-${avatar.id}`}
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.name}
                    className="w-full h-full object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  />
                </div>
              );
            })}
            {displayAvatars.length === 0 && participants.length > 0 && participants.map((p: any, i: number) => (
              <div key={i} className="mb-3">
                <Avatar className="w-14 h-14 border-2 border-white/30 shadow-lg">
                  <AvatarImage src={p.user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-sm bg-secondary">{p.user?.username?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20 flex flex-col bg-background" style={{ maxHeight: "45%" }}>
        <div 
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          ref={scrollRef}
          data-testid="messages-container"
        >
          {isLoading ? (
            <div className="flex justify-center pt-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages?.map((msg: any) => {
            const isMe = msg.senderId === (user as any)?.id;
            return (
              <div 
                key={msg.id} 
                className={cn("flex gap-2.5 max-w-lg", isMe ? "ml-auto flex-row-reverse" : "")}
                data-testid={`message-${msg.id}`}
              >
                {!isMe && (
                  <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-xs bg-secondary">
                      {msg.senderId?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn("flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                  {!isMe && (
                    <span className="text-[11px] text-muted-foreground font-medium ml-1">
                      {msg.senderId || "Unknown"}
                    </span>
                  )}
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-br-md" 
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}>
                    {(msg.type === "text" || !msg.type) && <p className="whitespace-pre-wrap">{msg.content}</p>}
                    {msg.type === "voice" && <AudioPlayer src={msg.audioUrl || ""} />}
                    {msg.type === "image" && (
                      <img src={msg.fileUrl || msg.content || ""} alt="Shared" className="rounded-lg max-w-[240px]" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 mx-1">
                    {msg.createdAt ? format(new Date(msg.createdAt), "h:mm a") : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t bg-card/30 shrink-0" data-testid="chat-input-area">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground" data-testid="button-attach">
              <ImageIcon className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 flex items-center bg-secondary rounded-full px-3">
              <Input 
                className="bg-transparent border-none focus-visible:ring-0 h-10 text-sm"
                placeholder="Message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid="input-message"
              />
              <button
                className={cn(
                  "p-1.5 rounded-full transition-colors shrink-0",
                  recorder.state === "recording" ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={handleVoiceRecord}
                data-testid="button-voice"
              >
                {recorder.state === "recording" ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <Button 
              size="icon"
              className="rounded-full shrink-0"
              onClick={handleSend}
              disabled={!inputText.trim() && recorder.state !== "recording"}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
