import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLedgerTable1784012183970 implements MigrationInterface {
  name = 'AddLedgerTable1784012183970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_transactions_status_enum" AS ENUM('pending', 'posted', 'failed', 'reversed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_transactions" ("id" character varying(24) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "reference_id" character varying(128) NOT NULL, "status" "public"."ledger_transactions_status_enum" NOT NULL DEFAULT 'pending', "description" character varying(500) NOT NULL, "currency" character varying(3) NOT NULL, "metadata" jsonb, "occurred_at" TIMESTAMP WITH TIME ZONE, "posted_at" TIMESTAMP WITH TIME ZONE, "reversal_of_transaction_id" character varying(24), CONSTRAINT "PK_633d103c9e415d615aacf9b1929" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_ledger_transactions_reversal_of" ON "ledger_transactions"  ("reversal_of_transaction_id") WHERE "reversal_of_transaction_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ledger_transactions_status_created" ON "ledger_transactions"  ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_ledger_transactions_reference_id" ON "ledger_transactions"  ("reference_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_entries_side_enum" AS ENUM('debit', 'credit')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_entries" ("id" character varying(24) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "transaction_id" character varying(24) NOT NULL, "account_id" character varying(24) NOT NULL, "line_no" smallint NOT NULL, "side" "public"."ledger_entries_side_enum" NOT NULL, "amount" numeric(18,4) NOT NULL, "balance_after" numeric(18,4), CONSTRAINT "chk_ledger_entries_amount_positive" CHECK ("amount" > 0), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ledger_entries_transaction" ON "ledger_entries"  ("transaction_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ledger_entries_account_created" ON "ledger_entries"  ("account_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_ledger_entries_transaction_line" ON "ledger_entries"  ("transaction_id", "line_no") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_accounts_type_enum" AS ENUM('asset', 'liability', 'equity', 'expense', 'revenue')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_accounts_status_enum" AS ENUM('active', 'frozen', 'closed', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_accounts_owner_type_enum" AS ENUM('user', 'merchant', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_accounts" ("id" character varying(24) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying(64) NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."ledger_accounts_type_enum" NOT NULL, "status" "public"."ledger_accounts_status_enum" NOT NULL DEFAULT 'active', "currency" character varying(3) NOT NULL, "owner_type" "public"."ledger_accounts_owner_type_enum", "owner_id" character varying(64), "parent_id" character varying(24), "cached_balance" numeric(18,4) NOT NULL DEFAULT '0.0000', CONSTRAINT "PK_62b34396dda564757cf123fff0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ledger_accounts_owner" ON "ledger_accounts"  ("owner_type", "owner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ledger_accounts_status" ON "ledger_accounts"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ledger_accounts_type" ON "ledger_accounts"  ("type") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_ledger_accounts_code" ON "ledger_accounts"  ("code") `,
    );
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "balance" SET DEFAULT '0.00'`);
    await queryRunner.query(
      `ALTER TABLE "ledger_transactions" ADD CONSTRAINT "FK_f32cbd57f8d383291d990d16f05" FOREIGN KEY ("reversal_of_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60" FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_e4440167e470be69f9622c1ceab" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_accounts" ADD CONSTRAINT "FK_b0cc8476c75f7967bafbc9c7c37" FOREIGN KEY ("parent_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION prevent_ledger_entries_mutation()
        RETURNS TRIGGER AS $$
        BEGIN
        RAISE EXCEPTION 'ledger_entries is append-only: % is not allowed', TG_OP;
        END;
        $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
        CREATE TRIGGER trg_ledger_entries_no_update
        BEFORE UPDATE ON ledger_entries
        FOR EACH ROW EXECUTE FUNCTION prevent_ledger_entries_mutation();
    `);
    await queryRunner.query(`
        CREATE TRIGGER trg_ledger_entries_no_delete
        BEFORE DELETE ON ledger_entries
        FOR EACH ROW EXECUTE FUNCTION prevent_ledger_entries_mutation();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_ledger_entries_no_delete ON ledger_entries`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_ledger_entries_no_update ON ledger_entries`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_ledger_entries_mutation`);
    await queryRunner.query(
      `ALTER TABLE "ledger_accounts" DROP CONSTRAINT "FK_b0cc8476c75f7967bafbc9c7c37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_e4440167e470be69f9622c1ceab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_transactions" DROP CONSTRAINT "FK_f32cbd57f8d383291d990d16f05"`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "balance" SET DEFAULT 0.00`);
    await queryRunner.query(`DROP INDEX "public"."uq_ledger_accounts_code"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ledger_accounts_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ledger_accounts_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ledger_accounts_owner"`);
    await queryRunner.query(`DROP TABLE "ledger_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_accounts_owner_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_accounts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_accounts_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_ledger_entries_transaction_line"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ledger_entries_account_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ledger_entries_transaction"`);
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_entries_side_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_ledger_transactions_reference_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ledger_transactions_status_created"`);
    await queryRunner.query(`DROP INDEX "public"."uq_ledger_transactions_reversal_of"`);
    await queryRunner.query(`DROP TABLE "ledger_transactions"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_transactions_status_enum"`);
  }
}
