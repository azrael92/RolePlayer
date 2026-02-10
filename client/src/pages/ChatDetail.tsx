import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useChat, useChatMessages, useSendMessage } from "@/hooks/use-chats";
import { useAuth } from "@/hooks/use-auth";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mic, Send, Image as ImageIcon, Loader2, StopCircle } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ChatDetail() {
  const { id } = useParams();
  const chatId = parseInt(id || "0");
  const { user } = useAuth();
  
  const { data: chat } = useChat(chatId);
  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio Hooks
  const recorder = useVoiceRecorder();
  // Using useVoiceStream for potential future streaming integration
  // For MVP, we'll just handle recording -> upload separately if needed
  // or simply rely on text
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage.mutate({
      content: inputText,
      type: "text"
    });
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mock function for voice handling - in full implementation, this would upload to an endpoint
  const handleVoiceRecord = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      // Here you would upload the blob
      console.log("Voice recorded:", blob.size);
      // For MVP just creating a text message saying "Voice Message Sent"
      // In real app: upload blob -> get url -> create message with type='voice'
    } else {
      await recorder.startRecording();
    }
  };

  const bgImage = chat?.scenario?.scenes?.[0]?.backgroundImageUrl 
    || chat?.currentSceneId // Need to fetch scene details if relying on ID
    || "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop"; 
    // <!-- fantasy forest background -->

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Navigation />
      
      <main className="flex-1 ml-0 md:ml-64 relative flex flex-col h-full">
        {/* Dynamic Background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>

        {/* Header */}
        <header className="relative z-10 p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold">{chat?.title}</h2>
            <p className="text-sm text-muted-foreground">
              {chat?.participants?.map((p: any) => p.user?.username).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Scene controls could go here */}
          </div>
        </header>

        {/* Messages */}
        <div 
          className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6"
          ref={scrollRef}
        >
          {isLoading ? (
            <div className="flex justify-center pt-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages?.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 max-w-2xl animate-in-fade",
                  isMe ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <Avatar className="w-10 h-10 border border-white/10">
                  <AvatarImage src={msg.sender?.profileImageUrl || undefined} />
                  <AvatarFallback>{msg.sender?.username?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "flex flex-col gap-1",
                  isMe ? "items-end" : "items-start"
                )}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-white/70">
                      {msg.sender?.username}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-lg",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card text-card-foreground border border-white/10 rounded-tl-none"
                  )}>
                    {msg.type === "text" && <p>{msg.content}</p>}
                    {msg.type === "voice" && (
                      <AudioPlayer src={msg.audioUrl || ""} />
                    )}
                    {msg.type === "image" && (
                      <img src={msg.content || ""} alt="Shared" className="rounded-lg max-w-xs" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="relative z-10 p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <ImageIcon className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-1 flex items-center">
              <Input 
                className="bg-transparent border-none focus-visible:ring-0 min-h-[44px]"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button 
                size="icon" 
                variant="ghost"
                className={cn(
                  "mr-1 transition-colors",
                  recorder.state === "recording" ? "text-destructive animate-pulse" : "text-muted-foreground"
                )}
                onClick={handleVoiceRecord}
              >
                {recorder.state === "recording" ? (
                  <StopCircle className="w-5 h-5 fill-current" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
            </div>

            <Button 
              size="icon" 
              className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={handleSend}
              disabled={!inputText.trim() && recorder.state !== "recording"}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
