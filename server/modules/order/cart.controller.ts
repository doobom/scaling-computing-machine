import { Controller, Get, Post, Put, Delete, Body, Param, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { NeedLogin } from "@lark-apaas/fullstack-nestjs-core";
import type { Request } from 'express';
import { CartService } from './cart.service';

@Controller('api/carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @NeedLogin()
  async getCart(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.cartService.getCartList(userId);
  }

  @Post()
  @NeedLogin()
  async addToCart(
    @Req() req: Request,
    @Body() body: { productId: string; spec?: Record<string, string>; quantity?: number },
  ) {
    const { userId } = req.userContext;
    const { productId, spec = {}, quantity = 1 } = body;
    return this.cartService.addItem(userId, productId, spec, quantity);
  }

  @Put(':id')
  @NeedLogin()
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuantity(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    const { userId } = req.userContext;
    await this.cartService.updateQuantity(userId, id, body.quantity);
  }

  @Delete('clear')
  @NeedLogin()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@Req() req: Request) {
    const { userId } = req.userContext;
    await this.cartService.clearCart(userId);
  }

  @Delete(':id')
  @NeedLogin()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.cartService.removeItem(userId, id);
  }
}
