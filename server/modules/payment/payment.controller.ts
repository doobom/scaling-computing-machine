import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { PaymentService } from './payment.service';

@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('order/:orderId')
  @NeedLogin()
  async getPaymentByOrder(
    @Param('orderId') orderId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.paymentService.getPaymentByOrder(orderId, userId);
  }

  @Post(':orderId/voucher')
  @NeedLogin()
  async uploadVoucher(
    @Param('orderId') orderId: string,
    @Body() body: { transferVoucherUrl: string; transferRemark?: string },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.paymentService.uploadTransferVoucher(
      orderId,
      userId,
      body.transferVoucherUrl,
      body.transferRemark,
    );
  }

  @Post(':orderId/retry')
  @NeedLogin()
  async retryPayment(
    @Param('orderId') orderId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.paymentService.retryPayment(orderId, userId);
  }

  @Get('methods')
  async getPaymentMethods() {
    return this.paymentService.getAvailablePaymentMethods();
  }
}
