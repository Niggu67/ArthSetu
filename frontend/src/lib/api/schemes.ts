import { apiClient } from "./client";
import { Scheme, SchemeListResponse } from "@/types";

export const schemesApi = {
  list: async (category?: string, search?: string): Promise<SchemeListResponse> => {
    return apiClient.get<SchemeListResponse>("/api/schemes", {
      params: { category, search },
    });
  },
  getById: async (id: number): Promise<Scheme> => {
    return apiClient.get<Scheme>(`/api/schemes/${id}`);
  },
};
