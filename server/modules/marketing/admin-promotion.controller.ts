import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { MarketingService, type PromotionFormData } from './marketing.service';

@Controller('api/admin/promotions')
export class AdminPromotionController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  async getList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.marketingService.getPromotionList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      status,
    });
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return this.marketingService.getPromotionById(id);
  }

  @NeedLogin()
  @Post()
  async create(@Body() body: PromotionFormData) {
    return this.marketingService.createPromotion(body);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: PromotionFormData) {
    return this.marketingService.updatePromotion(id, body);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.marketingService.deletePromotion(id);
    return { success: true };
  }

  @NeedLogin()
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.marketingService.updatePromotionStatus(id, body.status);
  }
}
