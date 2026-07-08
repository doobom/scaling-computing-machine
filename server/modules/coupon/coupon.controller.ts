import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { CouponAdminService } from './coupon-admin.service';

@Controller('api/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponAdminService) {}

  @Get('available')
  async getAvailableCoupons(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.couponService.getAvailableCoupons(
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  @NeedLogin()
  @Post(':id/claim')
  async claimCoupon(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { userId } = req.userContext;
    return this.couponService.claimCoupon(userId, id);
  }

  @NeedLogin()
  @Get('my')
  async getMyCoupons(@Req() req: any, @Query('status') status?: string) {
    const { userId } = req.userContext;
    return this.couponService.getUserCoupons(userId, status);
  }

  @NeedLogin()
  @Get('my/available')
  async getMyAvailableCoupons(
    @Req() req: any,
    @Query('amount') amount: string,
    @Query('categoryIds') categoryIds?: string,
    @Query('productIds') productIds?: string,
  ) {
    const { userId } = req.userContext;
    const catIds = categoryIds
      ? categoryIds.split(',').filter(Boolean)
      : undefined;
    const prodIds = productIds
      ? productIds.split(',').filter(Boolean)
      : undefined;
    return this.couponService.getUserAvailableCoupons(
      userId,
      parseFloat(amount),
      catIds,
      prodIds,
    );
  }
}
