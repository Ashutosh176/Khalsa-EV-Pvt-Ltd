import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("db")
  async checkDb() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "connected", timestamp: new Date().toISOString() };
  }
}
