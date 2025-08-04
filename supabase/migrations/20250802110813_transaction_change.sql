ALTER TABLE ONLY "public"."receipts"
    DROP CONSTRAINT "receipts_patient_id_fkey";

ALTER TABLE ONLY "public"."receipts"
    DROP COLUMN "patient_id";

-- Thêm cột patient_id vào transactions
ALTER TABLE ONLY "public"."transactions"
    ADD COLUMN "patient_id" uuid;

-- Thêm khóa ngoại đến patients
ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;