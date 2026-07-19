import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import dbConfig from '@/config/db.config';
import {
  Assignment,
  AssignmentProposal,
  Schedule,
  Shift,
  User,
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
    entities: [Schedule, Shift, Assignment, AssignmentProposal, User],
    synchronize: false,
  }),
});
