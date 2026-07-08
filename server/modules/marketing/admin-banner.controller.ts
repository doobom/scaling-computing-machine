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
import { MarketingService, type BannerFormData } from './marketing.service';

@Controller('api/admin/banners')
export class AdminBannerController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  async getList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
    @Query('status') status?: string,
  ) {
    return this.marketingService.getBannerList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      status,
    });
  }

  @NeedLogin()
  @Post()
  async create(@Body() body: BannerFormData) {
    return this.marketingService.createBanner(body);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: BannerFormData) {
    return this.marketingService.updateBanner(id, body);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.marketingService.deleteBanner(id);
    return { success: true };
  }

  @NeedLogin()
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.marketingService.updateBannerStatus(id, body.status);
  }
}
