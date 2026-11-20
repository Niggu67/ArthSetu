import { apiClient } from "./client";
import { AIChatRequest, AIChatResponse } from "@/types";

export const aiApi = {
  chat: (payload: AIChatRequest): Promise<AIChatResponse> =>
    apiClient.post<AIChatResponse>("/api/ai/chat", payload),
};
