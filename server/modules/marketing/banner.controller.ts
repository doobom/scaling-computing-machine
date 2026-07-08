import { Controller, Get } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('api/banners')
export class BannerController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  async getBanners() {
    return this.marketingService.getEnabledBanners();
  }
}
