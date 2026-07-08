import { Controller, Get, Put, Body, Req, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { MemberService } from './member.service';
import { Logger } from '@nestjs/common';
import type { Request } from 'express';

interface UpdateProfileDto {
  nickname?: string;
  phone?: string;
  email?: string;
}

@Controller('api/member')
export class MemberController {
  private readonly logger = new Logger(MemberController.name);

  constructor(private readonly memberService: MemberService) {}

  @Get('profile')
  @NeedLogin()
  async getProfile(@Req() req: Request) {
    const { userId } = (req as any).userContext;
    this.logger.log(`Get member profile: ${userId}`);
    return this.memberService.getProfile(userId);
  }

  @Put('profile')
  @NeedLogin()
  async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDto) {
    const { userId } = (req as any).userContext;
    this.logger.log(`Update member profile: ${userId}`);
    return this.memberService.updateProfile(userId, body);
  }

  @Get('orders')
  @NeedLogin()
  async getOrders(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('status') status?: string,
  ) {
    const { userId } = (req as any).userContext;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 10));
    return this.memberService.getMyOrders(userId, p, ps, status);
  }

  @Get('orders/:id')
  @NeedLogin()
  async getOrderDetail(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const { userId } = (req as any).userContext;
    return this.memberService.getOrderDetail(userId, id);
  }
}
