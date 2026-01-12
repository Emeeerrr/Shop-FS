import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/db/prisma.service';

@Global() // opcional, pero recomendado
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
