ALTER TABLE "service_requests"
  ADD COLUMN "service_address" VARCHAR(500),
  ALTER COLUMN "latitude" DROP NOT NULL,
  ALTER COLUMN "longitude" DROP NOT NULL;

CREATE TABLE "service_messages" (
  "id" TEXT NOT NULL,
  "service_request_id" TEXT NOT NULL,
  "sender_id" TEXT NOT NULL,
  "body" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_messages_service_request_id_created_at_idx"
  ON "service_messages"("service_request_id", "created_at");
CREATE INDEX "service_messages_sender_id_created_at_idx"
  ON "service_messages"("sender_id", "created_at");

ALTER TABLE "service_messages"
  ADD CONSTRAINT "service_messages_service_request_id_fkey"
  FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_messages"
  ADD CONSTRAINT "service_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
