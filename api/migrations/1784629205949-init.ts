import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1784629205949 implements MigrationInterface {
    name = 'Init1784629205949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_roles_enum" AS ENUM('EMPLOYEE', 'MANAGER', 'APPROVER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE, "password" text NOT NULL, "firstName" text NOT NULL, "lastName" text NOT NULL, "emailAddress" text NOT NULL, "roles" "public"."users_roles_enum" array NOT NULL, CONSTRAINT "UQ_0a15e52405edda3ea73124ab407" UNIQUE ("emailAddress"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_proposals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE, "shiftId" uuid NOT NULL, "employeeId" uuid NOT NULL, "message" text, CONSTRAINT "PK_bc4b12ae086c2c5a499dd1fb7de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."schedules_status_enum" AS ENUM('DRAFT', 'IN_REVIEW', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE, "label" text, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."schedules_status_enum" NOT NULL DEFAULT 'DRAFT', "rejectionReason" text, CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shifts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE, "scheduleId" uuid NOT NULL, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "requiredHeadcount" integer NOT NULL, CONSTRAINT "CHK_5b80312a10dbd8b977866d12c4" CHECK ("requiredHeadcount" BETWEEN 1 AND 10), CONSTRAINT "PK_84d692e367e4d6cdf045828768c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignments_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`);
        await queryRunner.query(`CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE, "shiftId" uuid NOT NULL, "employeeId" uuid NOT NULL, "status" "public"."assignments_status_enum" NOT NULL DEFAULT 'PENDING', "declineReason" text, CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment_proposals" ADD CONSTRAINT "FK_13af30135b0ef88b342f69524f4" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_proposals" ADD CONSTRAINT "FK_d4d82c3c3f080639c4f03cfb0cb" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shifts" ADD CONSTRAINT "FK_99de60c4b123a0bc1b2126c530b" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_f4a2aa95618490afc8139b1b3e4" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_731a69ec38c0292449a07e34f4b" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_731a69ec38c0292449a07e34f4b"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_f4a2aa95618490afc8139b1b3e4"`);
        await queryRunner.query(`ALTER TABLE "shifts" DROP CONSTRAINT "FK_99de60c4b123a0bc1b2126c530b"`);
        await queryRunner.query(`ALTER TABLE "assignment_proposals" DROP CONSTRAINT "FK_d4d82c3c3f080639c4f03cfb0cb"`);
        await queryRunner.query(`ALTER TABLE "assignment_proposals" DROP CONSTRAINT "FK_13af30135b0ef88b342f69524f4"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`DROP TYPE "public"."assignments_status_enum"`);
        await queryRunner.query(`DROP TABLE "shifts"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`DROP TYPE "public"."schedules_status_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_proposals"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
    }

}
