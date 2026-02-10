import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAvatar, InsertContact } from "@shared/schema";
import { z } from "zod";

// CONTACTS
export function useContacts() {
  return useQuery({
    queryKey: [api.contacts.list.path],
    queryFn: async () => {
      const res = await fetch(api.contacts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return api.contacts.list.responses[200].parse(await res.json());
    },
  });
}

export function useInviteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { username: string }) => {
      const res = await fetch(api.contacts.invite.path, {
        method: api.contacts.invite.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("User not found");
        throw new Error("Failed to invite contact");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
    },
  });
}

export function useUpdateContactStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'accepted' | 'blocked' }) => {
      const url = buildUrl(api.contacts.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.contacts.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.contacts.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
    },
  });
}

// AVATARS
export function useAvatars() {
  return useQuery({
    queryKey: [api.avatars.list.path],
    queryFn: async () => {
      const res = await fetch(api.avatars.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch avatars");
      return api.avatars.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAvatar) => {
      const validated = api.avatars.create.input.parse(data);
      const res = await fetch(api.avatars.create.path, {
        method: api.avatars.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create avatar");
      return api.avatars.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.avatars.list.path] });
    },
  });
}

// LIBRARY
export function useLibrary() {
  return useQuery({
    queryKey: [api.library.list.path],
    queryFn: async () => {
      const res = await fetch(api.library.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch library");
      return api.library.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLibraryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.library.create.input>) => {
      const validated = api.library.create.input.parse(data);
      const res = await fetch(api.library.create.path, {
        method: api.library.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add to library");
      return api.library.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.library.list.path] });
    },
  });
}

// USER PROFILE
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.users.update.input>) => {
      const res = await fetch(api.users.update.path, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}
