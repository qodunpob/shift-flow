import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import {
  Assignment,
  AssignmentProposal,
  Schedule,
  Shift,
  User,
} from '@/entities';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Schedule, Shift, Assignment, AssignmentProposal, User],
  migrations: [__dirname + '/migrations/**/*{.js,.ts}'],
});

export default dataSource;
