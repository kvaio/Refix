-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('SOLICITADO', 'CANCELADO', 'AGENDADO', 'RECIBIDO', 'EN_PROCESO', 'ESPERANDO_PIEZA', 'LISTO_PARA_ENTREGA', 'ENTREGADO', 'EN_GARANTIA', 'RESUELTO', 'CERRADO');
ALTER TABLE "public"."service_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "service_requests" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TABLE "service_request_status_history" ALTER COLUMN "previous_status" TYPE "RequestStatus_new" USING ("previous_status"::text::"RequestStatus_new");
ALTER TABLE "service_request_status_history" ALTER COLUMN "new_status" TYPE "RequestStatus_new" USING ("new_status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
ALTER TABLE "service_requests" ALTER COLUMN "status" SET DEFAULT 'SOLICITADO';
COMMIT;

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_technician_id_fkey";

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "device_type" VARCHAR(50) NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "title" VARCHAR(120) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SOLICITADO';

-- CreateTable
CREATE TABLE "service_request_status_history" (
    "id" TEXT NOT NULL,
    "service_request_id" TEXT NOT NULL,
    "previous_status" "RequestStatus",
    "new_status" "RequestStatus" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_request_status_history_service_request_id_created_a_idx" ON "service_request_status_history"("service_request_id", "created_at");

-- CreateIndex
CREATE INDEX "service_request_status_history_actor_id_created_at_idx" ON "service_request_status_history"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "chatbot_logs_user_id_created_at_idx" ON "chatbot_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "service_requests_client_id_created_at_idx" ON "service_requests"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "service_requests_technician_id_status_idx" ON "service_requests"("technician_id", "status");

-- CreateIndex
CREATE INDEX "service_requests_status_created_at_idx" ON "service_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "trade_in_estimates_user_id_created_at_idx" ON "trade_in_estimates"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_status_history" ADD CONSTRAINT "service_request_status_history_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_status_history" ADD CONSTRAINT "service_request_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
