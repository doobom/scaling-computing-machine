import { Controller, Get } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('api/discounts')
export class DiscountController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('active')
  async getActiveDiscounts() {
    return this.marketingService.getActiveDiscounts();
  }
}
