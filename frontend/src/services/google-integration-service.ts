import { api } from "@/lib/api";
import { isAxiosError } from "axios";

export type GoogleIntegrationStatus = {
  connected: boolean;
  calendarId: string | null;
  backend: {
    enabled: boolean;
    oauthConfigured: boolean;
    encryptionKeyConfigured: boolean;
    issues: string[];
  };
};

export const googleIntegrationService = {
  async getStatus() {
    try {
      const res = await api.get<GoogleIntegrationStatus>(
        "/integrations/google/status"
      );
      return { data: res.data, error: null } as const;
    } catch (err: unknown) {
      let message = "Não foi possível carregar o status do Google Calendar.";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return { data: null, error: message } as const;
    }
  },

  async startOAuth() {
    const res = await api.get<{ authUrl: string }>(
      "/integrations/google/oauth/start"
    );
    if (!res.data) throw new Error("Resposta inválida do servidor ao iniciar OAuth");
    return res.data.authUrl;
  },

  async disconnect() {
    try {
      await api.delete("/integrations/google/disconnect");
      return { ok: true, error: null } as const;
    } catch (err: unknown) {
      let message = "Não foi possível desconectar o Google Calendar.";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return { ok: false, error: message } as const;
    }
  },
};
