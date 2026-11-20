import { apiClient } from "./client";
import {
  AuthResponse,
  RegistrationResponse,
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthMessageResponse,
  User,
} from "@/types";

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/api/auth/login", payload);
  },
  register: async (payload: RegisterPayload): Promise<RegistrationResponse> => {
    return apiClient.post<RegistrationResponse>("/api/auth/register", payload);
  },
  verifyEmail: async (payload: VerifyEmailPayload): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/api/auth/verify-email", payload);
  },
  resendVerification: async (payload: ResendVerificationPayload): Promise<AuthMessageResponse> => {
    return apiClient.post<AuthMessageResponse>("/api/auth/resend-verification", payload);
  },
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<AuthMessageResponse> => {
    return apiClient.post<AuthMessageResponse>("/api/auth/forgot-password", payload);
  },
  resetPassword: async (payload: ResetPasswordPayload): Promise<AuthMessageResponse> => {
    return apiClient.post<AuthMessageResponse>("/api/auth/reset-password", payload);
  },
  getMe: async (): Promise<User> => {
    return apiClient.get<User>("/api/auth/me");
  },
};

