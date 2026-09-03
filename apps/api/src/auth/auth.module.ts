import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminAuthController } from "./admin-auth.controller";
import { CustomerAuthController } from "./customer-auth.controller";
import { OtpController } from "./otp.controller";
import { AuthService } from "./auth.service";
import { OtpService } from "./otp.service";
import { Msg91Client } from "./msg91.client";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

// Global: AdminAuthGuard/JwtAuthGuard/RolesGuard are used with
// @UseGuards(...) in other feature modules (e.g. Products, Cart), so
// their dependencies (JwtService) must resolve application-wide rather
// than only within AuthModule's own scope.
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AdminAuthController, CustomerAuthController, OtpController],
  providers: [AuthService, OtpService, Msg91Client, AdminAuthGuard, JwtAuthGuard, RolesGuard],
  exports: [AuthService, AdminAuthGuard, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
