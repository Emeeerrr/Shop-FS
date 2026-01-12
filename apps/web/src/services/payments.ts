import { api } from './api';

export async function pay(payload: { productId: string; quantity: number; cardNumber: string }) {
  const { data } = await api.post('/payments', payload);
  return data as { status: 'SUCCESS' | 'FAILED'; productId: string; quantity: number };
}
