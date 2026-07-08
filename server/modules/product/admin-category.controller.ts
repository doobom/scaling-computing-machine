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
import { CategoryService } from './category.service';
import type { Category } from '@shared/api.interface';

@Controller('api/admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 分类列表
   */
  @Get()
  async getList(): Promise<Category[]> {
    return this.categoryService.getAdminList();
  }

  /**
   * 新增分类
   */
  @NeedLogin()
  @Post()
  async create(@Body() body: {
    parentId?: string | null;
    nameZh: string;
    nameEn: string;
    iconUrl?: string;
    sort?: number;
    status?: string;
  }): Promise<Category> {
    return this.categoryService.create(body);
  }

  /**
   * 编辑分类
   */
  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      parentId?: string | null;
      nameZh?: string;
      nameEn?: string;
      iconUrl?: string | null;
      sort?: number;
      status?: string;
    },
  ): Promise<Category> {
    return this.categoryService.update(id, body);
  }

  /**
   * 删除分类
   */
  @NeedLogin()
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.categoryService.delete(id);
    return { success: true };
  }

  /**
   * 切换启用状态
   */
  @NeedLogin()
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string): Promise<Category> {
    return this.categoryService.toggleStatus(id);
  }
}
