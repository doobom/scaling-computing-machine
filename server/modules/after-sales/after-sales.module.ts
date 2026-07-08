import { Module } from '@nestjs/common';
import { AfterSalesService } from './after-sales.service';
import { AdminAfterSalesService } from './admin-after-sales.service';
import { AfterSalesController } from './after-sales.controller';
import { AdminAfterSalesController } from './admin-after-sales.controller';

@Module({
  controllers: [AfterSalesController, AdminAfterSalesController],
  providers: [AfterSalesService, AdminAfterSalesService],
})
export class AfterSalesModule {}
