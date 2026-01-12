import { api } from './api';
import type { Product } from '../types';

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/products');
  return data;
}
