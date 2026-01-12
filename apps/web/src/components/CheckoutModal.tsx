import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Stack,
    TextField,
    Button,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Product } from "../types";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

type Props = {
    open: boolean;
    product: Product | null;
    quantity: number;
    onClose: () => void;
    onCheckout: (data: CheckoutFormOutput) => void;
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

  // ✅ solo para enviar al backend (en este challenge)
  cardNumberDigits: string;

  // 👇 meta NO sensible (para UI/resumen)
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

// Luhn check (básico y suficiente para validación)
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

export function CheckoutModal({
    open,
    product,
    quantity,
    onClose,
    onCheckout,
}: Props) {
    const title = product ? `Pay for product ${product.name}` : "Checkout";

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
        const value = String(i + 1).padStart(2, '0');
        return { value, label: value };
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => {
        const y = String(currentYear + i);
        return { value: y, label: y };
    });


    const onSubmit = (values: CheckoutForm) => {
        if (!product) return;

        const digits = values.cardNumber.replace(/\s+/g, "");
        const last4 = digits.slice(-4);

        onCheckout({
            productId: product.id,
            quantity,
            cardNumberDigits: digits,
            paymentMeta: { brand, last4, expMonth: Number(values.expMonth), expYear: Number(values.expYear) },
            delivery: {
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                addressLine1: values.addressLine1.trim(),
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 900
                }}
            >
                {title}
                <IconButton onClick={onClose}>
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
                            {...register('expMonth', {
                                required: 'Month required',
                                validate: (v) => {
                                    const n = Number(v);
                                    return (n >= 1 && n <= 12) || 'Invalid month';
                                },
                            })}
                            error={!!errors.expMonth}
                            helperText={errors.expMonth?.message ?? ' '}
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
                            {...register('expYear', {
                                required: 'Year required',
                                validate: (v) => /^\d{4}$/.test(v) || 'Invalid year',
                            })}
                            error={!!errors.expYear}
                            helperText={errors.expYear?.message ?? ' '}
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

                    <Button
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    sx={{
                        borderRadius: 999,
                        mt: 1,
                        alignSelf: 'center',
                        px: 4,
                        textTransform: 'none',
                        fontWeight: 700,
                    }}
                    >
                        Checkout
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
