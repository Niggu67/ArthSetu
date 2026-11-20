export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  is_verified?: boolean;
  verified_at?: string | null;
  language_preference: string;
  business_name?: string | null;
  business_type?: string | null;
  location?: string | null;
  annual_income?: number | null;
  years_in_business?: number | null;
  financial_goals?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegistrationResponse {
  message: string;
  email: string;
  is_verified: boolean;
  requires_verification?: boolean;
  user: User;
}

export interface LoginPayload {
  identifier?: string;
  email_or_phone?: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  language_preference?: string;
  business_name?: string;
  business_type?: string;
  location?: string;
  annual_income?: number;
  years_in_business?: number;
  financial_goals?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  new_password: string;
}

export interface AuthMessageResponse {
  message: string;
  email?: string;
  pending_verification?: boolean;
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  language_preference?: string;
  business_name?: string;
  business_type?: string;
  location?: string;
  annual_income?: number;
  years_in_business?: number;
  financial_goals?: string;
}

export interface Scheme {
  id: number;
  name: string;
  description: string;
  category: string;
  eligibility_criteria: Record<string, any>;
  benefits: string;
  required_documents: string[];
  official_link: string;
  created_at: string;
}

export interface SchemeListResponse {
  total: number;
  schemes: Scheme[];
  disclaimer: string;
}

export interface UserProgress {
  id: number;
  user_id: number;
  module_id: string;
  completion_status: "not_started" | "in_progress" | "completed";
  completion_percentage: number;
  completed_at?: string | null;
}

export interface Application {
  id: number;
  user_id: number;
  scheme_id: number;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  notes?: string | null;
  created_at: string;
  updated_at: string;
  scheme?: Scheme;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read_status: boolean;
  created_at: string;
}

export type SupportedLanguage = "en" | "hi" | "mr";

// Types matching Eligibility API contract
export interface EligibilityCheckRequest {
  user_id?: number | null;
  business_type?: string | null;
  annual_income?: number | null;
  years_in_business?: number | null;
  location?: string | null;
  gender?: string | null;
  social_category?: string | null;
  scheme_id?: number | null;
}

export interface SchemeEligibilityDetail {
  scheme_id: number;
  scheme_name: string;
  category: string;
  eligibility_score: number;
  is_eligible: boolean;
  reasons: string[];
  missing_requirements: string[];
  required_documents: string[];
  official_link: string;
}

export interface EligibilityCheckResponse {
  overall_eligibility_score: number;
  potentially_eligible_schemes: SchemeEligibilityDetail[];
  reasons: string[];
  missing_requirements: string[];
  required_documents: string[];
  disclaimer: string;
}

export interface LearningModule {
  id: string;
  title: string;
  category: string;
  description: string;
  realWorldExample: string;
  keyTakeaway: string;
  readTime: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  suggested_actions?: AISuggestedAction[];
}

export interface AISuggestedAction {
  type: string;
  label: string;
  href: string;
  scheme_id?: number | null;
}

export interface AIChatRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  language?: string;
}

export interface AIChatResponse {
  assistant_message: string;
  relevant_scheme_ids: number[];
  suggested_actions: AISuggestedAction[];
  disclaimer: string;
}
