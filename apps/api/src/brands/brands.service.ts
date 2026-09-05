import { Injectable } from "@nestjs/common";
import { ProductType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(productType?: ProductType) {
    return this.prisma.brand.findMany({
      where: {
        isActive: true,
        ...(productType ? { products: { some: { productType } } } : {}),
      },
      orderBy: { name: "asc" },
    });
  }
}
