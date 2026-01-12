import { Body, Controller, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.payments.createPayment(dto);
  }
}
