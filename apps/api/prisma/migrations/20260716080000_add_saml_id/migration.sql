-- Add samlId field to users table for SAML SSO
ALTER TABLE "users" ADD COLUMN "samlId" TEXT;
CREATE UNIQUE INDEX "users_samlId_key" ON "users"("samlId");
