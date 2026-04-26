import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useProducts(filters?: { search?: string; disease?: string }) {
  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      const url = new URL(api.products.list.path, window.location.origin);
      if (filters?.search) url.searchParams.append('search', filters.search);
      if (filters?.disease) url.searchParams.append('disease', filters.disease);

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar produtos");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Falha ao buscar produto");
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
