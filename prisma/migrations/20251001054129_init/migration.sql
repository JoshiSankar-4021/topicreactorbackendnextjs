/*
  Warnings:

  - The primary key for the `PostLikes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PostLikes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PostLikes" DROP CONSTRAINT "PostLikes_pkey",
DROP COLUMN "id",
ADD COLUMN     "likeid" BIGSERIAL NOT NULL,
ADD COLUMN     "status" SMALLINT NOT NULL DEFAULT 1,
ADD CONSTRAINT "PostLikes_pkey" PRIMARY KEY ("likeid");
