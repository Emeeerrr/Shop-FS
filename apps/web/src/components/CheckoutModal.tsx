import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Product } from "../types";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { wompiPublic } from "../lib/wompi";
import { getAcceptanceTokens } from "../services/api";
import { CircularProgress } from "@mui/material";

type Props = {
  open: boolean;
  product: Product | null;
  quantity: number;
  onClose: () => void;
  onCheckout: (data: CheckoutFormOutput) => Promise<void>;
  onToast: (t: { type: "success" | "error"; msg: string }) => void;
  loading?: boolean;
};

type AcceptanceTokens = {
  acceptance: { acceptance_token: string; permalink: string };
  personalDataAuth: { acceptance_token: string; permalink: string };
};

type CheckoutForm = {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardName: string;

  fullName: string;
  email: string;
  addressLine1: string;
};

export type CheckoutFormOutput = {
  productId: string;
  quantity: number;

  wompi: {
    cardToken: string;
    installments: number;
    acceptanceToken: string;
    acceptPersonalAuth: string;
  };

  paymentMeta: {
    brand: "VISA" | "MASTERCARD" | "UNKNOWN";
    last4: string;
    expMonth: number;
    expYear: number;
  };

  delivery: { fullName: string; email: string; addressLine1: string };
};

function detectBrand(cardNumber: string): "VISA" | "MASTERCARD" | "UNKNOWN" {
  const digits = cardNumber.replace(/\s+/g, "");
  if (/^4\d{6,}$/.test(digits)) return "VISA";
  if (/^(5[1-5]\d{5,}|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{3,})/.test(digits))
    return "MASTERCARD";
  return "UNKNOWN";
}

function luhnIsValid(cardNumber: string): boolean {
  const s = cardNumber.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(s)) return false;

  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = Number(s[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

async function tokenizeCard(params: {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}) {
    const expYear2 = params.expYear.slice(-2);
  const payload = {
    number: params.number.replace(/\s/g, ""),
    cvc: params.cvc,
    exp_month: params.expMonth.padStart(2, "0"),
    exp_year: expYear2,
    card_holder: params.cardHolder,
  };

  const res = await wompiPublic.post("/tokens/cards", payload);
  return res.data.data.id as string;
}

export function CheckoutModal({ open, product, quantity, onClose, onCheckout, onToast, loading }: Props) {
  const title = product ? `Pay for product ${product.name}` : "Checkout";

  const [tokens, setTokens] = useState<AcceptanceTokens | null>(null);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [acceptPersonal, setAcceptPersonal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const isBusy = submitting || !!loading;


  useEffect(() => {
    if (!open) return;

    setAcceptPolicy(false);
    setAcceptPersonal(false);

    (async () => {
      try {
        const t = await getAcceptanceTokens();
        setTokens(t);
      } catch {
        setTokens(null);
        onToast({ type: "error", msg: "Failed to load Wompi policies. Try again." });
      }
    })();
  }, [open, onToast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutForm>({
    defaultValues: {
      cardNumber: "",
      expMonth: "",
      expYear: "",
      cvc: "",
      cardName: "",
      fullName: "",
      email: "",
      addressLine1: "",
    },
  });

  const cardNumber = watch("cardNumber");
  const brand = useMemo(() => detectBrand(cardNumber ?? ""), [cardNumber]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const value = String(i + 1).padStart(2, "0");
    return { value, label: value };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => {
    const y = String(currentYear + i);
    return { value: y, label: y };
  });

  const onSubmit = async (values: CheckoutForm) => {
    if (!product) return;

    if (!tokens) {
      onToast({ type: "error", msg: "Wompi tokens not loaded yet. Try again." });
      return;
    }

    if (!acceptPolicy || !acceptPersonal) {
      onToast({ type: "error", msg: "You must accept terms and personal data policy." });
      document.getElementById("wompi-policies")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const digits = values.cardNumber.replace(/\s+/g, "");
    const last4 = digits.slice(-4);

    try {
      setSubmitting(true);

      const cardToken = await tokenizeCard({
        number: digits,
        cvc: values.cvc,
        expMonth: values.expMonth,
        expYear: values.expYear,
        cardHolder: values.cardName,
      });

      await onCheckout({
        productId: product.id,
        quantity,
        wompi: {
          cardToken,
          installments: 1,
          acceptanceToken: tokens.acceptance.acceptance_token,
          acceptPersonalAuth: tokens.personalDataAuth.acceptance_token,
        },
        paymentMeta: {
          brand,
          last4,
          expMonth: Number(values.expMonth),
          expYear: Number(values.expYear),
        },
        delivery: {
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          addressLine1: values.addressLine1.trim(),
        },
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.reason ||
        e?.response?.data?.error?.message ||
        "Card tokenization failed";
      onToast({ type: "error", msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 900,
        }}
      >
        {title}
        <IconButton onClick={isBusy ? undefined : onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography fontWeight={800}>Payment Information</Typography>

          <TextField
            label={`Credit Card ${brand !== "UNKNOWN" ? `(${brand})` : ""}`}
            placeholder="1234 5678 9012 3456"
            {...register("cardNumber", {
              required: "Card number is required",
              validate: (v) => luhnIsValid(v) || "Invalid card number (Luhn)",
            })}
            error={!!errors.cardNumber}
            helperText={errors.cardNumber?.message ?? " "}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Select a month"
              defaultValue=""
              {...register("expMonth", {
                required: "Month required",
                validate: (v) => {
                  const n = Number(v);
                  return (n >= 1 && n <= 12) || "Invalid month";
                },
              })}
              error={!!errors.expMonth}
              helperText={errors.expMonth?.message ?? " "}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="" disabled>
                Select a month
              </option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </TextField>

            <TextField
              select
              label="Select a year"
              defaultValue=""
              {...register("expYear", {
                required: "Year required",
                validate: (v) => /^\d{4}$/.test(v) || "Invalid year",
              })}
              error={!!errors.expYear}
              helperText={errors.expYear?.message ?? " "}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="" disabled>
                Select a year
              </option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </TextField>

            <TextField
              label="CVC"
              placeholder="123"
              {...register("cvc", {
                required: "CVC required",
                validate: (v) => /^\d{3,4}$/.test(v) || "Invalid CVC",
              })}
              error={!!errors.cvc}
              helperText={errors.cvc?.message ?? " "}
              fullWidth
            />
          </Stack>

          <TextField
            label="Name on Card"
            placeholder="John Doe"
            {...register("cardName", { required: "Name required" })}
            error={!!errors.cardName}
            helperText={errors.cardName?.message ?? " "}
          />

          <Typography fontWeight={800} sx={{ mt: 1 }}>
            Delivery Information
          </Typography>

          <TextField
            label="Customer Full Name"
            placeholder="Enter your full name"
            {...register("fullName", { required: "Full name required" })}
            error={!!errors.fullName}
            helperText={errors.fullName?.message ?? " "}
          />
          <TextField
            label="Customer Email"
            placeholder="Enter your email"
            {...register("email", {
              required: "Email required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email",
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message ?? " "}
          />
          <TextField
            label="Delivery address"
            placeholder="Enter your address"
            {...register("addressLine1", { required: "Address required" })}
            error={!!errors.addressLine1}
            helperText={errors.addressLine1?.message ?? " "}
          />

          {tokens ? (
            <Stack spacing={1} id="wompi-policies">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptPolicy}
                    onChange={(e) => setAcceptPolicy(e.target.checked)}
                  />
                }
                label={
                  <span>
                    I accept{" "}
                    <Link href={tokens.acceptance.permalink} target="_blank" rel="noreferrer">
                      terms & conditions
                    </Link>
                  </span>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptPersonal}
                    onChange={(e) => setAcceptPersonal(e.target.checked)}
                  />
                }
                label={
                  <span>
                    I accept{" "}
                    <Link
                      href={tokens.personalDataAuth.permalink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      personal data policy
                    </Link>
                  </span>
                }
              />
            </Stack>
          ) : null}
          
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center', gap: 2, pt: 3 }}>
            <Button
                variant="contained"
                onClick={handleSubmit(onSubmit)}
                disabled={isBusy}
                startIcon={isBusy ? <CircularProgress size={18} /> : null}
                sx={{ borderRadius: 999, px: 4 }}
                >
                {isBusy ? "Processing..." : "Checkout"}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
