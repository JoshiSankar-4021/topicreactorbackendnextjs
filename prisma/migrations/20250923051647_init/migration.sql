-- CreateTable
CREATE TABLE "public"."Comment" (
    "commentid" BIGSERIAL NOT NULL,
    "comment" VARCHAR(700) NOT NULL,
    "topicid" BIGINT NOT NULL,
    "commentedby" BIGINT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("commentid")
);

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_topicid_fkey" FOREIGN KEY ("topicid") REFERENCES "public"."Topic"("topicid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_commentedby_fkey" FOREIGN KEY ("commentedby") REFERENCES "public"."User"("userid") ON DELETE RESTRICT ON UPDATE CASCADE;
