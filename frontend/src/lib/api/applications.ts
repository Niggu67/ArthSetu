import { apiClient } from "./client";
import { Application } from "@/types";

export interface CreateApplicationPayload {
  user_id: number;
  scheme_id: number;
  status?: string;
  notes?: string;
}

export interface UpdateApplicationPayload {
  status?: string;
  notes?: string;
}

export const applicationsApi = {
  getByUserId: async (userId: number): Promise<Application[]> => {
    return apiClient.get<Application[]>(`/api/applications/${userId}`);
  },
  create: async (payload: CreateApplicationPayload): Promise<Application> => {
    return apiClient.post<Application>("/api/applications", payload);
  },
  update: async (id: number, payload: UpdateApplicationPayload): Promise<Application> => {
    return apiClient.patch<Application>(`/api/applications/${id}`, payload);
  },
};
