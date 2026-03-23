ALTER TABLE "pharmacies" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "pharmacies" ADD CONSTRAINT "pharmacies_email_unique" UNIQUE("email");
