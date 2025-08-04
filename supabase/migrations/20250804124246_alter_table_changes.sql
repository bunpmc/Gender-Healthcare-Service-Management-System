ALTER TABLE ONLY "public"."transactions"
    ADD COLUMN "receipt_id" uuid;


ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "fk_transactions_receipt"
    FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("receipt_id");

ALTER TABLE ONLY "public"."transactions"
    DROP COLUMN "patient_id";
