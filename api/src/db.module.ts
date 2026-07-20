import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import dbConfig from '@/config/db.config';
import {
  AssignmentEntity,
  AssignmentProposalEntity,
  ScheduleEntity,
  ShiftEntity,
  UserEntity,
} from '@/entities';

export default TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [dbConfig.KEY],

  useFactory: (config: ConfigType<typeof dbConfig>) => ({
    type: 'postgres' as const,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [
      ScheduleEntity,
      ShiftEntity,
      AssignmentEntity,
      AssignmentProposalEntity,
      UserEntity,
    ],
    synchronize: false,
  }),
});
