-- ReFix: actualizar solicitudes e incorporar historial de estados.
-- Migracion incremental. No elimina tablas ni reinicia el esquema.

BEGIN;

-- 1. Crear el enum nuevo y traducir los estados anteriores.
CREATE TYPE "RequestStatus_new" AS ENUM (
    'SOLICITADO',
    'CANCELADO',
    'AGENDADO',
    'RECIBIDO',
    'EN_PROCESO',
    'ESPERANDO_PIEZA',
    'LISTO_PARA_ENTREGA',
    'ENTREGADO',
    'EN_GARANTIA',
    'RESUELTO',
    'CERRADO'
);

ALTER TABLE "service_requests"
    ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "service_requests"
    ALTER COLUMN "status" TYPE "RequestStatus_new"
    USING (
        CASE "status"::text
            WHEN 'PENDING' THEN 'SOLICITADO'
            WHEN 'ACCEPTED' THEN 'AGENDADO'
            WHEN 'IN_PROGRESS' THEN 'EN_PROCESO'
            WHEN 'COMPLETED' THEN 'CERRADO'
            WHEN 'CANCELLED' THEN 'CANCELADO'
            ELSE 'SOLICITADO'
        END
    )::"RequestStatus_new";

ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";

ALTER TABLE "service_requests"
    ALTER COLUMN "status" SET DEFAULT 'SOLICITADO';

-- 2. Agregar los campos nuevos de solicitud.
-- Los valores temporales permiten conservar registros existentes.
ALTER TABLE "service_requests"
    ADD COLUMN "title" VARCHAR(120) NOT NULL DEFAULT 'Solicitud existente',
    ADD COLUMN "device_type" VARCHAR(50) NOT NULL DEFAULT 'No especificado',
    ADD COLUMN "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Los defaults solo son necesarios durante la migración.
ALTER TABLE "service_requests"
    ALTER COLUMN "title" DROP DEFAULT,
    ALTER COLUMN "device_type" DROP DEFAULT,
    ALTER COLUMN "latitude" DROP DEFAULT,
    ALTER COLUMN "longitude" DROP DEFAULT;

-- 3. Corregir la relación del técnico para apuntar a users.id.
ALTER TABLE "service_requests"
    DROP CONSTRAINT "service_requests_technician_id_fkey";

ALTER TABLE "service_requests"
    ADD CONSTRAINT "service_requests_technician_id_fkey"
    FOREIGN KEY ("technician_id")
    REFERENCES "users"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- 4. Crear el historial de estados.
CREATE TABLE "service_request_status_history" (
    "id" TEXT NOT NULL,
    "service_request_id" TEXT NOT NULL,
    "previous_status" "RequestStatus",
    "new_status" "RequestStatus" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_status_history_pkey"
        PRIMARY KEY ("id")
);

CREATE INDEX "service_request_status_history_service_request_id_created_a_idx"
    ON "service_request_status_history"("service_request_id", "created_at");

CREATE INDEX "service_request_status_history_actor_id_created_at_idx"
    ON "service_request_status_history"("actor_id", "created_at");

-- 5. Crear índices que declara el esquema Prisma.
CREATE INDEX "chatbot_logs_user_id_created_at_idx"
    ON "chatbot_logs"("user_id", "created_at");

CREATE INDEX "service_requests_client_id_created_at_idx"
    ON "service_requests"("client_id", "created_at");

CREATE INDEX "service_requests_technician_id_status_idx"
    ON "service_requests"("technician_id", "status");

CREATE INDEX "service_requests_status_created_at_idx"
    ON "service_requests"("status", "created_at");

CREATE INDEX "trade_in_estimates_user_id_created_at_idx"
    ON "trade_in_estimates"("user_id", "created_at");

-- 6. Establecer las relaciones del historial.
ALTER TABLE "service_request_status_history"
    ADD CONSTRAINT "service_request_status_history_service_request_id_fkey"
    FOREIGN KEY ("service_request_id")
    REFERENCES "service_requests"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "service_request_status_history"
    ADD CONSTRAINT "service_request_status_history_actor_id_fkey"
    FOREIGN KEY ("actor_id")
    REFERENCES "users"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMIT;
