import { Controller, Get, Post, Body, Param, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { NeedLogin } from "@lark-apaas/fullstack-nestjs-core";
import type { Request } from 'express';
import { OrderService } from './order.service';
import type { OrderListParams } from '@shared/api.interface';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @NeedLogin()
  async createOrder(
    @Req() req: Request,
    @Body() body: {
      items: Array<{ cartId?: string; productId: string; spec: Record<string, string>; quantity: number }>;
      addressId: string;
      paymentMethod: string;
      remark?: string;
    },
  ) {
    const { userId } = req.userContext;
    return this.orderService.createOrder(
      userId,
      body.items,
      body.addressId,
      body.paymentMethod,
      body.remark,
    );
  }

  @Get()
  @NeedLogin()
  async getOrderList(
    @Req() req: Request,
    @Query() query: { status?: string; page?: string; pageSize?: string },
  ) {
    const { userId } = req.userContext;
    const params: OrderListParams = {
      page: query.page ? parseInt(query.page, 10) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 10,
      status: query.status,
    };
    return this.orderService.getOrderList(userId, params);
  }

  @Get(':id')
  @NeedLogin()
  async getOrderDetail(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    return this.orderService.getOrderDetail(userId, id);
  }

  @Post(':id/cancel')
  @NeedLogin()
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelOrder(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.orderService.cancelOrder(userId, id);
  }
}
