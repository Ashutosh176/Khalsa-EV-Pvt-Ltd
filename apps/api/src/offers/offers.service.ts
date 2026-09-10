import fs from "node:fs/promises";
import path from "node:path";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { getUploadsDir, OFFER_IMAGES_SUBDIR, toPublicUploadUrl } from "../common/uploads";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { UpdateOfferDto } from "./dto/update-offer.dto";

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  // Public - the homepage's offers strip. isActive alone isn't enough: an
  // offer outside its own startsAt/endsAt window (scheduled for later, or
  // already over) must not show even if nobody's flipped isActive off yet.
  findAllActive() {
    const now = new Date();
    const where: Prisma.OfferWhereInput = {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    };
    return this.prisma.offer.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  findAllAdmin() {
    return this.prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
  }

  create(dto: CreateOfferDto) {
    return this.prisma.offer.create({
      data: {
        title: dto.title,
        description: dto.description,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateOfferDto) {
    await this.requireOffer(id);
    return this.prisma.offer.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  // No other table references an Offer (unlike Category/Brand/Coupon,
  // which Product/Order rows point at) - nothing stops a real delete here.
  async remove(id: string) {
    const offer = await this.requireOffer(id);
    await this.prisma.offer.delete({ where: { id } });
    await this.deleteImageFile(id, offer.imageUrl);
    return offer;
  }

  async setImage(id: string, file: Express.Multer.File) {
    const offer = await this.requireOffer(id);
    await this.deleteImageFile(id, offer.imageUrl);
    return this.prisma.offer.update({
      where: { id },
      data: { imageUrl: toPublicUploadUrl(OFFER_IMAGES_SUBDIR, id, file.filename) },
    });
  }

  private async deleteImageFile(offerId: string, imageUrl: string | null) {
    if (!imageUrl) return;
    const filename = imageUrl.split("/").pop();
    if (!filename) return;
    const filePath = path.join(getUploadsDir(), OFFER_IMAGES_SUBDIR, offerId, filename);
    // Best-effort, same rationale as ProductsService.removeImage: the DB
    // is the source of truth, an orphan file left on disk is harmless.
    await fs.unlink(filePath).catch(() => undefined);
  }

  private async requireOffer(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException(`Offer ${id} not found`);
    }
    return offer;
  }
}
