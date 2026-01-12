export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  stock?: { unitsAvailable: number };
};
