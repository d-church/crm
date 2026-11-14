import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export const AVATAR_UPLOAD_LIMIT = 2 * 1024 * 1024;
const MAX_AVATAR_BYTES = 200_000;

export async function encodeAvatar(input: Buffer): Promise<Buffer> {
  try {
    const image = sharp(input, { limitInputPixels: 4_194_304, failOn: 'warning' });
    const { format, width, height, pages } = await image.metadata();
    // APNG uses a normal PNG signature and can be reported as a single page.
    const animatedPng = format === 'png' && isAnimatedPng(input);
    if (
      !['jpeg', 'png', 'webp'].includes(format ?? '') ||
      !width ||
      width !== height ||
      width > 512 ||
      (pages ?? 1) !== 1 ||
      animatedPng
    ) {
      throw new Error('Invalid avatar format or dimensions');
    }

    for (const [size, quality] of [
      [512, 80],
      [512, 65],
      [512, 45],
      [384, 60],
      [256, 50],
    ]) {
      const output = await image
        .clone()
        .autoOrient()
        .resize(size, size, { withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
      if (output.length <= MAX_AVATAR_BYTES) return output;
    }
  } catch {
    throw new BadRequestException('Оберіть квадратне фото JPEG, PNG або WebP без анімації');
  }
  throw new BadRequestException('Не вдалося стиснути фото до 200 КБ');
}

function isAnimatedPng(input: Buffer): boolean {
  for (let offset = 8; offset + 12 <= input.length;) {
    if (input.toString('ascii', offset + 4, offset + 8) === 'acTL') return true;
    offset += 12 + input.readUInt32BE(offset);
  }
  return false;
}
