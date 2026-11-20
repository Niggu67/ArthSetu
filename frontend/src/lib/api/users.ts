import { apiClient } from "./client";
import { User, UserUpdatePayload } from "@/types";

export const usersApi = {
  getById: async (id: number): Promise<User> => {
    return apiClient.get<User>(`/api/users/${id}`);
  },
  updateProfile: async (id: number, payload: UserUpdatePayload): Promise<User> => {
    return apiClient.patch<User>(`/api/users/${id}`, payload);
  },
};
