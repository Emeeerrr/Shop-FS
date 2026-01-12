import axios from "axios";

export const wompiPublic = axios.create({
  baseURL: import.meta.env.VITE_WOMPI_BASE_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_WOMPI_PUBLIC_KEY}`,
    "Content-Type": "application/json",
  },
});

export type CardTokenResponse = {
  data: {
    id: string;
    brand: string;
    last_four: string;
    exp_month: string;
    exp_year: string;
  };
};
