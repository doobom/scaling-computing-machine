import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ShippingService } from './shipping.service';
import { PaymentController } from './payment.controller';
import { AdminPaymentController } from './admin-payment.controller';
import { AdminShippingController } from './admin-shipping.controller';
import { ReceiptModule } from '../receipt/receipt.module';

@Module({
  imports: [ReceiptModule],
  controllers: [
    PaymentController,
    AdminPaymentController,
    AdminShippingController,
  ],
  providers: [PaymentService, ShippingService],
})
export class PaymentModule {}
