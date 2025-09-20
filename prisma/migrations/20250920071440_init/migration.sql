/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "userId",
ADD COLUMN     "userid" BIGSERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userid");
