import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { PaymentMethodsConfig } from './payment.service';

@Controller('api/admin')
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ---- Payment Settings ----

  @Get('payment-settings')
  async getPaymentSettings() {
    return this.paymentService.getPaymentMethodsConfig();
  }

  @Put('payment-settings')
  async updatePaymentSettings(@Body() body: PaymentMethodsConfig) {
    return this.paymentService.updatePaymentMethodsConfig(body);
  }

  // ---- Payment Records ----

  @Get('payments')
  async getPaymentRecords(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('paymentMethod') paymentMethod?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentService.getPaymentRecords({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      paymentMethod,
      status,
    });
  }

  @Get('payments/:id')
  async getPaymentRecord(@Param('id') id: string) {
    return this.paymentService.getPaymentRecordById(id);
  }

  // ---- Transfer Voucher Audit ----

  @Get('transfer-vouchers')
  async getTransferVouchers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('orderNo') orderNo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('auditStatus') auditStatus?: string,
  ) {
    return this.paymentService.getTransferVoucherList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      orderNo,
      startDate,
      endDate,
      auditStatus: auditStatus ?? 'pending',
    });
  }

  @Put('transfer-vouchers/:id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approveVoucher(@Param('id') id: string) {
    await this.paymentService.approveTransferVoucher(id);
  }

  @Put('transfer-vouchers/:id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectVoucher(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    await this.paymentService.rejectTransferVoucher(id, body.reason);
  }
}
