import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';
import { AdminReceiptController } from './admin-receipt.controller';

@Module({
  controllers: [ReceiptController, AdminReceiptController],
  providers: [ReceiptService],
  exports: [ReceiptService],
})
export class ReceiptModule {}
