import { Injectable } from "@nestjs/common";
import axios from "axios";
import crypto from "crypto";

@Injectable()
export class WompiService {
  private baseUrl = process.env.WOMPI_BASE_URL!;
  private publicKey = process.env.WOMPI_PUBLIC_KEY!;
  private privateKey = process.env.WOMPI_PRIVATE_KEY!;
  private integrity = process.env.WOMPI_INTEGRITY_SECRET!;

  // Cliente PRIVADO (para crear y consultar transacciones)
  private privateClient = axios.create({
    baseURL: this.baseUrl,
    headers: {
      Authorization: `Bearer ${this.privateKey}`,
      "Content-Type": "application/json",
    },
  });

  // Cliente PÚBLICO (para merchants / acceptance tokens)
  private publicClient = axios.create({
    baseURL: this.baseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  signature(reference: string, amountInCents: number, currency: string) {
    const raw = `${reference}${amountInCents}${currency}${this.integrity}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  async getAcceptanceTokens() {
    const res = await this.publicClient.get(`/merchants/${this.publicKey}`);
    const m = res.data?.data;

    return {
      acceptance: {
        acceptance_token: m?.presigned_acceptance?.acceptance_token,
        permalink: m?.presigned_acceptance?.permalink,
        type: m?.presigned_acceptance?.type,
      },
      personalDataAuth: {
        acceptance_token: m?.presigned_personal_data_auth?.acceptance_token,
        permalink: m?.presigned_personal_data_auth?.permalink,
        type: m?.presigned_personal_data_auth?.type,
      },
    };
  }

  async createTransaction(input: {
    reference: string;
    amountInCents: number;
    currency: string;
    customerEmail: string;

    cardToken: string;
    installments: number;

    acceptanceToken: string;
    acceptPersonalAuth: string;
  }) {
    const sig = this.signature(input.reference, input.amountInCents, input.currency);

    const payload = {
      amount_in_cents: input.amountInCents,
      currency: input.currency,
      customer_email: input.customerEmail,
      reference: input.reference,
      acceptance_token: input.acceptanceToken,
      accept_personal_auth: input.acceptPersonalAuth,
      signature: sig,
      payment_method: {
        type: "CARD",
        token: input.cardToken,
        installments: input.installments,
      },
    };

    const res = await this.privateClient.post("/transactions", payload);
    return res.data.data; // { id, status, ... }
  }

  async getTransaction(id: string) {
    const res = await this.privateClient.get(`/transactions/${id}`);
    return res.data.data;
  }
}
