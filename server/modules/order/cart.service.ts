import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from "@lark-apaas/fullstack-nestjs-core";
import { eq, and, inArray, sql } from 'drizzle-orm';
import { cart, product, productImage, appUser } from '@server/database/schema';
import type { CartListResponse, CartItem } from '@shared/api.interface';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private async resolveAppUserId(userId: string): Promise<string> {
    const rows = await this.db
      .select({ id: appUser.id })
      .from(appUser)
      .where(eq(appUser.userId, userId))
      .limit(1);
    if (rows.length > 0) return rows[0].id;
    const inserted = await this.db
      .insert(appUser)
      .values({ userId, nickname: '會員', status: 'active', totalConsumption: '0' })
      .returning({ id: appUser.id });
    return inserted[0].id;
  }

  async getCartList(userId: string): Promise<CartListResponse> {
    const appUserId = await this.resolveAppUserId(userId);
    const rows = await this.db
      .select({
        id: cart.id,
        productId: cart.productId,
        spec: cart.spec,
        quantity: cart.quantity,
        expireAt: cart.expireAt,
        titleZh: product.titleZh,
        titleEn: product.titleEn,
        salePrice: product.salePrice,
        originalPrice: product.originalPrice,
        imageUrl: productImage.imageUrl,
      })
      .from(cart)
      .leftJoin(product, eq(cart.productId, product.id))
      .leftJoin(productImage, and(
        eq(productImage.productId, product.id),
        eq(productImage.isMain, true),
      ))
      .where(eq(cart.userId, appUserId))
      .orderBy(cart.createdAt);

    const items: CartItem[] = rows.map((row) => {
      const price = Number(row.salePrice ?? 0);
      const quantity = row.quantity ?? 0;
      return {
        id: row.id,
        productId: row.productId,
        productTitleZh: row.titleZh ?? '',
        productTitleEn: row.titleEn ?? '',
        productImageUrl: row.imageUrl ?? '',
        spec: row.spec as Record<string, string>,
        quantity,
        price,
        subtotal: price * quantity,
        expireAt: row.expireAt ? row.expireAt.toISOString() : undefined,
      };
    });

    const totalAmount = items.reduce((sum: number, item: CartItem) => sum + item.subtotal, 0);
    const totalQuantity = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

    return { items, totalAmount, totalQuantity };
  }

  async addItem(userId: string, productId: string, spec: Record<string, string>, quantity: number): Promise<CartItem> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    const appUserId = await this.resolveAppUserId(userId);

    const productRows = await this.db.select().from(product).where(eq(product.id, productId)).limit(1);
    if (productRows.length === 0) {
      throw new NotFoundException('Product not found');
    }
    const prod = productRows[0];

    const existingRows = await this.db
      .select()
      .from(cart)
      .where(and(eq(cart.userId, appUserId), eq(cart.productId, productId)))
      .limit(1);

    let cartId: string;
    let finalQuantity: number;

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      finalQuantity = existing.quantity + quantity;
      await this.db
        .update(cart)
        .set({ quantity: finalQuantity })
        .where(eq(cart.id, existing.id));
      cartId = existing.id;
    } else {
      finalQuantity = quantity;
      const inserted = await this.db
        .insert(cart)
        .values({
          userId: appUserId,
          productId,
          spec,
          quantity,
        })
        .returning({ id: cart.id });
      cartId = inserted[0].id;
    }

    const price = Number(prod.salePrice ?? 0);
    const imgRows = await this.db
      .select({ imageUrl: productImage.imageUrl })
      .from(productImage)
      .where(and(eq(productImage.productId, productId), eq(productImage.isMain, true)))
      .limit(1);

    return {
      id: cartId,
      productId: prod.id,
      productTitleZh: prod.titleZh,
      productTitleEn: prod.titleEn,
      productImageUrl: imgRows[0]?.imageUrl ?? '',
      spec,
      quantity: finalQuantity,
      price,
      subtotal: price * finalQuantity,
    };
  }

  async updateQuantity(userId: string, id: string, quantity: number): Promise<void> {
    const appUserId = await this.resolveAppUserId(userId);
    if (quantity <= 0) {
      const deleted = await this.db
        .delete(cart)
        .where(and(eq(cart.id, id), eq(cart.userId, appUserId)))
        .returning({ id: cart.id });
      if (deleted.length === 0) {
        throw new NotFoundException('Cart item not found');
      }
      return;
    }
    const updated = await this.db
      .update(cart)
      .set({ quantity })
      .where(and(eq(cart.id, id), eq(cart.userId, appUserId)))
      .returning({ id: cart.id });
    if (updated.length === 0) {
      throw new NotFoundException('Cart item not found');
    }
  }

  async removeItem(userId: string, id: string): Promise<void> {
    const appUserId = await this.resolveAppUserId(userId);
    const deleted = await this.db
      .delete(cart)
      .where(and(eq(cart.id, id), eq(cart.userId, appUserId)))
      .returning({ id: cart.id });
    if (deleted.length === 0) {
      throw new NotFoundException('Cart item not found');
    }
  }

  async clearCart(userId: string): Promise<void> {
    const appUserId = await this.resolveAppUserId(userId);
    await this.db.delete(cart).where(eq(cart.userId, appUserId));
  }

  async getCartItemsByIds(userId: string, ids: string[]): Promise<Array<{
    id: string;
    productId: string;
    spec: Record<string, string>;
    quantity: number;
    productTitleZh: string;
    productTitleEn: string;
    productImageUrl: string;
    salePrice: number;
    originalPrice: number;
    stock: number;
  }>> {
    if (ids.length === 0) return [];
    const appUserId = await this.resolveAppUserId(userId);
    const rows = await this.db
      .select({
        id: cart.id,
        productId: cart.productId,
        spec: cart.spec,
        quantity: cart.quantity,
        titleZh: product.titleZh,
        titleEn: product.titleEn,
        salePrice: product.salePrice,
        originalPrice: product.originalPrice,
        stock: product.stock,
        imageUrl: productImage.imageUrl,
      })
      .from(cart)
      .leftJoin(product, eq(cart.productId, product.id))
      .leftJoin(productImage, and(
        eq(productImage.productId, product.id),
        eq(productImage.isMain, true),
      ))
      .where(and(eq(cart.userId, appUserId), inArray(cart.id, ids)));

    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      spec: row.spec as Record<string, string>,
      quantity: row.quantity,
      productTitleZh: row.titleZh ?? '',
      productTitleEn: row.titleEn ?? '',
      productImageUrl: row.imageUrl ?? '',
      salePrice: Number(row.salePrice ?? 0),
      originalPrice: Number(row.originalPrice ?? 0),
      stock: row.stock ?? 0,
    }));
  }

  async removeCartItems(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const appUserId = await this.resolveAppUserId(userId);
    await this.db.delete(cart).where(and(eq(cart.userId, appUserId), inArray(cart.id, ids)));
  }
}
