import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, desc, count, like, and, sql } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { payment, appOrder, systemSetting, appUser } from '@server/database/schema';
import { ReceiptService } from '../receipt/receipt.service';

export type PaymentStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'refunded';

const PAYMENT_METHODS = [
  'fps',
  'payme',
  'bank_transfer',
  'alipay_hk',
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentInfo {
  id: string;
  orderId: string;
  orderNo: string;
  paymentNo: string | null;
  amount: string;
  paymentMethod: string;
  status: PaymentStatus;
  transferVoucherUrl: string | null;
  auditStatus: string;
  auditTime: Date | null;
  auditRemark: string | null;
  transferRemark: string | null;
  paidAt: Date | null;
  createdAt?: Date;
}

export interface TransferVoucherListParams {
  page: number;
  pageSize: number;
  orderNo?: string;
  startDate?: string;
  endDate?: string;
  auditStatus?: string;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface PaymentMethodsConfig {
  [key: string]: PaymentMethodConfig;
}

export interface PaymentListParams {
  page: number;
  pageSize: number;
  paymentMethod?: string;
  status?: string;
  keyword?: string;
}

export interface PaymentListResponse {
  items: PaymentInfo[];
  total: number;
  page: number;
  pageSize: number;
}

interface PaymentMethodMeta {
  key: PaymentMethod;
  defaultConfig: Record<string, unknown>;
}

const PAYMENT_METHOD_META: PaymentMethodMeta[] = [
  {
    key: 'fps',
    defaultConfig: { merchantId: '', fpsId: '', accountName: '' },
  },
  {
    key: 'payme',
    defaultConfig: { merchantId: '', paymeLink: '' },
  },
  {
    key: 'bank_transfer',
    defaultConfig: {
      bankName: '',
      bankCode: '',
      accountNumber: '',
      accountName: '',
    },
  },
  {
    key: 'alipay_hk',
    defaultConfig: { merchantId: '', appId: '' },
  },
];

const PAYMENT_CONFIG_KEY = 'payment_methods';

type OrderRecord = typeof appOrder.$inferSelect;
type PaymentRecord = typeof payment.$inferSelect;
type SystemSettingRecord = typeof systemSetting.$inferSelect;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly receiptService: ReceiptService,
  ) {}

  // ---- Frontend: Payment Info ----

  async getPaymentByOrder(
    orderId: string,
    userId: string,
  ): Promise<PaymentInfo> {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    const payRecord = await this.findPaymentByOrderId(orderId);

    return this.toPaymentInfo(payRecord, order);
  }

  async uploadVoucher(
    orderId: string,
    userId: string,
    transferVoucherUrl: string,
  ): Promise<PaymentInfo> {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (!transferVoucherUrl || transferVoucherUrl.trim().length === 0) {
      throw new BadRequestException('Voucher URL is required');
    }

    let payRecord = await this.findPaymentByOrderId(orderId);

    if (!payRecord) {
      const paymentNo = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const inserted: PaymentRecord[] = await this.db
        .insert(payment)
        .values({
          orderId,
          paymentNo,
          amount: order.payAmount,
          paymentMethod: order.paymentMethod ?? 'bank_transfer',
          status: 'pending',
          transferVoucherUrl,
        })
        .returning();
      payRecord = inserted[0];
    } else {
      const updated: PaymentRecord[] = await this.db
        .update(payment)
        .set({ transferVoucherUrl })
        .where(eq(payment.id, payRecord.id))
        .returning();
      payRecord = updated[0];
    }

    this.logger.log(`Voucher uploaded: orderId=${orderId}`);

    return this.toPaymentInfo(payRecord, order);
  }

  async retryPayment(
    orderId: string,
    userId: string,
  ): Promise<PaymentInfo> {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (!order.paymentMethod) {
      throw new BadRequestException('Payment method not selected');
    }

    let payRecord = await this.findPaymentByOrderId(orderId);
    const paymentNo = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

    if (!payRecord) {
      const inserted: PaymentRecord[] = await this.db
        .insert(payment)
        .values({
          orderId,
          paymentNo,
          amount: order.payAmount,
          paymentMethod: order.paymentMethod,
          status: 'pending',
        })
        .returning();
      payRecord = inserted[0];
    }

    // Simulate: bank transfer stays pending, others succeed
    const isBankTransfer = order.paymentMethod === 'bank_transfer';
    const newStatus: PaymentStatus = isBankTransfer ? 'pending' : 'success';
    const now: Date | null = isBankTransfer ? null : new Date();

    const updated: PaymentRecord[] = await this.db
      .update(payment)
      .set({
        status: newStatus,
        paidAt: now,
        paymentNo,
        notifyData: { simulated: true, method: order.paymentMethod, retry: true },
      })
      .where(eq(payment.id, payRecord.id))
      .returning();

    await this.db
      .update(appOrder)
      .set({
        paymentStatus: newStatus,
        paidAt: now,
        orderStatus:
          newStatus === 'success' ? 'pending_ship' : order.orderStatus,
      })
      .where(eq(appOrder.id, orderId));

    this.logger.log(
      `Payment retried: orderId=${orderId}, method=${order.paymentMethod}, status=${newStatus}`,
    );

    return this.toPaymentInfo(updated[0], order);
  }

  // ---- Frontend: Payment Methods ----

  async getAvailablePaymentMethods(): Promise<
    { key: string; enabled: boolean; config: Record<string, unknown> }[]
  > {
    const config = await this.getPaymentMethodsConfig();
    return PAYMENT_METHOD_META.map((meta) => {
      const methodConfig = config[meta.key];
      return {
        key: meta.key,
        enabled: methodConfig?.enabled ?? false,
        config: methodConfig?.enabled ? methodConfig.config : {},
      };
    }).filter((m) => m.enabled);
  }

  // ---- Admin: Payment Settings (unified key) ----

  async getPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
    const setting = await this.findSystemSettingByKey(PAYMENT_CONFIG_KEY);
    if (!setting) {
      return this.getDefaultMethodsConfig();
    }

    const stored = setting.configValue as PaymentMethodsConfig;
    const result: PaymentMethodsConfig = {};

    for (const meta of PAYMENT_METHOD_META) {
      const storedMethod = stored[meta.key];
      result[meta.key] = {
        enabled: storedMethod?.enabled ?? false,
        config: { ...meta.defaultConfig, ...(storedMethod?.config ?? {}) },
      };
    }

    return result;
  }

  async updatePaymentMethodsConfig(
    data: PaymentMethodsConfig,
  ): Promise<PaymentMethodsConfig> {
    const existing = await this.findSystemSettingByKey(PAYMENT_CONFIG_KEY);

    const current = existing
      ? (existing.configValue as PaymentMethodsConfig)
      : {};

    const merged: PaymentMethodsConfig = {};
    for (const meta of PAYMENT_METHOD_META) {
      const dataMethod = data[meta.key];
      const currentMethod = current[meta.key];
      merged[meta.key] = {
        enabled: dataMethod?.enabled ?? currentMethod?.enabled ?? false,
        config: {
          ...meta.defaultConfig,
          ...(currentMethod?.config ?? {}),
          ...(dataMethod?.config ?? {}),
        },
      };
    }

    if (existing) {
      await this.db
        .update(systemSetting)
        .set({
          configValue: merged as unknown as Record<string, unknown>,
        })
        .where(eq(systemSetting.id, existing.id));
    } else {
      await this.db.insert(systemSetting).values({
        configKey: PAYMENT_CONFIG_KEY,
        configValue: merged as unknown as Record<string, unknown>,
        description: 'Payment methods configuration',
      });
    }

    this.logger.log('Payment methods config updated');
    return merged;
  }

  // ---- Transfer Voucher Audit ----

  async uploadTransferVoucher(
    orderId: string,
    userId: string,
    voucherUrl: string,
    transferRemark?: string,
  ): Promise<PaymentInfo> {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (!voucherUrl || voucherUrl.trim().length === 0) {
      throw new BadRequestException('Voucher URL is required');
    }

    let payRecord = await this.findPaymentByOrderId(orderId);

    if (!payRecord) {
      const paymentNo = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const inserted: PaymentRecord[] = await this.db
        .insert(payment)
        .values({
          orderId,
          paymentNo,
          amount: order.payAmount,
          paymentMethod: order.paymentMethod ?? 'bank_transfer',
          status: 'pending',
          transferVoucherUrl: voucherUrl,
          auditStatus: 'pending',
          transferRemark: transferRemark ?? null,
        })
        .returning();
      payRecord = inserted[0];
    } else {
      const updated: PaymentRecord[] = await this.db
        .update(payment)
        .set({
          transferVoucherUrl: voucherUrl,
          auditStatus: 'pending',
          auditTime: null,
          auditRemark: null,
          transferRemark: transferRemark ?? payRecord.transferRemark ?? null,
        })
        .where(eq(payment.id, payRecord.id))
        .returning();
      payRecord = updated[0];
    }

    this.logger.log(
      `Transfer voucher uploaded: orderId=${orderId}, paymentId=${payRecord.id}`,
    );

    return this.toPaymentInfo(payRecord, order);
  }

  async getTransferVoucherList(
    params: TransferVoucherListParams,
  ): Promise<PaymentListResponse> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(50, Math.max(1, params.pageSize));

    const conditions = [
      eq(payment.paymentMethod, 'bank_transfer'),
    ];
    if (params.auditStatus) {
      conditions.push(eq(payment.auditStatus, params.auditStatus));
    }

    let orderConditions: Array<ReturnType<typeof eq>> = [];
    if (params.orderNo) {
      orderConditions = [eq(appOrder.orderNo, params.orderNo)];
    }
    if (params.startDate) {
      orderConditions.push(sql`${appOrder.createdAt} >= ${params.startDate}::timestamptz` as any);
    }
    if (params.endDate) {
      orderConditions.push(sql`${appOrder.createdAt} <= ${params.endDate}::timestamptz` as any);
    }

    // 关联订单表筛选
    const baseQuery = this.db
      .select({ payment, order: appOrder })
      .from(payment)
      .innerJoin(appOrder, eq(payment.orderId, appOrder.id))
      .where(and(
        ...conditions,
        ...(orderConditions.length > 0 ? [and(...orderConditions)] : []),
      ));

    const countQuery = this.db
      .select({ count: count() })
      .from(payment)
      .innerJoin(appOrder, eq(payment.orderId, appOrder.id))
      .where(and(
        ...conditions,
        ...(orderConditions.length > 0 ? [and(...orderConditions)] : []),
      ));

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await baseQuery
      .orderBy(desc(payment.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: PaymentInfo[] = rows.map(({ payment: p, order: o }) => ({
      id: p.id,
      orderId: p.orderId,
      orderNo: o.orderNo,
      paymentNo: p.paymentNo ?? null,
      amount: String(p.amount),
      paymentMethod: p.paymentMethod,
      status: p.status as PaymentStatus,
      transferVoucherUrl: p.transferVoucherUrl ?? null,
      auditStatus: p.auditStatus,
      auditTime: p.auditTime ?? null,
      auditRemark: p.auditRemark ?? null,
      transferRemark: p.transferRemark ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
    }));

    return { items, total, page, pageSize };
  }

  async approveTransferVoucher(paymentId: string): Promise<PaymentInfo> {
    const payRecord = await this.findPaymentById(paymentId);
    if (!payRecord) {
      throw new NotFoundException('Payment record not found');
    }
    if (payRecord.auditStatus === 'approved') {
      throw new BadRequestException('Voucher already approved');
    }

    const order = await this.findOrderById(payRecord.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const now = new Date();
    const updated: PaymentRecord[] = await this.db
      .update(payment)
      .set({
        status: 'success',
        auditStatus: 'approved',
        auditTime: now,
        paidAt: now,
      })
      .where(eq(payment.id, paymentId))
      .returning();

    // 更新订单状态
    await this.db
      .update(appOrder)
      .set({
        paymentStatus: 'paid',
        orderStatus: 'pending_ship',
        paidAt: now,
      })
      .where(eq(appOrder.id, payRecord.orderId));

    // 生成电子收据
    try {
      await this.receiptService.generateReceipt(payRecord.orderId);
    } catch (err) {
      this.logger.error(
        `Failed to generate receipt after approval: orderId=${payRecord.orderId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    this.logger.log(
      `Transfer voucher approved: paymentId=${paymentId}, orderId=${payRecord.orderId}`,
    );

    return this.toPaymentInfo(updated[0], order);
  }

  async rejectTransferVoucher(
    paymentId: string,
    reason: string,
  ): Promise<PaymentInfo> {
    const payRecord = await this.findPaymentById(paymentId);
    if (!payRecord) {
      throw new NotFoundException('Payment record not found');
    }
    if (payRecord.auditStatus === 'approved') {
      throw new BadRequestException('Approved voucher cannot be rejected');
    }
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Reject reason is required');
    }

    const order = await this.findOrderById(payRecord.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const now = new Date();
    const updated: PaymentRecord[] = await this.db
      .update(payment)
      .set({
        auditStatus: 'rejected',
        auditTime: now,
        auditRemark: reason,
      })
      .where(eq(payment.id, paymentId))
      .returning();

    // 订单 payment_status 保持 pending，不释放库存
    this.logger.log(
      `Transfer voucher rejected: paymentId=${paymentId}, reason=${reason}`,
    );

    return this.toPaymentInfo(updated[0], order);
  }

  // ---- Admin: Payment Records ----

  async getPaymentRecords(
    params: PaymentListParams,
  ): Promise<PaymentListResponse> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(50, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params.paymentMethod) {
      conditions.push(eq(payment.paymentMethod, params.paymentMethod));
    }
    if (params.status) {
      conditions.push(eq(payment.status, params.status));
    }

    const baseQuery =
      conditions.length > 0
        ? this.db.select().from(payment).where(and(...conditions))
        : this.db.select().from(payment);

    const countResult = await this.db
      .select({ count: count() })
      .from(payment)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count ?? 0);

    const rows: PaymentRecord[] = await baseQuery
      .orderBy(desc(payment.createdAt))
      .limit(pageSize)
      .offset(offset);

    const orderIds = rows.map((r) => r.orderId);
    const orders =
      orderIds.length > 0
        ? await this.db
            .select()
            .from(appOrder)
            .where(
              sql`${appOrder.id} = ANY(ARRAY[${sql.join(
                orderIds.map((id) => sql`${id}`),
                sql`, `,
              )}]::uuid[])`,
            )
        : [];

    const orderMap = new Map<string, OrderRecord>();
    for (const order of orders) {
      orderMap.set(order.id, order);
    }

    const items: PaymentInfo[] = rows.map((row) => {
      const order = orderMap.get(row.orderId);
      return {
        id: row.id,
        orderId: row.orderId,
        orderNo: order?.orderNo ?? '',
        paymentNo: row.paymentNo ?? null,
        amount: String(row.amount),
        paymentMethod: row.paymentMethod,
        status: row.status as PaymentStatus,
        transferVoucherUrl: row.transferVoucherUrl ?? null,
        auditStatus: row.auditStatus ?? 'pending',
        auditTime: row.auditTime ?? null,
        auditRemark: row.auditRemark ?? null,
        transferRemark: row.transferRemark ?? null,
        paidAt: row.paidAt ?? null,
        createdAt: row.createdAt,
      };
    });

    return { items, total, page, pageSize };
  }

  async getPaymentRecordById(id: string): Promise<PaymentInfo> {
    const rows: PaymentRecord[] = await this.db
      .select()
      .from(payment)
      .where(eq(payment.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('Payment record not found');
    }

    const row = rows[0];
    const order = await this.findOrderById(row.orderId);

    return {
      id: row.id,
      orderId: row.orderId,
      orderNo: order?.orderNo ?? '',
      paymentNo: row.paymentNo ?? null,
      amount: String(row.amount),
      paymentMethod: row.paymentMethod,
      status: row.status as PaymentStatus,
      transferVoucherUrl: row.transferVoucherUrl ?? null,
      auditStatus: row.auditStatus ?? 'pending',
      auditTime: row.auditTime ?? null,
      auditRemark: row.auditRemark ?? null,
      transferRemark: row.transferRemark ?? null,
      paidAt: row.paidAt ?? null,
      createdAt: row.createdAt,
    };
  }

  // ---- Helpers ----

  private toPaymentInfo(
    payRecord: PaymentRecord | undefined,
    order: OrderRecord,
  ): PaymentInfo {
    return {
      id: payRecord?.id ?? '',
      orderId: order.id,
      orderNo: order.orderNo,
      paymentNo: payRecord?.paymentNo ?? null,
      amount: String(order.payAmount),
      paymentMethod: order.paymentMethod ?? '',
      status: (payRecord?.status as PaymentStatus) ?? 'pending',
      transferVoucherUrl: payRecord?.transferVoucherUrl ?? null,
      auditStatus: payRecord?.auditStatus ?? 'pending',
      auditTime: payRecord?.auditTime ?? null,
      auditRemark: payRecord?.auditRemark ?? null,
      transferRemark: payRecord?.transferRemark ?? null,
      paidAt: payRecord?.paidAt ?? null,
      createdAt: payRecord?.createdAt,
    };
  }

  private async findPaymentById(
    paymentId: string,
  ): Promise<PaymentRecord | undefined> {
    const rows: PaymentRecord[] = await this.db
      .select()
      .from(payment)
      .where(eq(payment.id, paymentId))
      .limit(1);
    return rows[0];
  }

  private getDefaultMethodsConfig(): PaymentMethodsConfig {
    const result: PaymentMethodsConfig = {};
    for (const meta of PAYMENT_METHOD_META) {
      result[meta.key] = {
        enabled: false,
        config: { ...meta.defaultConfig },
      };
    }
    return result;
  }

  private async findOrderById(
    orderId: string,
  ): Promise<OrderRecord | undefined> {
    const rows: OrderRecord[] = await this.db
      .select()
      .from(appOrder)
      .where(eq(appOrder.id, orderId))
      .limit(1);
    return rows[0];
  }

  private async findPaymentByOrderId(
    orderId: string,
  ): Promise<PaymentRecord | undefined> {
    const rows: PaymentRecord[] = await this.db
      .select()
      .from(payment)
      .where(eq(payment.orderId, orderId))
      .orderBy(desc(payment.createdAt))
      .limit(1);
    return rows[0];
  }

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

