import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('api/admin/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get('sales-trend')
  async getSalesTrend(
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'day',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getSalesTrend(period, startDate, endDate);
  }

  @Get('payment-methods')
  async getPaymentMethods() {
    return this.statisticsService.getPaymentMethods();
  }

  @Get('product-ranking')
  async getProductRanking(
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.statisticsService.getProductRanking(limitNum, categoryId);
  }

  @Get('conversion-funnel')
  async getConversionFunnel() {
    return this.statisticsService.getConversionFunnel();
  }
}
