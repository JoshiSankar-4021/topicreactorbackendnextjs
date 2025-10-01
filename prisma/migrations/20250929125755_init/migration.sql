-- CreateTable
CREATE TABLE "public"."Post" (
    "postid" BIGSERIAL NOT NULL,
    "caption" VARCHAR(500) NOT NULL,
    "fileurl" TEXT NOT NULL,
    "postedby" BIGINT NOT NULL,
    "postedon" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("postid")
);

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_postedby_fkey" FOREIGN KEY ("postedby") REFERENCES "public"."User"("userid") ON DELETE RESTRICT ON UPDATE CASCADE;
