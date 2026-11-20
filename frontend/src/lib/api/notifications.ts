import { apiClient } from "./client";
import { Notification } from "@/types";

export const notificationsApi = {
  getByUserId: async (userId: number): Promise<Notification[]> => {
    return apiClient.get<Notification[]>(`/api/notifications/${userId}`);
  },
  markAsRead: async (id: number): Promise<Notification> => {
    return apiClient.patch<Notification>(`/api/notifications/${id}/read`);
  },
};
