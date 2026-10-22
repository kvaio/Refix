-- Support administrator account management without changing existing accounts.
ALTER TABLE "users"
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "users_role_is_active_created_at_idx"
  ON "users"("role", "is_active", "created_at");
