import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from 'src/infrastructure/db/prisma.service';

type PaymentResult = { status: 'SUCCESS' | 'FAILED' };

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private simulateGateway(cardNumber: string): PaymentResult {
    const clean = cardNumber.replace(/\s/g, '');

    if (clean === '4242424242424242') return { status: 'SUCCESS' };
    if (clean === '5555555555554444') return { status: 'FAILED' };

    return { status: 'FAILED' };
  }

  async pay(dto: CreatePaymentDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { stock: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    const available = product.stock?.unitsAvailable ?? 0;
    if (dto.quantity > available) {
      throw new ConflictException('Not enough stock');
    }

    const gateway = this.simulateGateway(dto.cardNumber);

    // ✅ Si success, descontamos stock.
    if (gateway.status === 'SUCCESS') {
      await this.prisma.$transaction(async (tx) => {
        // Re-validate en transacción por si hay carreras
        const current = await tx.stock.findUnique({ where: { productId: dto.productId } });
        const currentAvail = current?.unitsAvailable ?? 0;
        if (dto.quantity > currentAvail) throw new ConflictException('Not enough stock');

        await tx.stock.update({
          where: { productId: dto.productId },
          data: { unitsAvailable: { decrement: dto.quantity } },
        });

        // (Opcional) registrar Transaction en tu DB si ya tienes modelo
      });
    } else {
      // (Opcional) registrar Transaction failed
    }

    return {
      status: gateway.status,
      productId: dto.productId,
      quantity: dto.quantity,
    };
  }
}
