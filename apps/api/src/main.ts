import path from "node:path";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { getUploadsDir } from "./common/uploads";

async function bootstrap() {
  config({ path: path.resolve(__dirname, "../../../.env") });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api/v1");
  // Local disk storage for product images until STORAGE_* (S3-compatible)
  // credentials are configured for a real phase - see .env's comment on
  // those vars. Served outside the api/v1 prefix as plain static files.
  app.useStaticAssets(getUploadsDir(), { prefix: "/uploads/" });
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://dev.khalsaev.local:3000",
      "https://dev.khalsaev.local:3000",
    ],
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
