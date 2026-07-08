import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { operationLog } from '@server/database/schema';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async logOperation(params: {
    adminId: string;
    operationType: string;
    targetType: string;
    targetId: string;
    content: string;
    beforeValue?: unknown;
    afterValue?: unknown;
    ip?: string;
  }): Promise<void> {
    try {
      await this.db.insert(operationLog).values({
        adminId: params.adminId,
        operationType: params.operationType,
        targetType: params.targetType,
        targetId: params.targetId,
        content: params.content,
        ipAddress: params.ip,
        beforeValue: params.beforeValue ? (params.beforeValue as Record<string, unknown>) : {},
        afterValue: params.afterValue ? (params.afterValue as Record<string, unknown>) : {},
      });
    } catch (err) {
      this.logger.error(`Failed to log operation: ${JSON.stringify(err)}`);
    }
  }
}
