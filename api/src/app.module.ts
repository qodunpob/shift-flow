import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configModule from '@/config/config.module';
import dbModule from '@/db.module';
import { SchedulesModule } from '@/schedules/schedules.module';

@Module({
  imports: [configModule, dbModule, SchedulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
