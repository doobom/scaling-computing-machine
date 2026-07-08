/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, foreignKey, index, integer, jsonb, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const receipt = pgTable("receipt", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptNo: varchar("receipt_no", { length: 50 }).notNull().unique(),
  orderId: uuid("order_id").notNull(),
  userId: uuid("user_id").notNull(),
  amount: numeric("amount").notNull().default('0'),
  paymentMethod: varchar("payment_method", { length: 30 }),
  issuedAt: customTimestamptz("issued_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("receipt_receipt_no_key").on(table.receiptNo),
  index("idx_receipt_order").on(table.orderId),
  index("idx_receipt_user").on(table.userId),
  index("idx_receipt_no").on(table.receiptNo),
]);

export const userCoupon = pgTable("user_coupon", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  couponId: uuid("coupon_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('unused'),
  usedOrderId: uuid("used_order_id"),
  usedTime: customTimestamptz("used_time", { precision: 3 }),
  expireTime: customTimestamptz("expire_time", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_user_coupon_user").on(table.userId),
  index("idx_user_coupon_status").on(table.status),
]);

export const coupon = pgTable("coupon", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameZh: varchar("name_zh", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  discountValue: numeric("discount_value").notNull().default('0'),
  minAmount: numeric("min_amount").notNull().default('0'),
  applicableScope: varchar("applicable_scope", { length: 20 }).notNull().default('all'),
  applicableIds: uuid("applicable_ids").array().notNull().default([]),
  validType: varchar("valid_type", { length: 20 }).notNull().default('fixed'),
  validDays: integer("valid_days"),
  startTime: customTimestamptz("start_time", { precision: 3 }),
  endTime: customTimestamptz("end_time", { precision: 3 }),
  totalQuantity: integer("total_quantity").notNull().default(0),
  usedQuantity: integer("used_quantity").notNull().default(0),
  perUserLimit: integer("per_user_limit").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  sort: integer("sort").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_coupon_status").on(table.status),
  index("idx_coupon_type").on(table.type),
]);

export const afterSalesImage = pgTable("after_sales_image", {
  id: uuid("id").primaryKey().defaultRandom(),
  afterSalesId: uuid("after_sales_id").notNull(),
  imageUrl: text("image_url").notNull(),
  sort: integer("sort").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_after_sales_image_as").on(table.afterSalesId),
]);

export const afterSales = pgTable("after_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  afterSalesNo: varchar("after_sales_no", { length: 50 }).notNull().unique(),
  orderId: uuid("order_id").notNull(),
  userId: uuid("user_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  reason: varchar("reason", { length: 100 }).notNull(),
  description: text("description"),
  refundAmount: numeric("refund_amount").notNull().default('0'),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  returnTrackingNo: varchar("return_tracking_no", { length: 100 }),
  returnCompany: varchar("return_company", { length: 50 }),
  rejectReason: text("reject_reason"),
  auditTime: customTimestamptz("audit_time", { precision: 3 }),
  refundTime: customTimestamptz("refund_time", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("after_sales_after_sales_no_key").on(table.afterSalesNo),
  index("idx_after_sales_order").on(table.orderId),
  index("idx_after_sales_user").on(table.userId),
  index("idx_after_sales_status").on(table.status),
  index("idx_after_sales_no").on(table.afterSalesNo),
]);

export const favorite = pgTable("favorite", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productId: uuid("product_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_favorite_user_product").on(table.userId, table.productId),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "favorite_user_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.productId],
    foreignColumns: [product.id],
    name: "favorite_product_id_fkey",
  }).onDelete("cascade"),
]);

export const operationLog = pgTable("operation_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id"),
  operationType: varchar("operation_type", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id"),
  content: text("content"),
  ipAddress: varchar("ip_address", { length: 50 }),
  beforeValue: jsonb("before_value").notNull().default('{}'),
  afterValue: jsonb("after_value").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_operation_log_admin").on(table.adminId),
  index("idx_operation_log_type").on(table.operationType, table.targetType),
  index("idx_operation_log_created").on(table.createdAt),
  foreignKey({
    columns: [table.adminId],
    foreignColumns: [admin.id],
    name: "operation_log_admin_id_fkey",
  }),
]);

export const systemSetting = pgTable("system_setting", {
  id: uuid("id").primaryKey().defaultRandom(),
  configKey: varchar("config_key", { length: 100 }).notNull().unique(),
  /**
   * @type { Record<string, any> }
   */
  configValue: jsonb("config_value").notNull().default('{}'),
  description: varchar("description", { length: 255 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("system_setting_config_key_key").on(table.configKey),
]);

export const banner = pgTable("banner", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  titleZh: varchar("title_zh", { length: 255 }),
  titleEn: varchar("title_en", { length: 255 }),
  subtitleZh: varchar("subtitle_zh", { length: 255 }),
  subtitleEn: varchar("subtitle_en", { length: 255 }),
  jumpUrl: varchar("jump_url", { length: 500 }),
  sort: integer("sort").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('enabled'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_banner_status").on(table.status),
  index("idx_banner_sort").on(table.sort),
]);

export const promotion = pgTable("promotion", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameZh: varchar("name_zh", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  thresholdAmount: numeric("threshold_amount").notNull().default('0'),
  discountAmount: numeric("discount_amount").notNull().default('0'),
  startTime: customTimestamptz("start_time", { precision: 3 }).notNull(),
  endTime: customTimestamptz("end_time", { precision: 3 }).notNull(),
  applicableScope: varchar("applicable_scope", { length: 20 }).notNull().default('all'),
  applicableIds: uuid("applicable_ids").array().notNull().default([]),
  allowStack: boolean("allow_stack").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  sort: integer("sort").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_promotion_status").on(table.status),
  index("idx_promotion_time").on(table.startTime, table.endTime),
]);

export const discount = pgTable("discount", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameZh: varchar("name_zh", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  discountRate: numeric("discount_rate").notNull(),
  startTime: customTimestamptz("start_time", { precision: 3 }).notNull(),
  endTime: customTimestamptz("end_time", { precision: 3 }).notNull(),
  applicableScope: varchar("applicable_scope", { length: 20 }).notNull().default('all'),
  applicableIds: uuid("applicable_ids").array().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  sort: integer("sort").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_discount_status").on(table.status),
  index("idx_discount_time").on(table.startTime, table.endTime),
]);

export const payment = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  paymentNo: varchar("payment_no", { length: 100 }).unique(),
  amount: numeric("amount").notNull().default('0'),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(),
  transferVoucherUrl: text("transfer_voucher_url"),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  /**
   * @type { Record<string, any> }
   */
  notifyData: jsonb("notify_data").notNull().default('{}'),
  paidAt: customTimestamptz("paid_at", { precision: 3 }),
  auditStatus: varchar("audit_status", { length: 20 }).notNull().default('pending'),
  auditTime: customTimestamptz("audit_time", { precision: 3 }),
  auditRemark: text("audit_remark"),
  transferRemark: varchar("transfer_remark", { length: 255 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("payment_payment_no_key").on(table.paymentNo),
  index("idx_payment_order").on(table.orderId),
  index("idx_payment_status").on(table.status),
  foreignKey({
    columns: [table.orderId],
    foreignColumns: [appOrder.id],
    name: "payment_order_id_fkey",
  }),
]);

export const orderItem = pgTable("order_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  productId: uuid("product_id").notNull(),
  productTitleZh: varchar("product_title_zh", { length: 255 }).notNull(),
  productTitleEn: varchar("product_title_en", { length: 255 }).notNull(),
  productImageUrl: text("product_image_url"),
  /**
   * @type { Record<string, string> }
   */
  spec: jsonb("spec").notNull().default('{}'),
  quantity: integer("quantity").notNull().default(1),
  originalPrice: numeric("original_price").notNull().default('0'),
  salePrice: numeric("sale_price").notNull().default('0'),
  subtotal: numeric("subtotal").notNull().default('0'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_order_item_order").on(table.orderId),
  index("idx_order_item_product").on(table.productId),
  foreignKey({
    columns: [table.orderId],
    foreignColumns: [appOrder.id],
    name: "order_item_order_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.productId],
    foreignColumns: [product.id],
    name: "order_item_product_id_fkey",
  }),
]);

export const appOrder = pgTable("app_order", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNo: varchar("order_no", { length: 50 }).notNull().unique(),
  userId: uuid("user_id").notNull(),
  addressId: uuid("address_id"),
  totalAmount: numeric("total_amount").notNull().default('0'),
  discountAmount: numeric("discount_amount").notNull().default('0'),
  shippingFee: numeric("shipping_fee").notNull().default('0'),
  payAmount: numeric("pay_amount").notNull().default('0'),
  paymentMethod: varchar("payment_method", { length: 30 }),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default('pending'),
  orderStatus: varchar("order_status", { length: 20 }).notNull().default('pending_pay'),
  shippingNo: varchar("shipping_no", { length: 100 }),
  shippingCompany: varchar("shipping_company", { length: 50 }),
  remark: text("remark"),
  expireTime: customTimestamptz("expire_time", { precision: 3 }),
  paidAt: customTimestamptz("paid_at", { precision: 3 }),
  shippedAt: customTimestamptz("shipped_at", { precision: 3 }),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("app_order_order_no_key").on(table.orderNo),
  index("idx_order_user").on(table.userId),
  index("idx_order_no").on(table.orderNo),
  index("idx_order_status").on(table.orderStatus),
  index("idx_order_payment_status").on(table.paymentStatus),
  index("idx_order_created").on(table.createdAt),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "app_order_user_id_fkey",
  }),
  foreignKey({
    columns: [table.addressId],
    foreignColumns: [address.id],
    name: "app_order_address_id_fkey",
  }),
]);

export const cart = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productId: uuid("product_id").notNull(),
  /**
   * @type { Record<string, string> }
   */
  spec: jsonb("spec").notNull().default('{}'),
  quantity: integer("quantity").notNull().default(1),
  expireAt: customTimestamptz("expire_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_cart_user").on(table.userId),
  index("idx_cart_product").on(table.productId),
  uniqueIndex("idx_cart_user_product_spec").on(table.userId, table.productId),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "cart_user_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.productId],
    foreignColumns: [product.id],
    name: "cart_product_id_fkey",
  }),
]);

export const address = pgTable("address", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  receiverName: varchar("receiver_name", { length: 100 }).notNull(),
  receiverPhone: varchar("receiver_phone", { length: 50 }).notNull(),
  region: varchar("region", { length: 255 }).notNull(),
  detailAddress: text("detail_address").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_address_user").on(table.userId),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "address_user_id_fkey",
  }).onDelete("cascade"),
]);

export const appUser = pgTable("app_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  nickname: varchar("nickname", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  avatarUrl: text("avatar_url"),
  memberLevelId: uuid("member_level_id"),
  totalConsumption: numeric("total_consumption").notNull().default('0'),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  userId: varchar("user_id", { length: 100 }).unique(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("app_user_user_id_key").on(table.userId),
  index("idx_app_user_phone").on(table.phone),
  index("idx_app_user_status").on(table.status),
  foreignKey({
    columns: [table.memberLevelId],
    foreignColumns: [memberLevel.id],
    name: "app_user_member_level_id_fkey",
  }),
]);

export const productImage = pgTable("product_image", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull(),
  imageUrl: text("image_url").notNull(),
  sort: integer("sort").notNull().default(0),
  isMain: boolean("is_main").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_product_image_product").on(table.productId),
  foreignKey({
    columns: [table.productId],
    foreignColumns: [product.id],
    name: "product_image_product_id_fkey",
  }).onDelete("cascade"),
]);

export const product = pgTable("product", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id"),
  titleZh: varchar("title_zh", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  descZh: text("desc_zh"),
  descEn: text("desc_en"),
  originalPrice: numeric("original_price").notNull().default('0'),
  salePrice: numeric("sale_price").notNull().default('0'),
  stock: integer("stock").notNull().default(0),
  stockWarningThreshold: integer("stock_warning_threshold").notNull().default(10),
  /**
   * @type { Record<string, string[]> }
   */
  spec: jsonb("spec").notNull().default('{}'),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  tags: varchar("tags", { length: 100 }).array().notNull().default([]),
  salesCount: integer("sales_count").notNull().default(0),
  sort: integer("sort").notNull().default(0),
  version: integer("version").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_product_category").on(table.categoryId),
  index("idx_product_status").on(table.status),
  index("idx_product_title_zh").on(table.titleZh),
  index("idx_product_sales").on(table.salesCount),
  foreignKey({
    columns: [table.categoryId],
    foreignColumns: [category.id],
    name: "product_category_id_fkey",
  }),
]);

export const category = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),
  nameZh: varchar("name_zh", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  iconUrl: text("icon_url"),
  sort: integer("sort").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('enabled'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_category_parent").on(table.parentId),
  index("idx_category_status").on(table.status),
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [category.id],
    name: "category_parent_id_fkey",
  }),
]);

export const admin = pgTable("admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  realName: varchar("real_name", { length: 100 }),
  roleId: uuid("role_id"),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("admin_username_key").on(table.username),
  index("idx_admin_username").on(table.username),
  foreignKey({
    columns: [table.roleId],
    foreignColumns: [adminRole.id],
    name: "admin_role_id_fkey",
  }),
]);

export const adminRole = pgTable("admin_role", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  permissions: text("permissions").array().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const memberLevel = pgTable("member_level", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameZh: varchar("name_zh", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  minConsumption: numeric("min_consumption").notNull().default('0'),
  discountRate: numeric("discount_rate").notNull().default('1.00'),
  iconUrl: text("icon_url"),
  sort: integer("sort").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  freeShipping: boolean("free_shipping").notNull().default(false),
  freeShippingMin: numeric("free_shipping_min").notNull().default('0'),
  hasVipService: boolean("has_vip_service").notNull().default(false),
  birthdayCoupon: boolean("birthday_coupon").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// table aliases
export const addressTable = address;
export const adminTable = admin;
export const adminRoleTable = adminRole;
export const afterSalesTable = afterSales;
export const afterSalesImageTable = afterSalesImage;
export const appOrderTable = appOrder;
export const appUserTable = appUser;
export const bannerTable = banner;
export const cartTable = cart;
export const categoryTable = category;
export const couponTable = coupon;
export const discountTable = discount;
export const favoriteTable = favorite;
export const memberLevelTable = memberLevel;
export const operationLogTable = operationLog;
export const orderItemTable = orderItem;
export const paymentTable = payment;
export const productTable = product;
export const productImageTable = productImage;
export const promotionTable = promotion;
export const receiptTable = receipt;
export const systemSettingTable = systemSetting;
export const userCouponTable = userCoupon;
