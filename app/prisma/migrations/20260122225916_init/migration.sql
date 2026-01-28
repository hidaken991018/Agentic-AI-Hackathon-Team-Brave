-- CreateTable
CREATE TABLE "test_samples" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_samples_pkey" PRIMARY KEY ("id")
);
