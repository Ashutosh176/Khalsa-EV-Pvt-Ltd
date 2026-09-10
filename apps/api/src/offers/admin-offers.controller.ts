import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { getUploadsDir, OFFER_IMAGES_SUBDIR } from "../common/uploads";
import { OffersService } from "./offers.service";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { UpdateOfferDto } from "./dto/update-offer.dto";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

@Controller("admin/offers")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
export class AdminOffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  findAll() {
    return this.offersService.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreateOfferDto) {
    return this.offersService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateOfferDto) {
    return this.offersService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.offersService.remove(id);
  }

  @Post(":id/image")
  @UseInterceptors(
    FileInterceptor("file", {
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
          const dir = path.join(getUploadsDir(), OFFER_IMAGES_SUBDIR, (req.params as { id: string }).id);
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
  uploadImage(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No image file was uploaded");
    }
    return this.offersService.setImage(id, file);
  }
}
