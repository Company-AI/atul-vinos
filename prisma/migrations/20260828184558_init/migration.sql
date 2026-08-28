-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('WINE', 'PACK');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WineType" AS ENUM ('TINTO', 'BLANCO', 'ROSADO', 'ESPUMANTE', 'NARANJO', 'DULCE');

-- CreateEnum
CREATE TYPE "WineIntensity" AS ENUM ('LIGERO', 'MEDIO', 'INTENSO');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'VENTA', 'RESERVA', 'LIBERACION', 'AJUSTE', 'DEVOLUCION', 'ROTURA', 'MERMA', 'SUSCRIPCION');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('STORE', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PAYMENT_PENDING', 'PAID', 'STOCK_RESERVED', 'PREPARING', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELLED', 'CHARGED_BACK');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('ORDER', 'SUBSCRIPTION_SIGNUP', 'SUBSCRIPTION_CYCLE');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'LABEL_CREATED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "LabelFormat" AS ENUM ('A4', 'THERMAL_100X150');

-- CreateEnum
CREATE TYPE "SubscriptionFrequency" AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'PAYMENT_FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('SCHEDULED', 'PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "NotificationChannelType" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "documentId" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "internalNotes" TEXT,
    "acceptsMarketing" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "group" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "documentId" TEXT,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "apartment" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "reference" TEXT,
    "isDefaultShipping" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultBilling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL DEFAULT 'WINE',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "compareAtPrice" DECIMAL(12,2),
    "cost" DECIMAL(12,2),
    "wineType" "WineType",
    "vintage" INTEGER,
    "volumeMl" INTEGER,
    "alcoholPercent" DECIMAL(4,2),
    "servingTempC" TEXT,
    "tastingNotes" TEXT,
    "agingPotential" TEXT,
    "intensity" "WineIntensity",
    "winemaking" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "bestSeller" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "categoryId" TEXT,
    "wineryId" TEXT,
    "regionId" TEXT,
    "lineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "variants" JSONB,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVideo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "posterUrl" TEXT,
    "label" TEXT,

    CONSTRAINT "ProductVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Winery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "story" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Winery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Argentina',
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WineLine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WineLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrapeVariety" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GrapeVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGrape" (
    "productId" TEXT NOT NULL,
    "grapeId" TEXT NOT NULL,
    "percent" INTEGER,

    CONSTRAINT "ProductGrape_pkey" PRIMARY KEY ("productId","grapeId")
);

-- CreateTable
CREATE TABLE "Pairing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Pairing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPairing" (
    "productId" TEXT NOT NULL,
    "pairingId" TEXT NOT NULL,

    CONSTRAINT "ProductPairing_pkey" PRIMARY KEY ("productId","pairingId")
);

-- CreateTable
CREATE TABLE "ProductTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTagLink" (
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProductTagLink_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "year" INTEGER,
    "score" TEXT,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackItem" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "onHandBefore" INTEGER NOT NULL,
    "onHandAfter" INTEGER NOT NULL,
    "reservedBefore" INTEGER NOT NULL,
    "reservedAfter" INTEGER NOT NULL,
    "orderId" TEXT,
    "subscriptionBoxId" TEXT,
    "userId" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAllocation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" TEXT,
    "subscriptionBoxId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "couponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "type" "OrderType" NOT NULL DEFAULT 'STORE',
    "status" "OrderStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "userId" TEXT,
    "guestEmail" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerDocument" TEXT,
    "addressId" TEXT,
    "shippingSnapshot" JSONB NOT NULL,
    "billingSnapshot" JSONB,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "couponId" TEXT,
    "couponCode" TEXT,
    "subscriptionSnapshot" JSONB,
    "subscriptionId" TEXT,
    "cycleId" TEXT,
    "shippingMethod" TEXT,
    "carrierCode" TEXT,
    "customerNote" TEXT,
    "internalNote" TEXT,
    "paidAt" TIMESTAMP(3),
    "preparedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL DEFAULT 'WINE',
    "imageUrl" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "packSnapshot" JSONB,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus",
    "message" TEXT,
    "actorEmail" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "purpose" "PaymentPurpose" NOT NULL DEFAULT 'ORDER',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "externalId" TEXT,
    "externalStatus" TEXT,
    "externalReference" TEXT,
    "preferenceId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "installments" INTEGER,
    "failureReason" TEXT,
    "rawPayload" JSONB,
    "orderId" TEXT,
    "subscriptionId" TEXT,
    "cycleId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "trackingUrlTemplate" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carrierId" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "externalId" TEXT,
    "cost" DECIMAL(12,2),
    "weightGrams" INTEGER,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw" JSONB,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingLabel" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "format" "LabelFormat" NOT NULL DEFAULT 'THERMAL_100X150',
    "payload" JSONB NOT NULL,
    "fileUrl" TEXT,
    "printCount" INTEGER NOT NULL DEFAULT 0,
    "lastPrintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "provinces" TEXT[],
    "cities" TEXT[],
    "postalCodeFrom" TEXT,
    "postalCodeTo" TEXT,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "carrierId" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "freeFrom" DECIMAL(12,2),
    "etaMinDays" INTEGER,
    "etaMaxDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "frequency" "SubscriptionFrequency" NOT NULL DEFAULT 'MONTHLY',
    "bottleCount" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "perks" TEXT[],
    "shippingCost" DECIMAL(12,2),
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER,
    "firstCycleDiscountPercent" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubBenefit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClubBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanBenefit" (
    "planId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "overrideValue" DECIMAL(12,2),

    CONSTRAINT "PlanBenefit_pkey" PRIMARY KEY ("planId","benefitId")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "frequency" "SubscriptionFrequency" NOT NULL DEFAULT 'MONTHLY',
    "addressId" TEXT,
    "shippingSnapshot" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "externalId" TEXT,
    "externalStatus" TEXT,
    "startedAt" TIMESTAMP(3),
    "nextChargeAt" TIMESTAMP(3),
    "lastChargeAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "cyclesCount" INTEGER NOT NULL DEFAULT 0,
    "skipNextCycle" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionCycle" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "amount" DECIMAL(12,2) NOT NULL,
    "chargeAttempts" INTEGER NOT NULL DEFAULT 0,
    "chargedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "boxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionBox" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "curatorNote" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "estimatedCost" DECIMAL(12,2),
    "commercialValue" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionBoxItem" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SubscriptionBoxItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "actorEmail" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL DEFAULT 'PERCENT',
    "value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "minPurchase" DECIMAL(12,2),
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "clubMembersOnly" BOOLEAN NOT NULL DEFAULT false,
    "firstPurchaseOnly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponProduct" (
    "couponId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CouponProduct_pkey" PRIMARY KEY ("couponId","productId")
);

-- CreateTable
CREATE TABLE "CouponCategory" (
    "couponId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CouponCategory_pkey" PRIMARY KEY ("couponId","categoryId")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "email" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "CmsSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "position" TEXT NOT NULL DEFAULT 'top',
    "bgColor" TEXT,
    "textColor" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverUrl" TEXT,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "categoryId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","productId")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channel" "NotificationChannelType" NOT NULL DEFAULT 'EMAIL',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "userId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isStaff_idx" ON "User"("isStaff");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_status_kind_idx" ON "Product"("status", "kind");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_wineType_idx" ON "Product"("wineType");

-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- CreateIndex
CREATE INDEX "Product_vintage_idx" ON "Product"("vintage");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Winery_slug_key" ON "Winery"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WineLine_slug_key" ON "WineLine"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GrapeVariety_name_key" ON "GrapeVariety"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GrapeVariety_slug_key" ON "GrapeVariety"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Pairing_name_key" ON "Pairing"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pairing_slug_key" ON "Pairing"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTag_name_key" ON "ProductTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTag_slug_key" ON "ProductTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PackItem_packId_componentId_key" ON "PackItem"("packId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_onHand_idx" ON "Inventory"("onHand");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");

-- CreateIndex
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");

-- CreateIndex
CREATE INDEX "InventoryAllocation_productId_idx" ON "InventoryAllocation"("productId");

-- CreateIndex
CREATE INDEX "InventoryAllocation_orderId_idx" ON "InventoryAllocation"("orderId");

-- CreateIndex
CREATE INDEX "InventoryAllocation_subscriptionBoxId_idx" ON "InventoryAllocation"("subscriptionBoxId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_token_key" ON "Cart"("token");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cycleId_key" ON "Order"("cycleId");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_type_idx" ON "Order"("type");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_externalId_key" ON "Payment"("provider", "externalId");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_receivedAt_idx" ON "WebhookEvent"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_code_key" ON "Carrier"("code");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClubBenefit_code_key" ON "ClubBenefit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_number_key" ON "Subscription"("number");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_nextChargeAt_idx" ON "Subscription"("nextChargeAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionCycle_status_idx" ON "SubscriptionCycle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCycle_subscriptionId_periodYear_periodMonth_key" ON "SubscriptionCycle"("subscriptionId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionBox_planId_periodYear_periodMonth_key" ON "SubscriptionBox"("planId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionBoxItem_boxId_productId_key" ON "SubscriptionBoxItem"("boxId", "productId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_subscriptionId_createdAt_idx" ON "SubscriptionEvent"("subscriptionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");

-- CreateIndex
CREATE UNIQUE INDEX "CmsSection_key_key" ON "CmsSection"("key");

-- CreateIndex
CREATE INDEX "CmsSection_page_sortOrder_idx" ON "CmsSection"("page", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_slug_key" ON "PostCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_isPublished_publishedAt_idx" ON "Post"("isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_event_channel_key" ON "NotificationTemplate"("event", "channel");

-- CreateIndex
CREATE INDEX "NotificationLog_event_createdAt_idx" ON "NotificationLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "Setting_group_idx" ON "Setting"("group");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_wineryId_fkey" FOREIGN KEY ("wineryId") REFERENCES "Winery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "WineLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVideo" ADD CONSTRAINT "ProductVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGrape" ADD CONSTRAINT "ProductGrape_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGrape" ADD CONSTRAINT "ProductGrape_grapeId_fkey" FOREIGN KEY ("grapeId") REFERENCES "GrapeVariety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPairing" ADD CONSTRAINT "ProductPairing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPairing" ADD CONSTRAINT "ProductPairing_pairingId_fkey" FOREIGN KEY ("pairingId") REFERENCES "Pairing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTagLink" ADD CONSTRAINT "ProductTagLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTagLink" ADD CONSTRAINT "ProductTagLink_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ProductTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackItem" ADD CONSTRAINT "PackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackItem" ADD CONSTRAINT "PackItem_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_subscriptionBoxId_fkey" FOREIGN KEY ("subscriptionBoxId") REFERENCES "SubscriptionBox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "SubscriptionCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "SubscriptionCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingLabel" ADD CONSTRAINT "ShippingLabel_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanBenefit" ADD CONSTRAINT "PlanBenefit_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanBenefit" ADD CONSTRAINT "PlanBenefit_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "ClubBenefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionCycle" ADD CONSTRAINT "SubscriptionCycle_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionCycle" ADD CONSTRAINT "SubscriptionCycle_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "SubscriptionBox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionBox" ADD CONSTRAINT "SubscriptionBox_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionBoxItem" ADD CONSTRAINT "SubscriptionBoxItem_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "SubscriptionBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionBoxItem" ADD CONSTRAINT "SubscriptionBoxItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PostCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
