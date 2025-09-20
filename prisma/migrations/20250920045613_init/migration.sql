-- CreateTable
CREATE TABLE "public"."Education" (
    "eduId" SERIAL NOT NULL,
    "educationname" VARCHAR(20) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("eduId")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "userId" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "password" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "education" INTEGER NOT NULL,
    "phone" VARCHAR(10) NOT NULL,
    "gender" VARCHAR(1) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_education_fkey" FOREIGN KEY ("education") REFERENCES "public"."Education"("eduId") ON DELETE RESTRICT ON UPDATE CASCADE;
