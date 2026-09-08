import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { CategoriesModule } from "./categories/categories.module";
import { BrandsModule } from "./brands/brands.module";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { CompatibilityModule } from "./compatibility/compatibility.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CartModule } from "./cart/cart.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { AddressesModule } from "./addresses/addresses.module";
import { OrdersModule } from "./orders/orders.module";
import { InventoryModule } from "./inventory/inventory.module";
import { ReturnsModule } from "./returns/returns.module";
import { ShippingModule } from "./shipping/shipping.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    VehiclesModule,
    CompatibilityModule,
    CatalogModule,
    CartModule,
    WishlistModule,
    AddressesModule,
    OrdersModule,
    InventoryModule,
    ReturnsModule,
    ShippingModule,
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
