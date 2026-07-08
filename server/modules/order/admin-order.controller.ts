import { Controller, Get, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import type { OrderListParams } from '@shared/api.interface';

@Controller('api/admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getOrderList(
    @Query() query: {
      orderNo?: string;
      status?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    const params: OrderListParams = {
      page: query.page ? parseInt(query.page, 10) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 10,
      orderNo: query.orderNo,
      status: query.status,
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
    };
    return this.orderService.adminGetOrderList(params);
  }

  @Get(':id')
  async getOrderDetail(@Param('id') id: string) {
    return this.orderService.adminGetOrderDetail(id);
  }

  @Patch(':id/ship')
  @HttpCode(HttpStatus.NO_CONTENT)
  async shipOrder(
    @Param('id') id: string,
    @Body() body: { shippingNo: string; shippingCompany: string },
  ) {
    await this.orderService.adminUpdateShipping(id, body.shippingNo, body.shippingCompany);
  }

  @Patch(':id/price')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePrice(
    @Param('id') id: string,
    @Body() body: { payAmount: number },
  ) {
    await this.orderService.adminUpdatePrice(id, body.payAmount);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelOrder(@Param('id') id: string) {
    await this.orderService.adminCloseOrder(id);
  }

  @Patch(':id/remark')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateRemark(
    @Param('id') id: string,
    @Body() body: { remark: string },
  ) {
    await this.orderService.adminUpdateRemark(id, body.remark);
  }
}
