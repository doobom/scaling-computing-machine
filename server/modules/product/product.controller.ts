import { Controller, Get, Query, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import type { Product, PaginatedResponse, ProductListParams } from '@shared/api.interface';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 商品搜索与筛选
   */
  @Get('search')
  async search(
    @Query() query: {
      keyword?: string;
      categoryId?: string;
      minPrice?: string;
      maxPrice?: string;
      sort?: 'price_asc' | 'price_desc' | 'sales' | 'newest';
      tag?: string;
      page?: string;
      pageSize?: string;
    },
  ): Promise<PaginatedResponse<Product>> {
    const params: ProductListParams = {
      keyword: query.keyword,
      categoryId: query.categoryId,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      sort: query.sort,
      tag: query.tag,
      page: query.page ? parseInt(query.page, 10) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 20,
    };
    return this.productService.search(params);
  }

  /**
   * 推荐商品列表
   */
  @Get('recommend')
  async getRecommend(
    @Query('type') type: string = 'recommend',
    @Query('limit') limit?: string,
  ): Promise<Product[]> {
    return this.productService.getRecommend(type, limit ? parseInt(limit, 10) : 10);
  }

  /**
   * 商品详情
   */
  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<Product> {
    return this.productService.getDetail(id);
  }
}
