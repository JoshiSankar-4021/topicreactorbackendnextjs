-- CreateTable
CREATE TABLE "public"."Topic" (
    "topicid" BIGSERIAL NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "createdby" BIGINT NOT NULL,
    "createdon" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("topicid")
);

-- AddForeignKey
ALTER TABLE "public"."Topic" ADD CONSTRAINT "Topic_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "public"."User"("userid") ON DELETE RESTRICT ON UPDATE CASCADE;
