import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/entities';
import { UsersHelpersService } from '@/users/users-helpers.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UsersHelpersService],
  exports: [UsersHelpersService],
})
export class UsersHelpersModule {}
