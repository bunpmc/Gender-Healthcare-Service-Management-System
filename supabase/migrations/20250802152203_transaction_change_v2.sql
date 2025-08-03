ALTER TABLE ONLY "public"."transactions"
    DROP CONSTRAINT IF EXISTS "fk_transactions_receipt";

ALTER TABLE ONLY "public"."transactions"
    DROP COLUMN IF EXISTS "receipt_id";

-- Thêm cột transaction_id vào bảng receipts
ALTER TABLE ONLY "public"."receipts"
    ADD COLUMN "transaction_id" uuid;

-- Thêm khóa ngoại từ receipts → transactions
ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "fk_receipts_transaction"
    FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id");