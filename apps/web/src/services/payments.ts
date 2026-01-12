// import { api } from "./api";

// export async function pay(input: {
//   productId: string;
//   quantity: number;

//   customer: { fullName: string; email: string };
//   delivery: { addressLine1: string };

//   wompi: {
//     cardToken: string;
//     installments: number;
//     acceptanceToken: string;
//     acceptPersonalAuth: string;
//   };
// }) {
//   const { data } = await api.post("/payments", input);
//   return data as {
//     transactionId: string;
//     reference: string;
//     status: "APPROVED" | "DECLINED" | "ERROR";
//     wompiTransactionId: string;
//     wompiStatus: string;
//   };
// }


import { api } from "./api";

export type PayDto = {
  productId: string;
  quantity: number;
  customer: { fullName: string; email: string };
  delivery: { addressLine1: string };
  wompi: {
    cardToken: string;
    installments: number;
    acceptanceToken: string;
    acceptPersonalAuth: string;
  };
};

export type PayResponse = {
  transactionId: string;
  reference: string;
  wompiTransactionId: string;
  status: "APPROVED" | "DECLINED" | "ERROR";
  wompiStatus: string;
};

export async function pay(input: PayDto) {
  const { data } = await api.post("/payments", input);
  return data as PayResponse;
}
