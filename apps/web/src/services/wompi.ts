import axios from "axios";

const WOMPI_BASE_URL = import.meta.env.VITE_WOMPI_BASE_URL;
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY;

export async function tokenizeCard(input: {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}) {
  const { data } = await axios.post(
    `${WOMPI_BASE_URL}/tokens/cards`,
    input,
    { headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` } }
  );

  return {
    token: data?.data?.id as string,
    brand: data?.data?.brand as string,
    last4: data?.data?.last_four as string,
  };
}
