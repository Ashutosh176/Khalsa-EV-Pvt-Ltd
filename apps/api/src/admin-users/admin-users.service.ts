import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcrypt";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { isUniqueConstraintError } from "../common/prisma-error";
import { PASSWORD_HASH_ROUNDS } from "../auth/auth.service";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  // role: { not: null } is what makes a User row "an admin account" - the
  // same table holds customers (Section 21's shared-table design), so this
  // must never be dropped or a customer's email/name would leak into the
  // admin user list.
  findAll() {
    return this.prisma.user.findMany({
      where: { role: { not: null } },
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateAdminUserDto) {
    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);
    try {
      return await this.prisma.user.create({
        data: { email: dto.email, name: dto.name, role: dto.role, passwordHash },
        select: ADMIN_USER_SELECT,
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "email")) {
        throw new ConflictException(`An account with email "${dto.email}" already exists`);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateAdminUserDto, currentUserId: string) {
    const target = await this.requireAdminUser(id);

    // Two lockout guards, both scoped to acting on your OWN account: you
    // can still deactivate or demote another SUPER_ADMIN (that's a real
    // admin decision), but not the account you're currently signed in as -
    // otherwise a single click can strand every admin, including yourself,
    // with no SUPER_ADMIN left to undo it.
    if (id === currentUserId && dto.isActive === false) {
      throw new BadRequestException("You cannot deactivate your own account");
    }
    if (id === currentUserId && dto.role && dto.role !== target.role) {
      throw new BadRequestException("You cannot change your own role");
    }

    return this.prisma.user.update({
      where: { id },
      data: { name: dto.name, role: dto.role, isActive: dto.isActive },
      select: ADMIN_USER_SELECT,
    });
  }

  private async requireAdminUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
    if (!user || !user.role) {
      throw new NotFoundException(`Admin user ${id} not found`);
    }
    return user;
  }
}
