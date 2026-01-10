import axios, { AxiosInstance, AxiosError } from "axios";

// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const isLocal =
  typeof window !== "undefined" && window.location.hostname === "localhost";

// Se for local, aponta para "/api-proxy", senão tenta pegar a env var ou usa a URL direta(apagar dps)
const API_URL = isLocal
  ? "http://localhost:3000/api-proxy"
  : process.env.NEXT_PUBLIC_API_URL || "https://study-helper-lip.onrender.com";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  statusCode?: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      withCredentials: true, // CRÍTICO: Envia cookies automaticamente
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";
        const shouldSkipRedirect = [
          "/auth/change-password",
          "/auth/change-email",
        ].some((path) => requestUrl.includes(path));

        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "";
        const isAuthRoute =
          currentPath.includes("/login") || currentPath.includes("/register");
        const isHomeRoute = currentPath === "/";

        if (status === 401 && !shouldSkipRedirect && currentPath) {
          // Token inválido/expirado - redireciona para login, exceto em rotas públicas
          if (!isAuthRoute && !isHomeRoute) {
            window.location.href = "/login";
          }
        }

        const message =
          (error.response?.data as { message?: string })?.message ||
          error.message ||
          "Erro desconhecido";

        return Promise.reject({
          statusCode: status,
          message,
        });
      }
    );
  }

  private handleError(error: unknown) {
    if (typeof error === "object" && error && "message" in error) {
      const { message, statusCode } = error as {
        message: string;
        statusCode?: number;
      };
      return { message, statusCode };
    }
    if (axios.isAxiosError(error)) {
      return {
        message:
          error.response?.data?.message || error.message || "Erro desconhecido",
        statusCode: error.response?.status,
      };
    }
    return {
      message: error instanceof Error ? error.message : "Erro de conexão",
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(endpoint);
      return { data: response.data };
    } catch (error) {
      const { message, statusCode } = this.handleError(error);
      return { error: message, statusCode };
    }
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(endpoint, body);
      return { data: response.data };
    } catch (error) {
      const { message, statusCode } = this.handleError(error);
      return { error: message, statusCode };
    }
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(endpoint, body);
      return { data: response.data };
    } catch (error) {
      const { message, statusCode } = this.handleError(error);
      return { error: message, statusCode };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(endpoint);
      return { data: response.data };
    } catch (error) {
      const { message, statusCode } = this.handleError(error);
      return { error: message, statusCode };
    }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(endpoint, body);
      return { data: response.data };
    } catch (error) {
      const { message, statusCode } = this.handleError(error);
      return { error: message, statusCode };
    }
  }
}

export const api = new ApiClient(API_URL);
