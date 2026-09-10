import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { slugify } from "@khalsa-ev/utils";
import { PrismaService } from "../prisma/prisma.service";
import { isUniqueConstraintError } from "../common/prisma-error";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  // Admin management view - includes deactivated categories, which the
  // public storefront list above must never surface.
  findAllAdmin() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.requireCategory(dto.parentId);
    }
    const slug = await this.generateUniqueSlug(dto.slug ?? dto.name);

    return this.prisma.category.create({
      data: { name: dto.name, slug, description: dto.description, imageUrl: dto.imageUrl, parentId: dto.parentId },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.requireCategory(id);
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException("A category cannot be its own parent");
      }
      await this.requireCategory(dto.parentId);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          imageUrl: dto.imageUrl,
          parentId: dto.parentId,
          isActive: dto.isActive,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "slug")) {
        throw new BadRequestException(`A category with slug "${dto.slug}" already exists`);
      }
      throw error;
    }
  }

  // Soft delete: products reference categories by id (Section 23 "delete
  // /deactivate" applies here the same as it does to products themselves),
  // so a category in use is hidden from the storefront rather than removed.
  async archive(id: string) {
    await this.requireCategory(id);
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }

  private async requireCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  private async generateUniqueSlug(source: string): Promise<string> {
    const base = slugify(source);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.category.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
