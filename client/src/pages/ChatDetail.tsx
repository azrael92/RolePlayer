import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useChat, useChatMessages, useSendMessage } from "@/hooks/use-chats";
import { useAuth } from "@/hooks/use-auth";
import { useAvatars, useLibrary } from "@/hooks/use-social";
import { useVoiceRecorder } from "@/replit_integrations/audio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mic, Send, ArrowLeft, Loader2, StopCircle, ImageIcon } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

const DEFAULT_SCENE_COLORS = [
  "from-slate-900 to-slate-800",
  "from-zinc-900 to-zinc-800",
  "from-neutral-900 to-stone-900",
];

export default function ChatDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const chatId = parseInt(id || "0");
  const { user } = useAuth();
  
  const { data: chat } = useChat(chatId);
  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  const { data: myAvatars } = useAvatars();
  const { data: libraryItems } = useLibrary();
  
  const [inputText, setInputText] = useState("");
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

  const sceneBackground = (chat as any)?.scene?.backgroundImageUrl || null;
  const defaultBackgrounds = libraryItems?.filter(i => i.type === "background" && i.isDefault) || [];
  const fallbackBg = defaultBackgrounds.length > 0
    ? defaultBackgrounds[chatId % defaultBackgrounds.length]?.url
    : null;
  const displayBackground = sceneBackground || fallbackBg;
  const participants = (chat as any)?.participants || [];
  const gradientIndex = chatId % DEFAULT_SCENE_COLORS.length;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 h-12 border-b bg-card/50 shrink-0" data-testid="chat-header">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <Button size="icon" variant="ghost" onClick={() => navigate("/chats")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold truncate" data-testid="text-chat-title">{(chat as any)?.title || "Chat"}</h2>
          <p className="text-[11px] text-muted-foreground truncate">
            {participants.map((p: any) => p.user?.username || "Unknown").join(", ")}
          </p>
        </div>
      </header>

      <div className="relative shrink-0 h-44 overflow-hidden scene-fade" data-testid="scene-window">
        {displayBackground ? (
          <img src={displayBackground} alt="Scene" className="w-full h-full object-cover transition-all duration-1000" />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br", DEFAULT_SCENE_COLORS[gradientIndex])} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-4 pointer-events-none">
          {myAvatars && myAvatars.length > 0 ? (
            myAvatars.filter(a => a.isDefault).slice(0, 3).map((avatar: any) => {
              const scale = (avatar.scale || 100) / 100;
              const baseHeight = 120;
              const height = baseHeight * scale;
              return (
                <div
                  key={avatar.id}
                  className="relative transition-all duration-500"
                  style={{ height: `${height}px`, width: `${height * 0.6}px` }}
                  data-testid={`scene-avatar-${avatar.id}`}
                >
                  {avatar.imageUrl ? (
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      className="w-full h-full object-contain object-bottom drop-shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-end justify-center">
                      <Avatar className="w-10 h-10 border-2 border-background shadow-lg">
                        <AvatarFallback className="text-xs bg-secondary">{avatar.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              );
            })
          ) : participants.length > 0 ? participants.map((p: any, i: number) => (
            <div key={i} className="mb-3">
              <Avatar className="w-10 h-10 border-2 border-background shadow-lg">
                <AvatarImage src={p.user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs bg-secondary">{p.user?.username?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
            </div>
          )) : (
            <div className="mb-3">
              <Avatar className="w-10 h-10 border-2 border-background shadow-lg">
                <AvatarFallback className="text-xs bg-secondary">{(user as any)?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
        {(chat as any)?.title && (
          <div className="absolute top-3 left-4">
            <p className="text-xs text-white/60 font-medium">{(chat as any)?.scenarioId ? "Scenario" : "Free Chat"}</p>
          </div>
        )}
      </div>

      <div 
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 chat-fade-top"
        ref={scrollRef}
        data-testid="messages-container"
      >
        {isLoading ? (
          <div className="flex justify-center pt-16">
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
                <Avatar className="w-8 h-8 shrink-0 mt-0.5">
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
  );
}
