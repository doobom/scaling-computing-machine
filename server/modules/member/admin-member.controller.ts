import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { Logger } from '@nestjs/common';

interface CreateLevelDto {
  nameZh: string;
  nameEn: string;
  minConsumption: string;
  discountRate: string;
  iconUrl?: string;
  sort?: number;
}

interface UpdateLevelDto {
  nameZh?: string;
  nameEn?: string;
  minConsumption?: string;
  discountRate?: string;
  iconUrl?: string;
  sort?: number;
  status?: string;
}

interface UpdateLevelIdDto {
  memberLevelId: string;
}

interface UpdateStatusDto {
  status: string;
}

@Controller('api/admin')
export class AdminMemberController {
  private readonly logger = new Logger(AdminMemberController.name);

  constructor(private readonly memberService: MemberService) {}

  // ==================== 用户管理 ====================

  @Get('users')
  async getMembers(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10));
    return this.memberService.getAdminMembers(p, ps, keyword, status);
  }

  @Get('users/:id')
  async getMemberDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.memberService.getAdminMemberDetail(id);
  }

  @Patch('users/:id/status')
  async updateMemberStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateStatusDto,
  ) {
    this.logger.log(`Update member status: ${id} -> ${body.status}`);
    await this.memberService.updateMemberStatus(id, body.status);
    return { success: true };
  }

  @Patch('users/:id/level')
  async updateMemberLevel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLevelIdDto,
  ) {
    this.logger.log(`Update member level: ${id} -> ${body.memberLevelId}`);
    await this.memberService.updateMemberLevel(id, body.memberLevelId);
    return { success: true };
  }

  // ==================== 会员等级管理 ====================

  @Get('member-levels')
  async getMemberLevels() {
    return this.memberService.getMemberLevels();
  }

  @Post('member-levels')
  async createMemberLevel(@Body() body: CreateLevelDto) {
    this.logger.log(`Create member level: ${body.nameZh}`);
    return this.memberService.createMemberLevel(body);
  }

  @Put('member-levels/:id')
  async updateMemberLevelInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLevelDto,
  ) {
    this.logger.log(`Update member level: ${id}`);
    return this.memberService.updateMemberLevelInfo(id, body);
  }

  @Delete('member-levels/:id')
  async deleteMemberLevel(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Delete member level: ${id}`);
    await this.memberService.deleteMemberLevel(id);
    return { success: true };
  }
}
