import { apiClient } from "./client";
import { EligibilityCheckRequest, EligibilityCheckResponse } from "@/types";

export const eligibilityApi = {
  check: async (payload: EligibilityCheckRequest): Promise<EligibilityCheckResponse> => {
    return apiClient.post<EligibilityCheckResponse>("/api/eligibility", payload);
  },
};
