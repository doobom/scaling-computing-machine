import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { NeedLogin } from "@lark-apaas/fullstack-nestjs-core";
import type { Request } from 'express';
import { AddressService } from './address.service';

@Controller('api/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @NeedLogin()
  async getList(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.addressService.getList(userId);
  }

  @Post()
  @NeedLogin()
  async create(
    @Req() req: Request,
    @Body() body: {
      receiverName: string;
      receiverPhone: string;
      region: string;
      detailAddress: string;
      isDefault?: boolean;
    },
  ) {
    const { userId } = req.userContext;
    return this.addressService.create(userId, body);
  }

  @Put(':id')
  @NeedLogin()
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: {
      receiverName?: string;
      receiverPhone?: string;
      region?: string;
      detailAddress?: string;
      isDefault?: boolean;
    },
  ) {
    const { userId } = req.userContext;
    return this.addressService.update(userId, id, body);
  }

  @Delete(':id')
  @NeedLogin()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.addressService.remove(userId, id);
  }

  @Patch(':id/default')
  @NeedLogin()
  async setDefault(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    return this.addressService.setDefault(userId, id);
  }
}
