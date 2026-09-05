import fs from "node:fs/promises";
import path from "node:path";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UPLOADS_DIR, PRODUCT_IMAGES_SUBDIR } from "../common/uploads";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ListProductsQuery } from "./dto/list-products.query";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_PER_UPLOAD = 10;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Admin management endpoints. The public storefront reads from
// CatalogController at /products instead (Section 44 Phase 5).
@Controller("admin/products")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListProductsQuery) {
    return this.productsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  archive(@Param("id") id: string) {
    return this.productsService.archive(id);
  }

  @Post(":id/images")
  @UseInterceptors(
    FilesInterceptor("files", MAX_IMAGES_PER_UPLOAD, {
      limits: { fileSize: MAX_IMAGE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
          callback(new BadRequestException(`Unsupported image type: ${file.mimetype}`), false);
          return;
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: (req, _file, callback) => {
          const dir = path.join(UPLOADS_DIR, PRODUCT_IMAGES_SUBDIR, (req.params as { id: string }).id);
          fs.mkdir(dir, { recursive: true })
            .then(() => callback(null, dir))
            .catch((error: unknown) => callback(error as Error, dir));
        },
        filename: (_req, file, callback) => {
          const ext = path.extname(file.originalname).toLowerCase();
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
    }),
  )
  uploadImages(@Param("id") id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.productsService.addImages(id, files ?? []);
  }

  @Delete(":id/images/:imageId")
  removeImage(@Param("id") id: string, @Param("imageId") imageId: string) {
    return this.productsService.removeImage(id, imageId);
  }
}
