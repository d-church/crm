import { randomBytes } from 'node:crypto';

import sharp from 'sharp';

import { encodeAvatar } from './avatar-image';

describe('encodeAvatar', () => {
  it('encodes a high-detail photo as WebP under 200 KB and drops metadata', async () => {
    const input = await sharp(randomBytes(512 * 512 * 3), {
      raw: { width: 512, height: 512, channels: 3 },
    })
      .withExif({ IFD0: { Copyright: 'Fixture' } })
      .png()
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const output = await encodeAvatar(input);
    expect(output.length).toBeLessThanOrEqual(200_000);
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(metadata.height);
    expect(metadata.width).toBeLessThanOrEqual(512);
    expect(metadata.exif).toBeUndefined();
  });

  it.each([
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>'),
    Buffer.from('not a picture'),
  ])('rejects unsupported files', async (input) => {
    await expect(encodeAvatar(input)).rejects.toThrow('Оберіть квадратне фото');
  });
});
