-- Rename samlId to googleId for Google OAuth
ALTER TABLE "users" RENAME COLUMN "samlId" TO "googleId";
ALTER INDEX "users_samlId_key" RENAME TO "users_googleId_key";
