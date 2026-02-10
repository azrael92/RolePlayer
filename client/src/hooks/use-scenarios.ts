import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertScenario, InsertScene } from "@shared/schema";

export function useScenarios() {
  return useQuery({
    queryKey: [api.scenarios.list.path],
    queryFn: async () => {
      const res = await fetch(api.scenarios.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scenarios");
      return api.scenarios.list.responses[200].parse(await res.json());
    },
  });
}

export function useScenario(id: number) {
  return useQuery({
    queryKey: [api.scenarios.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.scenarios.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scenario");
      return api.scenarios.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertScenario) => {
      const validated = api.scenarios.create.input.parse(data);
      const res = await fetch(api.scenarios.create.path, {
        method: api.scenarios.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create scenario");
      return api.scenarios.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.scenarios.list.path] });
    },
  });
}

export function useCreateScene() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertScene) => {
      const validated = api.scenes.create.input.parse(data);
      const res = await fetch(api.scenes.create.path, {
        method: api.scenes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create scene");
      return api.scenes.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.scenarios.get.path, variables.scenarioId] });
    },
  });
}
