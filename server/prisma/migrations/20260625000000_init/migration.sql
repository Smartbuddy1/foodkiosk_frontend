CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'KITCHEN', 'CASHIER', 'MANAGER');
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY');
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'UPI', 'CASH');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PENDING_CASH');
CREATE TYPE "DiscountType" AS ENUM ('FLAT', 'PERCENTAGE');

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "categories" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "menu_items" (
  "id" SERIAL PRIMARY KEY,
  "category_id" INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "image_url" TEXT NOT NULL,
  "is_veg" BOOLEAN NOT NULL DEFAULT true,
  "is_vegan" BOOLEAN NOT NULL DEFAULT false,
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "item_variants" (
  "id" SERIAL PRIMARY KEY,
  "item_id" INTEGER NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "label" TEXT NOT NULL,
  "price_delta" DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE "item_addons" (
  "id" SERIAL PRIMARY KEY,
  "item_id" INTEGER NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "label" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "is_default" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "orders" (
  "id" SERIAL PRIMARY KEY,
  "token_number" INTEGER NOT NULL,
  "order_type" "OrderType" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax" DECIMAL(10,2) NOT NULL,
  "packaging_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL,
  "payment_method" "PaymentMethod" NOT NULL,
  "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "razorpay_order_id" TEXT,
  "razorpay_payment_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "order_items" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "menu_item_id" INTEGER NOT NULL REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "variant" TEXT,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "customisations" JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE "promo_codes" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "discount_type" "DiscountType" NOT NULL,
  "discount_value" DECIMAL(10,2) NOT NULL,
  "min_order" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "max_uses" INTEGER NOT NULL DEFAULT 0,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "valid_from" TIMESTAMP(3) NOT NULL,
  "valid_to" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "staff_activity_log" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "action" TEXT NOT NULL,
  "meta" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "menu_items_category_id_idx" ON "menu_items"("category_id");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "staff_activity_log_user_id_idx" ON "staff_activity_log"("user_id");
