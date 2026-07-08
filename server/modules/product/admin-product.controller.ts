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
import { ProductService } from './product.service';
import type { Product, PaginatedResponse, ProductListParams } from '@shared/api.interface';

@Controller('api/admin/products')
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 商品列表（分页）
   */
  @Get()
  async getList(
    @Query() query: {
      keyword?: string;
      categoryId?: string;
      status?: string;
      page?: string;
      pageSize?: string;
    },
  ): Promise<PaginatedResponse<Product>> {
    const params: ProductListParams = {
      keyword: query.keyword,
      categoryId: query.categoryId,
      status: query.status,
      page: query.page ? parseInt(query.page, 10) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 20,
    };
    return this.productService.getAdminList(params);
  }

  /**
   * 低库存商品列表
   */
  @Get('low-stock')
  async getLowStock(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<Product>> {
    return this.productService.getLowStockList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  /**
   * 商品详情
   */
  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<Product> {
    return this.productService.getAdminDetail(id);
  }

  /**
   * 新增商品
   */
  @NeedLogin()
  @Post()
  async create(@Body() body: {
    categoryId?: string;
    titleZh: string;
    titleEn: string;
    descZh?: string;
    descEn?: string;
    originalPrice: number;
    salePrice: number;
    stock: number;
    stockWarningThreshold?: number;
    spec?: Record<string, string[]>;
    status?: string;
    tags?: string[];
    sort?: number;
    images?: Array<{ imageUrl: string; sort: number; isMain: boolean }>;
  }): Promise<Product> {
    return this.productService.create(body);
  }

  /**
   * 编辑商品
   */
  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      categoryId?: string | null;
      titleZh?: string;
      titleEn?: string;
      descZh?: string | null;
      descEn?: string | null;
      originalPrice?: number;
      salePrice?: number;
      stock?: number;
      stockWarningThreshold?: number;
      spec?: Record<string, string[]>;
      status?: string;
      tags?: string[];
      sort?: number;
      images?: Array<{ imageUrl: string; sort: number; isMain: boolean }>;
    },
  ): Promise<Product> {
    return this.productService.update(id, body);
  }

  /**
   * 删除商品
   */
  @NeedLogin()
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.productService.delete(id);
    return { success: true };
  }

  /**
   * 上下架切换
   */
  @NeedLogin()
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string): Promise<Product> {
    return this.productService.toggleStatus(id);
  }

  /**
   * 批量上下架
   */
  @NeedLogin()
  @Post('batch-status')
  async batchUpdateStatus(@Body() body: {
    ids: string[];
    status: string;
  }): Promise<{ success: boolean; updated: number }> {
    const updated = await this.productService.batchUpdateStatus(body.ids, body.status);
    return { success: true, updated };
  }
}
