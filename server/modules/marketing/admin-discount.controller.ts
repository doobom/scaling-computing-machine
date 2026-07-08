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
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { MarketingService, type DiscountFormData } from './marketing.service';

@Controller('api/admin/discounts')
export class AdminDiscountController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  async getList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.marketingService.getDiscountList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      status,
    });
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return this.marketingService.getDiscountById(id);
  }

  @NeedLogin()
  @Post()
  async create(@Body() body: DiscountFormData) {
    return this.marketingService.createDiscount(body);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: DiscountFormData) {
    return this.marketingService.updateDiscount(id, body);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.marketingService.deleteDiscount(id);
    return { success: true };
  }

  @NeedLogin()
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.marketingService.updateDiscountStatus(id, body.status);
  }
}
