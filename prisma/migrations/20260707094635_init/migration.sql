-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'USED', 'USED_WORN');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'NEGOTIATING', 'SOLD', 'DELISTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReviewerRole" AS ENUM ('BUYER', 'SELLER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "lineContact" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAccessory" BOOLEAN NOT NULL DEFAULT false,
    "allowSubType" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seriesId" TEXT,
    "partTypeId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "partTypeId" TEXT NOT NULL,
    "subTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "seriesId" TEXT NOT NULL,
    "partTypeId" TEXT NOT NULL,
    "subTypeId" TEXT,
    "catalogId" TEXT,
    "condition" "Condition" NOT NULL DEFAULT 'USED',
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "lineContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "message" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "buyerName" TEXT,
    "catalogId" TEXT,
    "condition" "Condition" NOT NULL,
    "price" INTEGER NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "price" INTEGER NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceDailySummary" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "minPrice" INTEGER NOT NULL,
    "maxPrice" INTEGER NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "PriceDailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceWeeklySummary" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "minPrice" INTEGER NOT NULL,
    "maxPrice" INTEGER NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "PriceWeeklySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "role" "ReviewerRole" NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerStats" (
    "userId" TEXT NOT NULL,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "ratingSum" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerStats_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Series_code_key" ON "Series"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PartType_code_key" ON "PartType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubType_code_key" ON "SubType"("code");

-- CreateIndex
CREATE INDEX "SubType_seriesId_idx" ON "SubType"("seriesId");

-- CreateIndex
CREATE INDEX "SubType_partTypeId_idx" ON "SubType"("partTypeId");

-- CreateIndex
CREATE INDEX "PartCatalog_seriesId_idx" ON "PartCatalog"("seriesId");

-- CreateIndex
CREATE INDEX "PartCatalog_partTypeId_idx" ON "PartCatalog"("partTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "PartCatalog_name_seriesId_partTypeId_subTypeId_key" ON "PartCatalog"("name", "seriesId", "partTypeId", "subTypeId");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "Listing_seriesId_partTypeId_subTypeId_idx" ON "Listing"("seriesId", "partTypeId", "subTypeId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_condition_idx" ON "Listing"("condition");

-- CreateIndex
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage"("listingId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_buyerId_idx" ON "PurchaseRequest"("buyerId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_listingId_buyerId_key" ON "PurchaseRequest"("listingId", "buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_listingId_key" ON "Transaction"("listingId");

-- CreateIndex
CREATE INDEX "Transaction_sellerId_idx" ON "Transaction"("sellerId");

-- CreateIndex
CREATE INDEX "Transaction_buyerId_idx" ON "Transaction"("buyerId");

-- CreateIndex
CREATE INDEX "Transaction_catalogId_condition_idx" ON "Transaction"("catalogId", "condition");

-- CreateIndex
CREATE INDEX "PriceHistory_catalogId_condition_soldAt_idx" ON "PriceHistory"("catalogId", "condition", "soldAt");

-- CreateIndex
CREATE INDEX "PriceDailySummary_catalogId_condition_idx" ON "PriceDailySummary"("catalogId", "condition");

-- CreateIndex
CREATE UNIQUE INDEX "PriceDailySummary_catalogId_condition_date_key" ON "PriceDailySummary"("catalogId", "condition", "date");

-- CreateIndex
CREATE INDEX "PriceWeeklySummary_catalogId_condition_idx" ON "PriceWeeklySummary"("catalogId", "condition");

-- CreateIndex
CREATE UNIQUE INDEX "PriceWeeklySummary_catalogId_condition_year_week_key" ON "PriceWeeklySummary"("catalogId", "condition", "year", "week");

-- CreateIndex
CREATE INDEX "Review_targetId_idx" ON "Review"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_transactionId_authorId_key" ON "Review"("transactionId", "authorId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubType" ADD CONSTRAINT "SubType_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubType" ADD CONSTRAINT "SubType_partTypeId_fkey" FOREIGN KEY ("partTypeId") REFERENCES "PartType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCatalog" ADD CONSTRAINT "PartCatalog_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCatalog" ADD CONSTRAINT "PartCatalog_partTypeId_fkey" FOREIGN KEY ("partTypeId") REFERENCES "PartType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCatalog" ADD CONSTRAINT "PartCatalog_subTypeId_fkey" FOREIGN KEY ("subTypeId") REFERENCES "SubType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_partTypeId_fkey" FOREIGN KEY ("partTypeId") REFERENCES "PartType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_subTypeId_fkey" FOREIGN KEY ("subTypeId") REFERENCES "SubType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "PartCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "PartCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "PartCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceDailySummary" ADD CONSTRAINT "PriceDailySummary_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "PartCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceWeeklySummary" ADD CONSTRAINT "PriceWeeklySummary_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "PartCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerStats" ADD CONSTRAINT "SellerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
