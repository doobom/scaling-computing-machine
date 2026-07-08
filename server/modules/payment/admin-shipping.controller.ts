import { Controller, Get, Put, Body } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import type { ShippingTemplate, SfExpressConfig } from './shipping.service';

@Controller('api/admin/shipping-settings')
export class AdminShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  async getShippingSettings(): Promise<ShippingTemplate> {
    return this.shippingService.getShippingTemplate();
  }

  @Put()
  async updateShippingSettings(
    @Body() body: Partial<ShippingTemplate>,
  ): Promise<ShippingTemplate> {
    return this.shippingService.updateShippingTemplate(body);
  }

  @Get('sf-express')
  async getSfExpressConfig(): Promise<SfExpressConfig> {
    return this.shippingService.getSfExpressConfig();
  }

  @Put('sf-express')
  async updateSfExpressConfig(
    @Body() body: Partial<SfExpressConfig>,
  ): Promise<SfExpressConfig> {
    return this.shippingService.updateSfExpressConfig(body);
  }
}
