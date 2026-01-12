import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from 'prisma/prisma.module';
import { WompiModule } from './wompi/wompi.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProductsModule,
    PaymentsModule,
    PrismaModule,
    WompiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
