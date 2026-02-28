import { useMutation } from "@tanstack/react-query";
import { api, type PillIdRequest, type PillIdResponse } from "@shared/routes";

export function useIdentifyPill() {
  return useMutation({
    mutationFn: async (data: PillIdRequest): Promise<PillIdResponse> => {
      const validated = api.ai.identifyPill.input.parse(data);
      
      const res = await fetch(api.ai.identifyPill.path, {
        method: api.ai.identifyPill.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.ai.identifyPill.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Falha ao identificar o comprimido. Tente novamente.");
      }

      return api.ai.identifyPill.responses[200].parse(await res.json());
    },
  });
}
