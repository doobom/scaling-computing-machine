import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { BannerController } from './banner.controller';
import { DiscountController } from './discount.controller';
import { AdminDiscountController } from './admin-discount.controller';
import { AdminPromotionController } from './admin-promotion.controller';
import { AdminBannerController } from './admin-banner.controller';

@Module({
  controllers: [
    BannerController,
    DiscountController,
    AdminDiscountController,
    AdminPromotionController,
    AdminBannerController,
  ],
  providers: [MarketingService],
})
export class MarketingModule {}
