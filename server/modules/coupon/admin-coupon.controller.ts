import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { CouponAdminService } from './coupon-admin.service';
import type { Coupon, CouponListParams } from '@shared/api.interface';

@NeedLogin()
@Controller('api/admin/coupons')
export class AdminCouponController {
  constructor(private readonly couponService: CouponAdminService) {}

  @Get()
  async getList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('keyword') keyword?: string,
  ) {
    const params: CouponListParams = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      status,
      type,
      keyword,
    };
    return this.couponService.getAdminList(params);
  }

  @Get(':id')
  async getDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponService.getAdminDetail(id);
  }

  @Post()
  async create(@Body() dto: Partial<Coupon>) {
    return this.couponService.createCoupon(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<Coupon>,
  ) {
    return this.couponService.updateCoupon(id, dto);
  }

  @Put(':id/status')
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.couponService.toggleStatus(id, status);
  }
}
