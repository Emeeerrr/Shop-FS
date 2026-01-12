import { Drawer, Box, Typography, IconButton, Card, CardMedia, Stack, Button, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Product } from '../types';
import { BASE_FEE_CENTS, DELIVERY_FEE_CENTS } from '../config/fees';
import { formatCOPFromCents } from '../utils/money';

type Props = {
  open: boolean;
  product: Product | null;
  quantity: number;
  onClose: () => void;
  onPay: () => void;
};

export function SummaryPayment({ open, product, quantity, onClose, onPay }: Props) {
  if (!product) return null;

  const unitPrice = product.priceCents;
  const productAmount = unitPrice * quantity;
  const total = productAmount + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 2, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography fontWeight={900}>Summary payment</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <Card sx={{ borderRadius: 4, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CardMedia
            component="img"
            image={product.imageUrl}
            alt={product.name}
            sx={{ width: 140, height: 120, borderRadius: 3, objectFit: 'cover' }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={900} sx={{ textTransform: 'uppercase' }}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">{product.description}</Typography>

            <Box sx={{ mt: 2 }}>
              <Typography fontWeight={800}>Product amount:</Typography>
              <Typography variant="h6" fontWeight={900}>
                {formatCOPFromCents(productAmount)}
              </Typography>

              <Stack spacing={0.8} sx={{ mt: 1.5 }}>
                <Typography color="text.secondary">Base fee: {formatCOPFromCents(BASE_FEE_CENTS)}</Typography>
                <Typography color="text.secondary">Delivery fee: {formatCOPFromCents(DELIVERY_FEE_CENTS)}</Typography>
                <Divider />
                <Typography color="text.secondary">Total price: {formatCOPFromCents(total)}</Typography>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Card>

      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 3 }}>
        <Button color="error" variant="text" onClick={onClose}>Close</Button>
        <Button variant="contained" sx={{ borderRadius: 999, px: 4 }} onClick={onPay}>
          Pay
        </Button>
      </Box>
    </Drawer>
  );
}
