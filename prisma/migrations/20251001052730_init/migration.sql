-- CreateTable
CREATE TABLE "public"."PostLikes" (
    "id" BIGSERIAL NOT NULL,
    "postid" BIGINT NOT NULL,
    "userid" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLikes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostLikes_postid_userid_key" ON "public"."PostLikes"("postid", "userid");

-- AddForeignKey
ALTER TABLE "public"."PostLikes" ADD CONSTRAINT "PostLikes_postid_fkey" FOREIGN KEY ("postid") REFERENCES "public"."Post"("postid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostLikes" ADD CONSTRAINT "PostLikes_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
