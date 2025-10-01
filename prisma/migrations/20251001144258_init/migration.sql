/*
  Warnings:

  - You are about to drop the column `dislikes` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "dislikes",
ADD COLUMN     "dislikescount" BIGINT NOT NULL DEFAULT 0;
