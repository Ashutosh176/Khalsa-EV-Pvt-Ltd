import path from "node:path";
import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  config({ path: path.resolve(__dirname, "../../../.env") });

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true });
  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
