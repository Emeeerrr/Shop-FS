import { useMemo, useState } from 'react';
import type { Product } from '../types';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Stack,
  Button,
  TextField,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';

type Props = {
  product: Product;
  onPay: (product: Product, quantity: number) => void;
};

export function ProductCard({ product, onPay }: Props) {
  const stock = product.stock?.unitsAvailable ?? 0;

  const [quantity, setQuantity] = useState<number>(1);

  const max = useMemo(() => Math.max(stock, 0), [stock]);

  const isOutOfStock = stock <= 0;
  const isInvalidQty = quantity < 1 || quantity > stock;

  const priceLabel = useMemo(() => {
    const value = product.priceCents / 100;
    return `${value.toLocaleString('es-CO')} ${product.currency}`;
  }, [product.priceCents, product.currency]);

  return (
    <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="190"
        image={product.imageUrl}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {product.description}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="h6" fontWeight={800}>
            ${priceLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stock: {stock}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
          <TextField
            label="Qty"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            size="small"
            inputProps={{ min: 1, max, step: 1 }}
            sx={{ width: 110 }}
            error={!isOutOfStock && isInvalidQty}
            helperText={!isOutOfStock && isInvalidQty ? `1 - ${stock}` : ' '}
            disabled={isOutOfStock}
          />

          <Button
            variant="contained"
            fullWidth
            endIcon={<CreditCardIcon />}
            disabled={isOutOfStock || isInvalidQty}
            onClick={() => onPay(product, quantity)}
            sx={{ borderRadius: 999 }}
          >
            Pay with credit card
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
