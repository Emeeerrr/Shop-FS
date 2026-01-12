import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function getAcceptanceTokens() {
  const { data } = await api.get("/wompi/acceptance-tokens");
  return data as {
    acceptance: { acceptance_token: string; permalink: string };
    personalDataAuth: { acceptance_token: string; permalink: string };
  };
}
