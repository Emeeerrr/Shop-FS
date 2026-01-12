import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/db/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { stock: true },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getAll() {
    return this.prisma.product.findMany({
      include: { stock: true },
      orderBy: { createdAt: 'asc' },
    });
  }

}
