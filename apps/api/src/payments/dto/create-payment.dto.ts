import { IsEmail, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

class CustomerDto {
  @IsString() @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;
}

class DeliveryDto {
  @IsString() @IsNotEmpty()
  addressLine1: string;
}

class WompiDto {
  @IsString() @IsNotEmpty()
  cardToken: string;

  @IsString() @IsNotEmpty()
  acceptanceToken: string;

  @IsString() @IsNotEmpty()
  acceptPersonalAuth: string;

  @IsInt() @Min(1)
  installments: number;
}

export class CreatePaymentDto {
  @IsString() @IsNotEmpty()
  productId: string;

  @IsInt() @Min(1)
  quantity: number;

  customer: CustomerDto;
  delivery: DeliveryDto;
  wompi: WompiDto;
}
