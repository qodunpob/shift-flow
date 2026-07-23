import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildOpenApiDocument } from './swagger.config';

const OUTPUT_PATH = join(process.cwd(), 'generated', 'openapi.json');

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = buildOpenApiDocument(app);

  mkdirSync(join(process.cwd(), 'generated'), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(document, null, 2));

  await app.close();
}

void generate();
