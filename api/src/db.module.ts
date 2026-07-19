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

  useFactory: (db: ConfigType<typeof dbConfig>) => ({
    type: 'postgres' as const,
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    entities: [Schedule, Shift, Assignment, AssignmentProposal, User],
    synchronize: false,
  }),
});
