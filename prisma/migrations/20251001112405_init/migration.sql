-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "commentscount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "sharecount" BIGINT NOT NULL DEFAULT 0;
