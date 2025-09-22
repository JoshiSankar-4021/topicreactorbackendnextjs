/*
  Warnings:

  - Added the required column `topic` to the `Topic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Topic" ADD COLUMN     "topic" VARCHAR(100) NOT NULL;
