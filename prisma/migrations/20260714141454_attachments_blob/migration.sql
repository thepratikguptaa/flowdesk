/*
  Warnings:

  - You are about to drop the column `url` on the `Attachment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "url";

-- CreateTable
CREATE TABLE "AttachmentBlob" (
    "attachmentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "AttachmentBlob_pkey" PRIMARY KEY ("attachmentId")
);

-- AddForeignKey
ALTER TABLE "AttachmentBlob" ADD CONSTRAINT "AttachmentBlob_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
