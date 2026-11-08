CREATE TABLE "password_reset_otps" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "password_reset_otps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_otps_user_id_key" ON "password_reset_otps"("user_id");
CREATE INDEX "password_reset_otps_expires_at_idx" ON "password_reset_otps"("expires_at");

ALTER TABLE "password_reset_otps"
ADD CONSTRAINT "password_reset_otps_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
