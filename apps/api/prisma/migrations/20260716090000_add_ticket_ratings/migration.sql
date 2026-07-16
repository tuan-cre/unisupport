CREATE TABLE "ticket_ratings" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_ratings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ticket_ratings_ticketId_userId_key" ON "ticket_ratings"("ticketId", "userId");
CREATE INDEX "ticket_ratings_ticketId_idx" ON "ticket_ratings"("ticketId");
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE;
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT;
