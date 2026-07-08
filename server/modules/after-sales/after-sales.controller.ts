import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { AfterSalesService } from './after-sales.service';
import type {
  AfterSalesListParams,
  CreateAfterSalesRequest,
} from '@shared/api.interface';

@Controller('api/after-sales')
export class AfterSalesController {
  constructor(private readonly afterSalesService: AfterSalesService) {}

  @Post()
  @NeedLogin()
  async create(
    @Req() req: { userContext: { userId: string } },
    @Body() body: CreateAfterSalesRequest,
  ) {
    const { userId } = req.userContext;
    return this.afterSalesService.create(userId, body);
  }

  @Get()
  @NeedLogin()
  async getList(
    @Req() req: { userContext: { userId: string } },
    @Query() query: {
      status?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    const { userId } = req.userContext;
    const params: AfterSalesListParams = {
      page: query.page ? parseInt(query.page, 10) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 10,
      status: query.status,
    };
    return this.afterSalesService.getUserList(userId, params);
  }

  @Get(':id')
  @NeedLogin()
  async getDetail(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
  ) {
    const { userId } = req.userContext;
    return this.afterSalesService.getUserDetail(userId, id);
  }

  @Put(':id/return-tracking')
  @NeedLogin()
  async submitReturnTracking(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: { trackingNo: string; company: string },
  ) {
    const { userId } = req.userContext;
    return this.afterSalesService.submitReturnTracking(
      userId,
      id,
      body.trackingNo,
      body.company,
    );
  }
}
