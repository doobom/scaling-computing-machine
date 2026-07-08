import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, isNull, asc, and, ne } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { category } from '@server/database/schema';
import type { Category } from '@shared/api.interface';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 获取启用的分类列表（含子分类树，最多2级）
   */
  async getEnabledCategories(): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(category)
      .where(eq(category.status, 'enabled'))
      .orderBy(asc(category.sort), asc(category.id));
    return this.buildTree(rows);
  }

  /**
   * 获取多级分类树（全部分类，后台用）
   */
  async getCategoryTree(): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(category)
      .orderBy(asc(category.sort), asc(category.id));
    return this.buildTree(rows);
  }

  /**
   * 后台：分类列表（平铺，便于管理）
   */
  async getAdminList(): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(category)
      .orderBy(asc(category.sort), asc(category.id));
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * 根据ID获取分类
   */
  async getById(id: string): Promise<Category> {
    const rows = await this.db.select().from(category).where(eq(category.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('分类不存在');
    }
    return this.mapRow(rows[0]);
  }

  /**
   * 新增分类
   */
  async create(data: {
    parentId?: string | null;
    nameZh: string;
    nameEn: string;
    iconUrl?: string;
    sort?: number;
    status?: string;
  }): Promise<Category> {
    const rows = await this.db
      .insert(category)
      .values({
        parentId: data.parentId ?? null,
        nameZh: data.nameZh,
        nameEn: data.nameEn,
        iconUrl: data.iconUrl ?? null,
        sort: data.sort ?? 0,
        status: data.status ?? 'enabled',
      })
      .returning();
    return this.mapRow(rows[0]);
  }

  /**
   * 编辑分类
   */
  async update(
    id: string,
    data: {
      parentId?: string | null;
      nameZh?: string;
      nameEn?: string;
      iconUrl?: string | null;
      sort?: number;
      status?: string;
    },
  ): Promise<Category> {
    await this.getById(id);
    const rows = await this.db
      .update(category)
      .set({
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        ...(data.nameZh !== undefined ? { nameZh: data.nameZh } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.iconUrl !== undefined ? { iconUrl: data.iconUrl } : {}),
        ...(data.sort !== undefined ? { sort: data.sort } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      })
      .where(eq(category.id, id))
      .returning();
    return this.mapRow(rows[0]);
  }

  /**
   * 删除分类
   */
  async delete(id: string): Promise<void> {
    await this.getById(id);
    // 检查是否有子分类
    const children = await this.db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.parentId, id))
      .limit(1);
    if (children.length > 0) {
      throw new Error('存在子分类，无法删除');
    }
    await this.db.delete(category).where(eq(category.id, id));
  }

  /**
   * 切换启用状态
   */
  async toggleStatus(id: string): Promise<Category> {
    const existing = await this.getById(id);
    const newStatus = existing.status === 'enabled' ? 'disabled' : 'enabled';
    return this.update(id, { status: newStatus });
  }

  /**
   * 构建分类树（最多2级）
   */
  private buildTree(rows: Array<typeof category.$inferSelect>): Category[] {
    const all: Category[] = rows.map((row) => this.mapRow(row));
    const map = new Map<string, Category>();
    all.forEach((item) => map.set(item.id, { ...item, children: [] }));

    const roots: Category[] = [];
    all.forEach((item) => {
      const node = map.get(item.id)!;
      if (!item.parentId) {
        roots.push(node);
      } else {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          // 父级不在列表中（如状态过滤），作为根级展示
          roots.push(node);
        }
      }
    });

    // 排序
    const sortFn = (a: Category, b: Category) => a.sort - b.sort || a.id.localeCompare(b.id);
    roots.sort(sortFn);
    roots.forEach((root) => {
      if (root.children) root.children.sort(sortFn);
    });

    return roots;
  }

  private mapRow(row: typeof category.$inferSelect): Category {
    return {
      id: row.id,
      parentId: row.parentId ?? null,
      nameZh: row.nameZh,
      nameEn: row.nameEn,
      iconUrl: row.iconUrl ?? undefined,
      sort: row.sort,
      status: row.status,
    };
  }
}
