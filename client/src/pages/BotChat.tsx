import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trash2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

  const { data: scenarios } = useQuery({
    queryKey: ["/api/scenarios"],
  });

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
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
      }
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

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamingText(accumulated);
              }
              if (data.done) {
                setStreamingText("");
                setIsStreaming(false);
                queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
              }
              if (data.error) {
                setStreamingText("");
                setIsStreaming(false);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Send error:", error);
      setStreamingText("");
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId] });
    }
  }, [inputText, chatId, isStreaming, chatData, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartNew = () => {
    const parsedId = selectedScenario && selectedScenario !== "none" ? parseInt(selectedScenario) : NaN;
    const scenarioId = Number.isNaN(parsedId) ? undefined : parsedId;
    const scenario = scenarioId ? (scenarios as any[])?.find((s: any) => s.id === scenarioId) : undefined;
    startBotChat.mutate({
      scenarioId,
      title: scenario ? `Bot: ${scenario.title}` : "Bot Role-Play",
    });
  };

  const handleQuickFeedback = (type: "positive" | "negative") => {
    const msg =
      type === "positive"
        ? "I'm enjoying this style, keep it up!"
        : "Please adjust your tone, be more creative and descriptive.";
    sendFeedback.mutate({ feedback: msg, chatId: chatId || undefined });
  };

  if (!chatId) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation />
        <main className="flex-1 ml-0 md:ml-64 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold" data-testid="text-bot-title">
                  Role-Play Bot
                </h1>
                <p className="text-sm text-muted-foreground">
                  Practice scenarios with an AI partner
                </p>
              </div>
            </div>

            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Start a New Session</h2>
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">
                  Choose a scenario (optional)
                </label>
                <Select
                  value={selectedScenario}
                  onValueChange={setSelectedScenario}
                >
                  <SelectTrigger data-testid="select-scenario">
                    <SelectValue placeholder="Free-form role-play" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Free-form role-play</SelectItem>
                    {(scenarios as any[])?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.title}
                        {s.genre && (
                          <span className="text-muted-foreground ml-2">
                            ({s.genre})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleStartNew}
                disabled={startBotChat.isPending}
                data-testid="button-start-bot"
              >
                {startBotChat.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Start Session
              </Button>
            </Card>

            {botChats && botChats.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Previous Sessions</h2>
                {botChats.map((chat: any) => (
                  <Card
                    key={chat.id}
                    className="p-4 hover-elevate cursor-pointer"
                    onClick={() => navigate(`/bot/${chat.id}`)}
                    data-testid={`card-bot-chat-${chat.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {chat.createdAt &&
                            format(new Date(chat.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Navigation />

      <main className="flex-1 ml-0 md:ml-64 relative flex flex-col h-full">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-background" />

        <header className="relative z-10 p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/bot")}
              data-testid="button-back-bot-list"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h2
                className="text-lg font-display font-bold truncate"
                data-testid="text-chat-title"
              >
                {chatData?.title || "Bot Chat"}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Partner
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleQuickFeedback("positive")}
              disabled={sendFeedback.isPending}
              data-testid="button-feedback-positive"
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleQuickFeedback("negative")}
              disabled={sendFeedback.isPending}
              data-testid="button-feedback-negative"
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
            <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="button-feedback-detail"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Give Feedback</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tell the bot how to improve. Your preferences are remembered
                    across sessions.
                  </p>
                  <Textarea
                    placeholder="e.g. Be more descriptive, use shorter responses, focus on dialogue..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    data-testid="input-feedback-text"
                  />
                  <Button
                    onClick={() =>
                      sendFeedback.mutate({
                        feedback: feedbackText,
                        chatId: chatId || undefined,
                      })
                    }
                    disabled={!feedbackText.trim() || sendFeedback.isPending}
                    data-testid="button-submit-feedback"
                  >
                    {sendFeedback.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Feedback
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div
          className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4"
          ref={scrollRef}
        >
          {chatLoading ? (
            <div className="flex justify-center pt-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isBot = msg.senderId === BOT_USER_ID;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-2xl",
                      isBot ? "" : "ml-auto flex-row-reverse"
                    )}
                    data-testid={`message-${msg.id}`}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback
                        className={
                          isBot
                            ? "bg-gradient-to-br from-primary to-accent text-white"
                            : ""
                        }
                      >
                        {isBot ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          (user as any)?.firstName?.charAt(0) || "U"
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={cn(
                        "flex flex-col gap-1",
                        isBot ? "items-start" : "items-end"
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {isBot ? "Bot" : "You"}
                        {msg.createdAt &&
                          ` · ${format(new Date(msg.createdAt), "h:mm a")}`}
                      </span>
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                          isBot
                            ? "bg-card border rounded-tl-none"
                            : "bg-primary text-primary-foreground rounded-tr-none"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {streamingText && (
                <div className="flex gap-3 max-w-2xl">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[10px] text-muted-foreground">
                      Bot · typing...
                    </span>
                    <div className="p-3 rounded-2xl rounded-tl-none text-sm leading-relaxed bg-card border whitespace-pre-wrap">
                      {streamingText}
                      <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && !streamingText && (
                <div className="flex gap-3 max-w-2xl">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-card border">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="relative z-10 p-4 bg-card/80 backdrop-blur-sm border-t">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-1 bg-muted/50 rounded-2xl border p-1 flex items-center">
              <Input
                className="bg-transparent border-none focus-visible:ring-0 min-h-[44px]"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                data-testid="input-bot-message"
              />
            </div>

            <Button
              size="icon"
              className="rounded-full h-12 w-12 shadow-lg shadow-primary/20"
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming}
              data-testid="button-send-bot"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
