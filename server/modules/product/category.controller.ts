import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import type { Category } from '@shared/api.interface';

@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 获取启用的分类列表（含子分类树）
   */
  @Get()
  async getCategories(): Promise<Category[]> {
    return this.categoryService.getEnabledCategories();
  }

  /**
   * 获取多级分类树
   */
  @Get('tree')
  async getTree(): Promise<Category[]> {
    return this.categoryService.getCategoryTree();
  }
}
