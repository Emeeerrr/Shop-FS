import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';

import { fetchProducts } from '../services/products';

import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { CheckoutModal, type CheckoutFormOutput } from '../components/CheckoutModal';
import { SummaryPayment } from '../components/SummaryPayment';
import { pay } from '../services/payments';

type Draft = {
  product: Product;
  quantity: number;
  checkout: CheckoutFormOutput;

  cardLast4: string;
  cardNumberDigits: string;
};


export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<{ product: Product; quantity: number } | null>(null);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function refreshProducts() {
    try {
      const fresh = await fetchProducts();
      setProducts(fresh);
    } catch {
      setError('Failed to load products');
    }
  }

  useEffect(() => {
    refreshProducts().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography
        variant="h3"
        align="center"
        sx={{
          mb: 1.5,
          fontWeight: 900,
          letterSpacing: 1,
          textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #111827, #6b7280)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Emerson&apos;s Coffee Shop
      </Typography>

      <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
        Café de especialidad ☕
      </Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Grid container spacing={2}>
          {products.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <ProductCard
                product={p}
                onPay={(product, quantity) => setSelected({ product, quantity })}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <CheckoutModal
        open={!!selected}
        product={selected?.product ?? null}
        quantity={selected?.quantity ?? 1}
        onClose={() => setSelected(null)}
        onCheckout={(data) => {
          // data: CheckoutFormOutput
          const product = products.find((p) => p.id === data.productId);
          if (!product) return;

          const last4 = data.paymentMeta.last4;

          setDraft({
            product,
            quantity: data.quantity,
            checkout: data,
            cardLast4: data.paymentMeta.last4,
            cardNumberDigits: data.cardNumberDigits,
        });

          setSelected(null);
          setSummaryOpen(true);
        }}
      />

      <SummaryPayment
        open={summaryOpen}
        product={draft?.product ?? null}
        quantity={draft?.quantity ?? 1}
        onClose={() => setSummaryOpen(false)}
        onPay={async () => {
          if (!draft) return;

          try {
            const res = await pay({
              productId: draft.product.id,
              quantity: draft.quantity,
              cardNumber: draft.cardNumberDigits,
            });

            setSummaryOpen(false);

            if (res.status === 'SUCCESS') {
              setToast({ type: 'success', msg: 'Your payment has been processed successfully.' });
              await refreshProducts();
            } else {
              setToast({ type: 'error', msg: 'Failed to process payment' });
            }
          } catch {
            setSummaryOpen(false);
            setToast({ type: 'error', msg: 'Failed to process payment' });
          }
        }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {toast ? (
          <MuiAlert
            severity={toast.type}
            onClose={() => setToast(null)}
            sx={{ borderRadius: 3, px: 2 }}
          >
            <b>{toast.type === 'success' ? 'Payment Successful' : 'Payment Failed'}</b>
            <div>{toast.msg}</div>
          </MuiAlert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
