import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../infrastructure/db/prisma.service";
import { WompiService } from "../wompi/wompi.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { TransactionStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import axios from "axios";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function isFinalWompiStatus(s: string) {
  return ["APPROVED", "DECLINED", "ERROR", "VOIDED"].includes(s);
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private wompi: WompiService
  ) {}

  async createPayment(dto: CreatePaymentDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { stock: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    if (!product.stock) throw new BadRequestException("Product has no stock row");
    if (dto.quantity > product.stock.unitsAvailable) {
      throw new BadRequestException("Not enough stock");
    }

    // 1) referencia única para Wompi
    const reference = `SHOPFS-${randomUUID()}`;

    // 2) amount en centavos (ya lo tienes en product.priceCents)
    const amountInCents = product.priceCents * dto.quantity;

    // 3) Upsert customer por email (email es UNIQUE en tu schema ✅)
    const customer = await this.prisma.customer.upsert({
      where: { email: dto.customer.email },
      update: { fullName: dto.customer.fullName },
      create: { email: dto.customer.email, fullName: dto.customer.fullName },
    });

    // 4) Crear delivery (simple: 1 por compra)
    const delivery = await this.prisma.delivery.create({
      data: {
        address: dto.delivery.addressLine1,
        customerId: customer.id,
      },
    });

    // 5) Crear Transaction local PENDING (aún no toques stock)
    const tx = await this.prisma.transaction.create({
      data: {
        reference,
        status: TransactionStatus.PENDING,
        amountInCents,
        currency: product.currency,
        productId: product.id,
        quantity: dto.quantity,
        customerId: customer.id,
        deliveryId: delivery.id,
      },
    });

    // 6) Crear transacción real en Wompi
    let wompiTx: any;
    try {
      wompiTx = await this.wompi.createTransaction({
        reference,
        amountInCents,
        currency: product.currency,
        customerEmail: customer.email,
        cardToken: dto.wompi.cardToken,
        installments: dto.wompi.installments,
        acceptanceToken: dto.wompi.acceptanceToken,
        acceptPersonalAuth: dto.wompi.acceptPersonalAuth,
      });
    } catch (err) {
      // 👇 Esto hace que Postman muestre el error real de Wompi
      if (axios.isAxiosError(err)) {
        throw new BadRequestException({
          message: "Wompi transaction failed",
          wompiStatus: err.response?.status,
          wompiData: err.response?.data,
        });
      }
      throw err;
    }

    // 7) Guardar wompiTransactionId (status de Wompi suele iniciar PENDING)
    await this.prisma.transaction.update({
      where: { id: tx.id },
      data: {
        wompiTransactionId: wompiTx.id,
      },
    });

    // 8) Polling para llevarlo a final (para el challenge)
    let current = await this.wompi.getTransaction(wompiTx.id);
    for (let i = 0; i < 12 && !isFinalWompiStatus(current.status); i++) {
      await sleep(1000);
      current = await this.wompi.getTransaction(wompiTx.id);
    }

    // 9) Mapear status Wompi → tu enum
    let finalStatus: TransactionStatus = TransactionStatus.ERROR;
    if (current.status === "APPROVED") finalStatus = TransactionStatus.APPROVED;
    else if (current.status === "DECLINED") finalStatus = TransactionStatus.DECLINED;
    else finalStatus = TransactionStatus.ERROR;

    // 10) Si APPROVED: descontar stock + cerrar transaction
    if (finalStatus === TransactionStatus.APPROVED) {
      await this.prisma.$transaction([
        this.prisma.stock.update({
          where: { productId: product.id },
          data: { unitsAvailable: { decrement: dto.quantity } },
        }),
        this.prisma.transaction.update({
          where: { id: tx.id },
          data: { status: finalStatus },
        }),
      ]);
    } else {
      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: { status: finalStatus },
      });
    }

    return {
      transactionId: tx.id,
      reference,
      wompiTransactionId: wompiTx.id,
      status: finalStatus,
      wompiStatus: current.status,
    };
  }
}
