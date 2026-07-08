import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from "@lark-apaas/fullstack-nestjs-core";
import { eq, and, desc } from 'drizzle-orm';
import { address, appUser } from '@server/database/schema';
import type { Address } from '@shared/api.interface';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

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

  async getList(userId: string): Promise<Address[]> {
    const appUserId = await this.resolveAppUserId(userId);
    const rows = await this.db
      .select()
      .from(address)
      .where(eq(address.userId, appUserId))
      .orderBy(desc(address.isDefault), address.createdAt);
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      region: row.region,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    }));
  }

  async create(userId: string, data: Omit<Address, 'id' | 'userId' | 'isDefault'> & { isDefault?: boolean }): Promise<Address> {
    const appUserId = await this.resolveAppUserId(userId);
    const isDefault = data.isDefault ?? false;
    if (isDefault) {
      await this.db
        .update(address)
        .set({ isDefault: false })
        .where(eq(address.userId, appUserId));
    }
    const inserted = await this.db
      .insert(address)
      .values({
        userId: appUserId,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        region: data.region,
        detailAddress: data.detailAddress,
        isDefault,
      })
      .returning();
    const row = inserted[0];
    return {
      id: row.id,
      userId: row.userId,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      region: row.region,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    };
  }

  async update(userId: string, id: string, data: Partial<Omit<Address, 'id' | 'userId'>>): Promise<Address> {
    const appUserId = await this.resolveAppUserId(userId);
    const existing = await this.db
      .select()
      .from(address)
      .where(and(eq(address.id, id), eq(address.userId, appUserId)))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Address not found');
    }
    if (data.isDefault) {
      await this.db
        .update(address)
        .set({ isDefault: false })
        .where(eq(address.userId, appUserId));
    }
    const updated = await this.db
      .update(address)
      .set(data)
      .where(and(eq(address.id, id), eq(address.userId, appUserId)))
      .returning();
    const row = updated[0];
    return {
      id: row.id,
      userId: row.userId,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      region: row.region,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const appUserId = await this.resolveAppUserId(userId);
    const deleted = await this.db
      .delete(address)
      .where(and(eq(address.id, id), eq(address.userId, appUserId)))
      .returning({ id: address.id });
    if (deleted.length === 0) {
      throw new NotFoundException('Address not found');
    }
  }

  async setDefault(userId: string, id: string): Promise<Address> {
    const appUserId = await this.resolveAppUserId(userId);
    const existing = await this.db
      .select()
      .from(address)
      .where(and(eq(address.id, id), eq(address.userId, appUserId)))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Address not found');
    }

    await this.db
      .update(address)
      .set({ isDefault: false })
      .where(eq(address.userId, appUserId));

    const updated = await this.db
      .update(address)
      .set({ isDefault: true })
      .where(and(eq(address.id, id), eq(address.userId, appUserId)))
      .returning();
    const row = updated[0];
    return {
      id: row.id,
      userId: row.userId,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      region: row.region,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    };
  }

  async getById(userId: string, id: string): Promise<Address | null> {
    const appUserId = await this.resolveAppUserId(userId);
    const rows = await this.db
      .select()
      .from(address)
      .where(and(eq(address.id, id), eq(address.userId, appUserId)))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      userId: row.userId,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      region: row.region,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    };
  }
}
