import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ReceiptService } from './receipt.service';

@Controller('api/admin/receipts')
export class AdminReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get('order/:orderId')
  async getOrderReceipt(@Param('orderId') orderId: string) {
    return this.receiptService.getAdminReceipt(orderId);
  }

  @Post('order/:orderId/generate')
  @HttpCode(HttpStatus.OK)
  async generateReceipt(@Param('orderId') orderId: string) {
    return this.receiptService.generateReceipt(orderId);
  }
}
