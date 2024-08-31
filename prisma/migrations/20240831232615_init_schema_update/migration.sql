-- CreateTable
CREATE TABLE "Jobapplied" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Jobapplied_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Jobapplied" ADD CONSTRAINT "Jobapplied_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
