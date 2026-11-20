const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function fetchApi<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...customOptions } = options;

  let url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  // Attach token from localStorage if in client environment
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("arthsetu_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (data?.detail) {
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // FastAPI Pydantic validation error array
          errorMessage = data.detail.map((err: any) => err.msg || "Invalid field").join(", ");
        }
      }

      // Handle 401 unauthorized (clearing token if expired)
      if (response.status === 401 && typeof window !== "undefined") {
        if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/register")) {
          localStorage.removeItem("arthsetu_token");
          localStorage.removeItem("arthsetu_user");
        }
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || "Failed to communicate with ArthSetu backend. Check server connectivity.",
      0
    );
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};
