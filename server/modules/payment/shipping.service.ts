import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { systemSetting } from '@server/database/schema';

export interface ShippingRule {
  id: string;
  region: string;
  minWeight: number;
  maxWeight: number;
  fee: number;
}

export interface ShippingTemplate {
  freeShippingThreshold: number;
  baseFee: number;
  description: string;
  rules: ShippingRule[];
}

export interface SfExpressConfig {
  enabled: boolean;
  monthlyAccount: string;
  customerCode: string;
  apiKey: string;
  apiUrl: string;
  testMode: boolean;
}

const SHIPPING_CONFIG_KEY = 'shipping_template';
const SF_EXPRESS_CONFIG_KEY = 'sf_express_config';

const DEFAULT_TEMPLATE: ShippingTemplate = {
  freeShippingThreshold: 299,
  baseFee: 30,
  description: '',
  rules: [
    { id: '1', region: '香港島', minWeight: 0, maxWeight: 5, fee: 30 },
    { id: '2', region: '九龍', minWeight: 0, maxWeight: 5, fee: 30 },
    { id: '3', region: '新界', minWeight: 0, maxWeight: 5, fee: 40 },
    { id: '4', region: '離島', minWeight: 0, maxWeight: 5, fee: 60 },
  ],
};

const DEFAULT_SF_CONFIG: SfExpressConfig = {
  enabled: false,
  monthlyAccount: '',
  customerCode: '',
  apiKey: '',
  apiUrl: '',
  testMode: true,
};

type SystemSettingRecord = typeof systemSetting.$inferSelect;

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ---- Shipping Template ----

  async getShippingTemplate(): Promise<ShippingTemplate> {
    const setting = await this.findSystemSettingByKey(SHIPPING_CONFIG_KEY);

    if (setting) {
      const value = setting.configValue as Partial<ShippingTemplate>;
      return {
        freeShippingThreshold:
          value.freeShippingThreshold ??
          DEFAULT_TEMPLATE.freeShippingThreshold,
        baseFee: value.baseFee ?? DEFAULT_TEMPLATE.baseFee,
        description: value.description ?? DEFAULT_TEMPLATE.description,
        rules: value.rules ?? DEFAULT_TEMPLATE.rules,
      };
    }

    return DEFAULT_TEMPLATE;
  }

  async updateShippingTemplate(
    data: Partial<ShippingTemplate>,
  ): Promise<ShippingTemplate> {
    const existing = await this.findSystemSettingByKey(SHIPPING_CONFIG_KEY);

    const current = existing
      ? (existing.configValue as Partial<ShippingTemplate>)
      : {};

    const merged: ShippingTemplate = {
      freeShippingThreshold:
        data.freeShippingThreshold ??
        current.freeShippingThreshold ??
        DEFAULT_TEMPLATE.freeShippingThreshold,
      baseFee: data.baseFee ?? current.baseFee ?? DEFAULT_TEMPLATE.baseFee,
      description:
        data.description ?? current.description ?? DEFAULT_TEMPLATE.description,
      rules: data.rules ?? current.rules ?? DEFAULT_TEMPLATE.rules,
    };

    if (existing) {
      await this.db
        .update(systemSetting)
        .set({ configValue: merged as unknown as Record<string, unknown> })
        .where(eq(systemSetting.id, existing.id));
    } else {
      await this.db.insert(systemSetting).values({
        configKey: SHIPPING_CONFIG_KEY,
        configValue: merged as unknown as Record<string, unknown>,
        description: 'Shipping template configuration',
      });
    }

    this.logger.log('Shipping template updated');
    return merged;
  }

  // ---- SF Express ----

  async getSfExpressConfig(): Promise<SfExpressConfig> {
    const setting = await this.findSystemSettingByKey(SF_EXPRESS_CONFIG_KEY);

    if (setting) {
      const value = setting.configValue as Partial<SfExpressConfig>;
      return {
        ...DEFAULT_SF_CONFIG,
        ...value,
      };
    }

    return DEFAULT_SF_CONFIG;
  }

  async updateSfExpressConfig(
    data: Partial<SfExpressConfig>,
  ): Promise<SfExpressConfig> {
    const existing = await this.findSystemSettingByKey(SF_EXPRESS_CONFIG_KEY);

    const current = existing
      ? (existing.configValue as Partial<SfExpressConfig>)
      : {};

    const merged: SfExpressConfig = {
      ...DEFAULT_SF_CONFIG,
      ...current,
      ...data,
    };

    if (existing) {
      await this.db
        .update(systemSetting)
        .set({ configValue: merged as unknown as Record<string, unknown> })
        .where(eq(systemSetting.id, existing.id));
    } else {
      await this.db.insert(systemSetting).values({
        configKey: SF_EXPRESS_CONFIG_KEY,
        configValue: merged as unknown as Record<string, unknown>,
        description: 'SF Express configuration',
      });
    }

    this.logger.log('SF Express config updated');
    return merged;
  }

  // ---- Shipping Calculation ----

  /**
   * Simple shipping fee calculation based on total amount.
   * Free shipping if total >= threshold, otherwise charge base fee.
   * Default: free over HK$299, otherwise HK$30
   */
  calculateShipping(totalAmount: number): number {
    if (totalAmount >= DEFAULT_TEMPLATE.freeShippingThreshold) {
      return 0;
    }
    return DEFAULT_TEMPLATE.baseFee;
  }

  /**
   * Advanced shipping fee calculation with region and weight rules.
   */
  calculateShippingFee(
    totalAmount: number,
    region: string,
    weight: number,
    template: ShippingTemplate,
  ): number {
    if (totalAmount >= template.freeShippingThreshold) {
      return 0;
    }

    const matchedRule = template.rules.find(
      (rule: ShippingRule) =>
        rule.region === region &&
        weight >= rule.minWeight &&
        weight < rule.maxWeight,
    );

    if (matchedRule) {
      return matchedRule.fee;
    }

    return template.baseFee;
  }

  // ---- Helpers ----

  private async findSystemSettingByKey(
    key: string,
  ): Promise<SystemSettingRecord | undefined> {
    const rows: SystemSettingRecord[] = await this.db
      .select()
      .from(systemSetting)
      .where(eq(systemSetting.configKey, key))
      .limit(1);
    return rows[0];
  }
}
