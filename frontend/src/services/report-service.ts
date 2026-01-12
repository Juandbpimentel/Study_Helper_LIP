import axios from "axios";
import { getAccessToken } from "@/lib/token";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/g, "");
const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
);

export const reportService = {
  async downloadResumoPdf(
    params?: Record<string, string | number | undefined>
  ) {
    const token = getAccessToken();
    const response = await axios.get<Blob>(
      `${API_BASE_URL}/relatorios/resumo/pdf`,
      {
        responseType: "blob",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        params,
      }
    );
    return response.data;
  },
};
