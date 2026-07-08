import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  eq,
  and,
  asc,
  desc,
  like,
  or,
  gte,
  lte,
  count,
  inArray,
  isNull,
  sql,
} from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { product, productImage, category } from '@server/database/schema';
import type {
  Product,
  ProductImage,
  PaginatedResponse,
  ProductListParams,
} from '@shared/api.interface';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 前台：商品搜索与筛选（仅上架商品）
   */
  async search(params: ProductListParams): Promise<PaginatedResponse<Product>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const conditions = [eq(product.status, 'on_sale')];

    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(like(product.titleZh, kw), like(product.titleEn, kw)));
    }
    if (params.categoryId) {
      conditions.push(eq(product.categoryId, params.categoryId));
    }
    if (params.minPrice !== undefined && params.minPrice !== null) {
      conditions.push(gte(product.salePrice, String(params.minPrice)));
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      conditions.push(lte(product.salePrice, String(params.maxPrice)));
    }
    if (params.tag) {
      conditions.push(sql`${product.tags} @> ARRAY[${params.tag}]::varchar[]`);
    }

    const where = and(...conditions);

    // count
    const countResult = await this.db
      .select({ count: count() })
      .from(product)
      .where(where);
    const total = Number(countResult[0].count);

    // sort
    let orderBy: any = [desc(product.sort), desc(product.createdAt)];
    switch (params.sort) {
      case 'price_asc':
        orderBy = [asc(product.salePrice), desc(product.createdAt)];
        break;
      case 'price_desc':
        orderBy = [desc(product.salePrice), desc(product.createdAt)];
        break;
      case 'sales':
        orderBy = [desc(product.salesCount), desc(product.createdAt)];
        break;
      case 'newest':
        orderBy = [desc(product.createdAt)];
        break;
    }

    const rows = await this.db
      .select()
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const productIds = rows.map((r) => r.product.id);
    const imagesMap = productIds.length > 0
      ? await this.getImagesMap(productIds)
      : new Map<string, ProductImage[]>();

    const items: Product[] = rows.map(({ product: p, category: c }) => {
      const imgs = imagesMap.get(p.id) || [];
      const mainImg = imgs.find((img) => img.isMain) || imgs[0];
      return {
        ...this.mapProductRow(p),
        categoryName: c?.nameZh ?? undefined,
        mainImageUrl: mainImg?.imageUrl,
      };
    });

    return { items, total, page, pageSize };
  }

  /**
   * 前台：推荐商品列表
   */
  async getRecommend(type: string, limit: number): Promise<Product[]> {
    const take = limit || 10;
    let orderBy: any = [desc(product.sort), desc(product.createdAt)];

    switch (type) {
      case 'hot':
        orderBy = [desc(product.salesCount), desc(product.createdAt)];
        break;
      case 'new':
        orderBy = [desc(product.createdAt)];
        break;
      case 'recommend':
      default:
        orderBy = [desc(product.sort), desc(product.salesCount)];
        break;
    }

    const rows = await this.db
      .select()
      .from(product)
      .where(eq(product.status, 'on_sale'))
      .orderBy(...orderBy)
      .limit(take);

    const productIds = rows.map((r) => r.id);
    const imagesMap = productIds.length > 0
      ? await this.getImagesMap(productIds)
      : new Map<string, ProductImage[]>();

    return rows.map((p) => {
      const imgs = imagesMap.get(p.id) || [];
      const mainImg = imgs.find((img) => img.isMain) || imgs[0];
      return {
        ...this.mapProductRow(p),
        mainImageUrl: mainImg?.imageUrl,
      };
    });
  }

  /**
   * 前台：商品详情（含图片列表）
   */
  async getDetail(id: string): Promise<Product> {
    const rows = await this.db
      .select()
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .where(and(eq(product.id, id), eq(product.status, 'on_sale')))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('商品不存在或已下架');
    }

    const { product: p, category: c } = rows[0];
    const images = await this.getProductImages(p.id);
    const mainImg = images.find((img) => img.isMain) || images[0];

    return {
      ...this.mapProductRow(p),
      categoryName: c?.nameZh ?? undefined,
      mainImageUrl: mainImg?.imageUrl,
      images,
    };
  }

  /**
   * 后台：商品列表（分页）
   */
  async getAdminList(params: ProductListParams): Promise<PaginatedResponse<Product>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const conditions = [];
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(like(product.titleZh, kw), like(product.titleEn, kw)));
    }
    if (params.categoryId) {
      conditions.push(eq(product.categoryId, params.categoryId));
    }
    if (params.status) {
      conditions.push(eq(product.status, params.status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: count() })
      .from(product)
      .where(where);
    const total = Number(countResult[0].count);

    const rows = await this.db
      .select()
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .where(where)
      .orderBy(desc(product.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const productIds = rows.map((r) => r.product.id);
    const imagesMap = productIds.length > 0
      ? await this.getImagesMap(productIds)
      : new Map<string, ProductImage[]>();

    const items: Product[] = rows.map(({ product: p, category: c }) => {
      const imgs = imagesMap.get(p.id) || [];
      const mainImg = imgs.find((img) => img.isMain) || imgs[0];
      return {
        ...this.mapProductRow(p),
        categoryName: c?.nameZh ?? undefined,
        mainImageUrl: mainImg?.imageUrl,
      };
    });

    return { items, total, page, pageSize };
  }

  /**
   * 后台：商品详情
   */
  async getAdminDetail(id: string): Promise<Product> {
    const rows = await this.db
      .select()
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .where(eq(product.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('商品不存在');
    }

    const { product: p, category: c } = rows[0];
    const images = await this.getProductImages(p.id);
    const mainImg = images.find((img) => img.isMain) || images[0];

    return {
      ...this.mapProductRow(p),
      categoryName: c?.nameZh ?? undefined,
      mainImageUrl: mainImg?.imageUrl,
      images,
    };
  }

  /**
   * 后台：新增商品（含图片）
   */
  async create(data: {
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
    const inserted = await this.db
      .insert(product)
      .values({
        categoryId: data.categoryId ?? null,
        titleZh: data.titleZh,
        titleEn: data.titleEn,
        descZh: data.descZh ?? null,
        descEn: data.descEn ?? null,
        originalPrice: String(data.originalPrice),
        salePrice: String(data.salePrice),
        stock: data.stock,
        stockWarningThreshold: data.stockWarningThreshold ?? 10,
        spec: data.spec ?? {},
        status: data.status ?? 'draft',
        tags: data.tags ?? [],
        sort: data.sort ?? 0,
      })
      .returning();

    const productId = inserted[0].id;

    if (data.images && data.images.length > 0) {
      await this.db.insert(productImage).values(
        data.images.map((img) => ({
          productId,
          imageUrl: img.imageUrl,
          sort: img.sort,
          isMain: img.isMain,
        })),
      );
    }

    return this.getAdminDetail(productId);
  }

  /**
   * 后台：编辑商品
   */
  async update(
    id: string,
    data: {
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
    await this.getAdminDetail(id);

    const updateData: Record<string, any> = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.titleZh !== undefined) updateData.titleZh = data.titleZh;
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn;
    if (data.descZh !== undefined) updateData.descZh = data.descZh;
    if (data.descEn !== undefined) updateData.descEn = data.descEn;
    if (data.originalPrice !== undefined) updateData.originalPrice = String(data.originalPrice);
    if (data.salePrice !== undefined) updateData.salePrice = String(data.salePrice);
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.stockWarningThreshold !== undefined) {
      updateData.stockWarningThreshold = data.stockWarningThreshold;
    }
    if (data.spec !== undefined) updateData.spec = data.spec;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.sort !== undefined) updateData.sort = data.sort;

    if (Object.keys(updateData).length > 0) {
      await this.db.update(product).set(updateData).where(eq(product.id, id));
    }

    // 同步更新图片：先删后插
    if (data.images !== undefined) {
      await this.db.delete(productImage).where(eq(productImage.productId, id));
      if (data.images.length > 0) {
        await this.db.insert(productImage).values(
          data.images.map((img) => ({
            productId: id,
            imageUrl: img.imageUrl,
            sort: img.sort,
            isMain: img.isMain,
          })),
        );
      }
    }

    return this.getAdminDetail(id);
  }

  /**
   * 后台：删除商品
   */
  async delete(id: string): Promise<void> {
    await this.getAdminDetail(id);
    await this.db.delete(product).where(eq(product.id, id));
  }

  /**
   * 后台：上下架切换
   */
  async toggleStatus(id: string): Promise<Product> {
    const existing = await this.getAdminDetail(id);
    const newStatus = existing.status === 'on_sale' ? 'off_sale' : 'on_sale';
    return this.update(id, { status: newStatus });
  }

  /**
   * 后台：批量上下架
   */
  async batchUpdateStatus(ids: string[], status: string): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.db
      .update(product)
      .set({ status })
      .where(inArray(product.id, ids))
      .returning({ id: product.id });
    return result.length;
  }

  /**
   * 扣减库存（乐观锁 + version）
   * 返回更新影响行数；0 表示版本冲突或库存不足
   */
  async decreaseStockWithVersion(
    productId: string,
    quantity: number,
  ): Promise<number> {
    if (quantity <= 0) return 0;

    const MAX_RETRY = 3;
    let attempt = 0;

    while (attempt < MAX_RETRY) {
      const rows = await this.db
        .select({ stock: product.stock, version: product.version })
        .from(product)
        .where(eq(product.id, productId))
        .limit(1);

      if (rows.length === 0) {
        throw new NotFoundException('Product not found');
      }

      const current = rows[0];
      if (current.stock < quantity) {
        throw new BadRequestException('商品库存不足，请刷新后重试');
      }

      const result = await this.db
        .update(product)
        .set({
          stock: sql`${product.stock} - ${quantity}`,
          version: sql`${product.version} + 1`,
        })
        .where(
          and(
            eq(product.id, productId),
            eq(product.version, current.version),
            sql`${product.stock} >= ${quantity}`,
          ),
        )
        .returning({ id: product.id });

      if (result.length > 0) {
        return result.length;
      }

      attempt++;
      this.logger.warn(
        `Stock decrease version conflict: productId=${productId}, attempt=${attempt}`,
      );
    }

    throw new BadRequestException('商品库存不足，请刷新后重试');
  }

  /**
   * 回补库存（乐观锁 + version）
   */
  async increaseStockWithVersion(
    productId: string,
    quantity: number,
  ): Promise<number> {
    if (quantity <= 0) return 0;

    const MAX_RETRY = 3;
    let attempt = 0;

    while (attempt < MAX_RETRY) {
      const rows = await this.db
        .select({ version: product.version })
        .from(product)
        .where(eq(product.id, productId))
        .limit(1);

      if (rows.length === 0) {
        throw new NotFoundException('Product not found');
      }

      const current = rows[0];

      const result = await this.db
        .update(product)
        .set({
          stock: sql`${product.stock} + ${quantity}`,
          version: sql`${product.version} + 1`,
        })
        .where(and(eq(product.id, productId), eq(product.version, current.version)))
        .returning({ id: product.id });

      if (result.length > 0) {
        return result.length;
      }

      attempt++;
      this.logger.warn(
        `Stock increase version conflict: productId=${productId}, attempt=${attempt}`,
      );
    }

    throw new BadRequestException('库存更新失败，请刷新后重试');
  }

  /**
   * 后台：低库存商品列表
   */
  async getLowStockList(params: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Product>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const where = sql`${product.stock} <= ${product.stockWarningThreshold}`;

    const countResult = await this.db
      .select({ count: count() })
      .from(product)
      .where(where);
    const total = Number(countResult[0].count);

    const rows = await this.db
      .select()
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .where(where)
      .orderBy(asc(product.stock), desc(product.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const productIds = rows.map((r) => r.product.id);
    const imagesMap = productIds.length > 0
      ? await this.getImagesMap(productIds)
      : new Map<string, ProductImage[]>();

    const items: Product[] = rows.map(({ product: p, category: c }) => {
      const imgs = imagesMap.get(p.id) || [];
      const mainImg = imgs.find((img) => img.isMain) || imgs[0];
      return {
        ...this.mapProductRow(p),
        categoryName: c?.nameZh ?? undefined,
        mainImageUrl: mainImg?.imageUrl,
      };
    });

    return { items, total, page, pageSize };
  }

  // ===== 私有方法 =====

  private async getProductImages(productId: string): Promise<ProductImage[]> {
    const rows = await this.db
      .select()
      .from(productImage)
      .where(eq(productImage.productId, productId))
      .orderBy(asc(productImage.sort), asc(productImage.id));
    return rows.map((row) => this.mapImageRow(row));
  }

  private async getImagesMap(productIds: string[]): Promise<Map<string, ProductImage[]>> {
    const rows = await this.db
      .select()
      .from(productImage)
      .where(inArray(productImage.productId, productIds))
      .orderBy(asc(productImage.sort), asc(productImage.id));

    const map = new Map<string, ProductImage[]>();
    rows.forEach((row) => {
      const list = map.get(row.productId) || [];
      list.push(this.mapImageRow(row));
      map.set(row.productId, list);
    });
    return map;
  }

  private mapProductRow(row: typeof product.$inferSelect): Product {
    return {
      id: row.id,
      categoryId: row.categoryId ?? '',
      titleZh: row.titleZh,
      titleEn: row.titleEn,
      descZh: row.descZh ?? undefined,
      descEn: row.descEn ?? undefined,
      originalPrice: Number(row.originalPrice),
      salePrice: Number(row.salePrice),
      stock: row.stock,
      stockWarningThreshold: row.stockWarningThreshold,
      spec: row.spec as Record<string, string[]>,
      status: row.status,
      tags: row.tags as string[],
      salesCount: row.salesCount,
      sort: row.sort,
      createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
    };
  }

  private mapImageRow(row: typeof productImage.$inferSelect): ProductImage {
    return {
      id: row.id,
      productId: row.productId,
      imageUrl: row.imageUrl,
      sort: row.sort,
      isMain: row.isMain,
    };
  }
}
