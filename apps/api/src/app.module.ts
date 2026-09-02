import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { CategoriesModule } from "./categories/categories.module";
import { BrandsModule } from "./brands/brands.module";

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, CategoriesModule, BrandsModule],
  controllers: [HealthController],
})
export class AppModule {}
