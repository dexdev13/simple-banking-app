import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1783258742068 implements MigrationInterface {
  name = 'InitSchema1783258742068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('deposit', 'withdraw', 'transfer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'success', 'failed')`,
    );
    await queryRunner.query(`CREATE TABLE "transactions" ("id" character varying(24) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "from_account_id" character varying(24), "to_account_id" character varying(24), "amount" numeric(18,2) NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'pending', "description" character varying(255), "idempotency_key" character varying(64), CONSTRAINT "chk_transactions_type_consistency" CHECK (
    (type = 'deposit'  AND from_account_id IS NULL     AND to_account_id IS NOT NULL) OR
    (type = 'withdraw' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
    (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL)
  ), CONSTRAINT "chk_transactions_amount_positive" CHECK ("amount" > 0), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_transactions_idempotency_key_active" ON "transactions"  ("idempotency_key") WHERE "idempotency_key" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_status_created" ON "transactions"  ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_to_account_created" ON "transactions"  ("to_account_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_from_account_created" ON "transactions"  ("from_account_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_status_enum" AS ENUM('active', 'locked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" character varying(24) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" character varying(24) NOT NULL, "account_number" character varying(32) NOT NULL, "balance" numeric(18,2) NOT NULL DEFAULT '0.00', "currency" character varying(3) NOT NULL DEFAULT 'VND', "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'active', "version" integer NOT NULL, CONSTRAINT "chk_accounts_currency_uppercase" CHECK (currency = upper(currency)), CONSTRAINT "chk_accounts_balance_non_negative" CHECK ("balance" >= 0), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_accounts_user_id_status" ON "accounts"  ("user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_accounts_account_number_active" ON "accounts"  ("account_number") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'admin')`);
    await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'locked')`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" character varying(24) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "full_name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_users_role_status" ON "users"  ("role", "status") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email_active" ON "users"  ("email") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_91ac87a22755563425b98ffc3c0" FOREIGN KEY ("from_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_d81b9f7079880ed2c82d60a94b9" FOREIGN KEY ("to_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_d81b9f7079880ed2c82d60a94b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_91ac87a22755563425b98ffc3c0"`,
    );
    await queryRunner.query(`DROP INDEX "public"."uq_users_email_active"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_role_status"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_accounts_account_number_active"`);
    await queryRunner.query(`DROP INDEX "public"."idx_accounts_user_id_status"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transactions_from_account_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transactions_to_account_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transactions_status_created"`);
    await queryRunner.query(`DROP INDEX "public"."uq_transactions_idempotency_key_active"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
  }
}
