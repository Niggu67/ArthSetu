import { apiClient } from "./client";
import { UserProgress } from "@/types";

export interface RecordProgressPayload {
  user_id: number;
  module_id: string;
  completion_status?: "not_started" | "in_progress" | "completed";
  completion_percentage: number;
  completed_at?: string;
}

export const progressApi = {
  getByUserId: async (userId: number): Promise<UserProgress[]> => {
    return apiClient.get<UserProgress[]>(`/api/progress/${userId}`);
  },
  record: async (payload: RecordProgressPayload): Promise<UserProgress> => {
    return apiClient.post<UserProgress>("/api/progress", payload);
  },
};
