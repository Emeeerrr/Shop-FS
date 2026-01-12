import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { DbModule } from '../infrastructure/db/db.module';
import { WompiModule } from '../wompi/wompi.module';

@Module({
  imports: [DbModule, WompiModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
