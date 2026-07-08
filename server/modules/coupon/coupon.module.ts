import { Module } from '@nestjs/common';
import { CouponAdminService } from './coupon-admin.service';
import { CouponController } from './coupon.controller';
import { AdminCouponController } from './admin-coupon.controller';

@Module({
  controllers: [CouponController, AdminCouponController],
  providers: [CouponAdminService],
  exports: [CouponAdminService],
})
export class CouponModule {}
