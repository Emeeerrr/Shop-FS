import { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";

import { fetchProducts } from "../services/products";
import type { Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import {
  CheckoutModal,
  type CheckoutFormOutput,
} from "../components/CheckoutModal";
import { getAcceptanceTokens } from "../services/api";
import { pay } from "../services/payments";
import { SummaryPayment } from "../components/SummaryPayment";

type AcceptanceState = {
  acceptanceToken: string;
  personalAuthToken: string;
  acceptancePermalink: string;
  personalAuthPermalink: string;
};

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<{
    product: Product;
    quantity: number;
  } | null>(null);

  const [acceptance, setAcceptance] = useState<AcceptanceState | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [draft, setDraft] = useState<CheckoutFormOutput | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [checkingOut, setCheckingOut] = useState(false);
  const [paying, setPaying] = useState(false);

  async function refreshProducts() {
    try {
      const fresh = await fetchProducts();
      setProducts(fresh);
      setError(null);
    } catch {
      setError("Failed to load products");
    }
  }

  async function loadAcceptanceTokens() {
    try {
      const t = await getAcceptanceTokens();
      setAcceptance({
        acceptanceToken: t.acceptance.acceptance_token,
        personalAuthToken: t.personalDataAuth.acceptance_token,
        acceptancePermalink: t.acceptance.permalink,
        personalAuthPermalink: t.personalDataAuth.permalink,
      });
    } catch {
      // si esto falla, no podrás pagar, así que lo mostramos claro
      setToast({
        type: "error",
        msg: "Failed to load Wompi acceptance tokens",
      });
    }
  }

  useEffect(() => {
    (async () => {
      await Promise.all([refreshProducts(), loadAcceptanceTokens()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckout = async (payloadFromModal: CheckoutFormOutput) => {
    setCheckingOut(true);
    try {
      setDraft(payloadFromModal);
      setSelected(null);

      // deja respirar al render para que el modal cierre antes del summary
      await new Promise((r) => setTimeout(r, 0));

      setSummaryOpen(true);
    } finally {
      setCheckingOut(false);
    }
  };

  const handlePay = async () => {
    try {
      if (!draft) return;

      if (!acceptance) {
        setToast({ type: "error", msg: "Acceptance tokens not loaded yet. Try again." });
        return;
      }

      setPaying(true);

      const dto = {
        productId: draft.productId,
        quantity: draft.quantity,
        customer: {
          fullName: draft.delivery.fullName,
          email: draft.delivery.email,
        },
        delivery: { addressLine1: draft.delivery.addressLine1 },
        wompi: {
          cardToken: draft.wompi.cardToken,
          installments: draft.wompi.installments,
          acceptanceToken: acceptance.acceptanceToken,
          acceptPersonalAuth: acceptance.personalAuthToken,
        },
      };

      const res = await pay(dto);

      setSummaryOpen(false);
      setDraft(null);

      if (res.status === "APPROVED") {
        setToast({ type: "success", msg: "Your payment has been processed successfully." });
        await refreshProducts();
      } else {
        setToast({ type: "error", msg: `Failed to process payment (${res.status ?? "UNKNOWN"})` });
      }
    } catch (e: any) {
      setSummaryOpen(false);
      const msg = e?.response?.data?.message || e?.message || "Failed to process payment";
      setToast({ type: "error", msg });
    } finally {
      setPaying(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{
      py: 8,
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Typography
        variant="h3"
        align="center"
        sx={{
          mb: 1.5,
          fontWeight: 900,
          letterSpacing: 1,
          textTransform: "uppercase",
          background: "linear-gradient(90deg, #111827, #6b7280)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Emerson&apos;s Coffee Shop
      </Typography>

      <Typography
        variant="body2"
        align="center"
        sx={{ mb: 3, color: "text.secondary" }}
      >
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
                onPay={(product, quantity) =>
                  setSelected({ product, quantity })
                }
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
        onCheckout={handleCheckout}
        onToast={setToast}
        loading={checkingOut}
      />

      <SummaryPayment
        open={summaryOpen}
        product={draft ? products.find(p => p.id === draft.productId) ?? null : null}
        quantity={draft?.quantity ?? 1}
        onClose={() => setSummaryOpen(false)}
        onPay={handlePay}
        loading={paying}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {toast ? (
          <MuiAlert
            severity={toast.type}
            onClose={() => setToast(null)}
            sx={{ borderRadius: 3, px: 2 }}
          >
            <b>
              {toast.type === "success"
                ? "Payment Successful"
                : "Payment Failed"}
            </b>
            <div>{toast.msg}</div>
          </MuiAlert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
