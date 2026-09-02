import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

// Global: AdminAuthGuard/RolesGuard are used with @UseGuards(...) in other
// feature modules (e.g. Products), so their dependencies (JwtService) must
// resolve application-wide rather than only within AuthModule's own scope.
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard, RolesGuard],
  exports: [AuthService, AdminAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
