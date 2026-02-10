import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useChats() {
  return useQuery({
    queryKey: [api.chats.list.path],
    queryFn: async () => {
      const res = await fetch(api.chats.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chats");
      return api.chats.list.responses[200].parse(await res.json());
    },
  });
}

export function useChat(id: number) {
  return useQuery({
    queryKey: [api.chats.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.chats.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chat");
      return api.chats.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
    refetchInterval: 5000, // Poll for messages every 5s for now (websocket is ideal but complex)
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.chats.create.input>) => {
      const validated = api.chats.create.input.parse(data);
      const res = await fetch(api.chats.create.path, {
        method: api.chats.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create chat");
      return api.chats.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
    },
  });
}

export function useChatMessages(chatId: number) {
  return useQuery({
    queryKey: [api.chats.messages.list.path, chatId],
    queryFn: async () => {
      const url = buildUrl(api.chats.messages.list.path, { id: chatId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.chats.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });
}

export function useSendMessage(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.chats.messages.create.input>) => {
      const validated = api.chats.messages.create.input.parse(data);
      const url = buildUrl(api.chats.messages.create.path, { id: chatId });
      const res = await fetch(url, {
        method: api.chats.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.chats.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chats.messages.list.path, chatId] });
      queryClient.invalidateQueries({ queryKey: [api.chats.get.path, chatId] });
    },
  });
}
