import { Controller, Get, Post, Delete, Req, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { MemberService } from './member.service';
import { Logger } from '@nestjs/common';
import type { Request } from 'express';

@Controller('api/member/favorites')
export class FavoriteController {
  private readonly logger = new Logger(FavoriteController.name);

  constructor(private readonly memberService: MemberService) {}

  @Get()
  @NeedLogin()
  async getFavorites(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
  ) {
    const { userId } = (req as any).userContext;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 12));
    return this.memberService.getFavorites(userId, p, ps);
  }

  @Post(':productId')
  @NeedLogin()
  async addFavorite(
    @Req() req: Request,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const { userId } = (req as any).userContext;
    this.logger.log(`Add favorite: ${userId} -> ${productId}`);
    await this.memberService.addFavorite(userId, productId);
    return { success: true };
  }

  @Delete(':productId')
  @NeedLogin()
  async removeFavorite(
    @Req() req: Request,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const { userId } = (req as any).userContext;
    this.logger.log(`Remove favorite: ${userId} -> ${productId}`);
    await this.memberService.removeFavorite(userId, productId);
    return { success: true };
  }
}
