import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { FavoriteController } from './favorite.controller';
import { AdminMemberController } from './admin-member.controller';

@Module({
  controllers: [MemberController, FavoriteController, AdminMemberController],
  providers: [MemberService],
})
export class MemberModule {}
