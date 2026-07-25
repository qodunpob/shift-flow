import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScheduleTimeZone1785022994243 implements MigrationInterface {
  name = 'AddScheduleTimeZone1785022994243';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD "timeZone" text NOT NULL DEFAULT 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ALTER COLUMN "timeZone" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "timeZone"`);
  }
}
