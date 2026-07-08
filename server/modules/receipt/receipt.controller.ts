import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { ReceiptService } from './receipt.service';

@Controller('api/receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get('order/:orderId')
  @NeedLogin()
  async getOrderReceipt(
    @Param('orderId') orderId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.receiptService.getUserReceipt(userId, orderId);
  }

  @Get()
  @NeedLogin()
  async getReceiptList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.receiptService.getUserReceiptList(
      userId,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }
}
