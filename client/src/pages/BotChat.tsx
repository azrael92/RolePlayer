import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Send,
  Loader2,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Settings2,
  Plus,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";

const BOT_USER_ID = "rp-bot";

interface BotMessage {
  id: number;
  chatId: number;
  senderId: string | null;
  content: string | null;
  type: string | null;
  createdAt: string;
}

export default function BotChat() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const chatId = id ? parseInt(id) : null;
  const [inputText, setInputText] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: scenarios } = useQuery({ queryKey: ["/api/scenarios"] });

  const { data: botChats } = useQuery<any[]>({
    queryKey: ["/api/chats"],
    select: (data: any[]) =>
      data?.filter(
        (c: any) => c.type === "direct" && (c.title?.includes("Bot") || c.title?.includes("Role-Play"))
      ) || [],
  });

  const { data: chatData, isLoading: chatLoading } = useQuery<any>({
    queryKey: ["/api/chats", chatId],
    enabled: !!chatId,
    refetchInterval: isStreaming ? false : 5000,
  });

  const messages: BotMessage[] = chatData?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const startBotChat = useMutation({
    mutationFn: async (data: { scenarioId?: number; title?: string }) => {
      const res = await apiRequest("POST", "/api/bot/start", data);
      return res.json();
    },
    onSuccess: (chat: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      navigate(`/bot/${chat.id}`);
    },
  });

  const sendFeedback = useMutation({
    mutationFn: async (data: { feedback: string; chatId?: number }) => {
      const res = await apiRequest("POST", "/api/bot/feedback", data);
      return res.json();
    },
    onSuccess: () => {
      setFeedbackText("");
      setFeedbackOpen(false);
      if (chatId) queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
    },
  });

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !chatId || isStreaming) return;
    const messageText = inputText;
    setInputText("");
    setIsStreaming(true);
    setStreamingText("");

    try {
      const scenarioId = chatData?.scenarioId || undefined;
      const response = await fetch("/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId, message: messageText, scenarioId }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) { accumulated += data.content; setStreamingText(accumulated); }
              if (data.done) { setStreamingText(""); setIsStreaming(false); queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] }); }
              if (data.error) { setStreamingText(""); setIsStreaming(false); }
            } catch {}
          }
        }
      }
    } catch {
      setStreamingText("");
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
    }
  }, [inputText, chatId, isStreaming, chatData, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleStartNew = () => {
    const parsedId = selectedScenario && selectedScenario !== "none" ? parseInt(selectedScenario) : NaN;
    const scenarioId = Number.isNaN(parsedId) ? undefined : parsedId;
    const scenario = scenarioId ? (scenarios as any[])?.find((s: any) => s.id === scenarioId) : undefined;
    startBotChat.mutate({ scenarioId, title: scenario ? `Bot: ${scenario.title}` : "Bot Role-Play" });
  };

  const handleQuickFeedback = (type: "positive" | "negative") => {
    const msg = type === "positive" ? "I'm enjoying this style, keep it up!" : "Please adjust your tone, be more creative and descriptive.";
    sendFeedback.mutate({ feedback: msg, chatId: chatId || undefined });
  };

  if (!chatId) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-3 px-4 h-12 border-b bg-card/50 shrink-0">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <Bot className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-semibold" data-testid="text-bot-title">Role-Play Bot</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-lg mx-auto space-y-4">
            <Card className="p-4 space-y-3">
              <h2 className="text-sm font-semibold">New Session</h2>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger data-testid="select-scenario" className="text-sm">
                  <SelectValue placeholder="Free-form role-play" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Free-form role-play</SelectItem>
                  {(scenarios as any[])?.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleStartNew} disabled={startBotChat.isPending} className="w-full" data-testid="button-start-bot">
                {startBotChat.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Start Session
              </Button>
            </Card>

            {botChats && botChats.length > 0 && (
              <div className="space-y-1">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Previous Sessions</h2>
                {botChats.map((chat: any) => (
                  <button
                    key={chat.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left"
                    onClick={() => navigate(`/bot/${chat.id}`)}
                    data-testid={`card-bot-chat-${chat.id}`}
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {chat.createdAt && format(new Date(chat.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 h-12 border-b bg-card/50 shrink-0" data-testid="bot-chat-header">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <Button size="icon" variant="ghost" onClick={() => navigate("/bot")} data-testid="button-back-bot-list">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold truncate" data-testid="text-chat-title">{chatData?.title || "Bot Chat"}</h2>
          <p className="text-[11px] text-muted-foreground">AI Partner</p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" onClick={() => handleQuickFeedback("positive")} disabled={sendFeedback.isPending} data-testid="button-feedback-positive">
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => handleQuickFeedback("negative")} disabled={sendFeedback.isPending} data-testid="button-feedback-negative">
            <ThumbsDown className="w-4 h-4" />
          </Button>
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-feedback-detail">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Give Feedback</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Tell the bot how to improve. Preferences are remembered across sessions.</p>
                <Textarea placeholder="e.g. Be more descriptive, use shorter responses..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} data-testid="input-feedback-text" />
                <Button onClick={() => sendFeedback.mutate({ feedback: feedbackText, chatId: chatId || undefined })} disabled={!feedbackText.trim() || sendFeedback.isPending} className="w-full" data-testid="button-submit-feedback">
                  {sendFeedback.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Feedback
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" ref={scrollRef} data-testid="bot-messages">
        {chatLoading ? (
          <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {messages.map((msg) => {
              const isBot = msg.senderId === BOT_USER_ID;
              return (
                <div key={msg.id} className={cn("flex gap-2.5 max-w-lg", isBot ? "" : "ml-auto flex-row-reverse")} data-testid={`message-${msg.id}`}>
                  {isBot && (
                    <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("flex flex-col gap-0.5", isBot ? "items-start" : "items-end")}>
                    {isBot && <span className="text-[11px] text-muted-foreground font-medium ml-1">Bot</span>}
                    <div className={cn(
                      "px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      isBot ? "bg-secondary text-secondary-foreground rounded-bl-md" : "bg-primary text-primary-foreground rounded-br-md"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 mx-1">
                      {msg.createdAt && format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                  </div>
                </div>
              );
            })}

            {streamingText && (
              <div className="flex gap-2.5 max-w-lg">
                <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs"><Bot className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 items-start">
                  <span className="text-[11px] text-muted-foreground font-medium ml-1">Bot</span>
                  <div className="px-3 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed bg-secondary text-secondary-foreground whitespace-pre-wrap">
                    {streamingText}
                    <span className="inline-block w-1 h-3.5 bg-foreground/40 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                  </div>
                </div>
              </div>
            )}

            {isStreaming && !streamingText && (
              <div className="flex gap-2.5 max-w-lg">
                <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs"><Bot className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div className="px-3 py-2.5 rounded-2xl rounded-bl-md bg-secondary">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-3 border-t bg-card/30 shrink-0">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className="flex-1 flex items-center bg-secondary rounded-full px-3">
            <Input className="bg-transparent border-none focus-visible:ring-0 h-10 text-sm" placeholder="Message..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} disabled={isStreaming} data-testid="input-bot-message" />
          </div>
          <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!inputText.trim() || isStreaming} data-testid="button-send-bot">
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
