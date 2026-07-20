import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import {
  AssignmentEntity,
  AssignmentProposalEntity,
  ScheduleEntity,
  ShiftEntity,
  UserEntity,
} from '@/entities';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    ScheduleEntity,
    ShiftEntity,
    AssignmentEntity,
    AssignmentProposalEntity,
    UserEntity,
  ],
  migrations: [__dirname + '/migrations/**/*{.js,.ts}'],
});

export default dataSource;
