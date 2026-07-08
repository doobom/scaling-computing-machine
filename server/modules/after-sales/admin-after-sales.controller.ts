import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AdminAfterSalesService } from './admin-after-sales.service';
import type { AfterSalesListParams } from '@shared/api.interface';

@Controller('api/admin/after-sales')
export class AdminAfterSalesController {
  constructor(
    private readonly adminAfterSalesService: AdminAfterSalesService,
  ) {}

  @Get()
  async getList(
    @Query() query: {
      status?: string;
      afterSalesNo?: string;
      orderNo?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    const params: AfterSalesListParams = {
      page: query.page ? parseInt(query.page, 10) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 10,
      status: query.status,
      afterSalesNo: query.afterSalesNo,
      orderNo: query.orderNo,
    };
    return this.adminAfterSalesService.getAdminList(params);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return this.adminAfterSalesService.getAdminDetail(id);
  }

  @Put(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() body: { type: 'refund' | 'return' },
  ) {
    return this.adminAfterSalesService.approve(id, body.type);
  }

  @Put(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.adminAfterSalesService.reject(id, body.reason);
  }

  @Put(':id/confirm-return')
  async confirmReturn(@Param('id') id: string) {
    return this.adminAfterSalesService.confirmReturnReceived(id);
  }

  @Put(':id/complete')
  async complete(@Param('id') id: string) {
    return this.adminAfterSalesService.completeRefund(id);
  }
}
