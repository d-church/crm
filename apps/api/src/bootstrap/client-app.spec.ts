import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Controller, Get, Module, Param } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import request from 'supertest';

import { API_PREFIX } from '@/config/openapi';

import { useClientApp } from './client-app';

const INDEX_HTML = '<!doctype html><title>D.Church CRM</title><div id="root"></div>';
const ASSET_JS = 'console.log("bundle")';

@Controller('people')
class ProbePeopleController {
  @Get()
  public findAll() {
    return [{ id: 'person-1' }];
  }

  @Get(':id')
  public findOne(@Param('id') id: string) {
    return { id };
  }
}

let uploadsDir = '';

// Mirrors AppModule: the uploads mount plus the API.
@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      useFactory: () => [{ rootPath: uploadsDir, serveRoot: '/uploads' }],
    }),
  ],
  controllers: [ProbePeopleController],
})
class ProbeAppModule {}

describe('serving the client build', () => {
  let app: NestExpressApplication;
  let clientDist: string;

  beforeAll(async () => {
    clientDist = mkdtempSync(join(tmpdir(), 'client-dist-'));
    uploadsDir = mkdtempSync(join(tmpdir(), 'uploads-'));
    writeFileSync(join(uploadsDir, 'avatar.png'), 'png-bytes');
    mkdirSync(join(clientDist, 'assets'));
    writeFileSync(join(clientDist, 'index.html'), INDEX_HTML);
    writeFileSync(join(clientDist, 'assets', 'index-abc123.js'), ASSET_JS);

    app = await NestFactory.create<NestExpressApplication>(ProbeAppModule, { logger: false });
    app.setGlobalPrefix(API_PREFIX);
    useClientApp(app, clientDist);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    rmSync(clientDist, { recursive: true, force: true });
    rmSync(uploadsDir, { recursive: true, force: true });
  });

  it('leaves API endpoints untouched', async () => {
    await request(app.getHttpServer())
      .get('/api/people')
      .expect(200, [{ id: 'person-1' }]);
    await request(app.getHttpServer())
      .get('/api/people/person-42')
      .expect(200, { id: 'person-42' });
  });

  it('lets the API answer its own 404s instead of returning the shell', async () => {
    const response = await request(app.getHttpServer()).get('/api/nope').expect(404);

    expect(response.headers['content-type']).toContain('application/json');
    expect(response.text).not.toContain('<div id="root">');
  });

  it('returns the shell for client-side routes', async () => {
    const response = await request(app.getHttpServer()).get('/people/person-42/edit').expect(200);

    expect(response.text).toContain('<div id="root">');
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['cache-control']).toBe('no-cache');
  });

  it('returns the shell for the root path', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.text).toContain('<div id="root">');
  });

  it('serves fingerprinted assets as immutable', async () => {
    const response = await request(app.getHttpServer()).get('/assets/index-abc123.js').expect(200);

    expect(response.text).toBe(ASSET_JS);
    expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('leaves the uploads mount alone', async () => {
    const response = await request(app.getHttpServer()).get('/uploads/avatar.png').expect(200);

    expect(response.headers['content-type']).toContain('image/png');
  });

  it('404s a missing file instead of returning the shell', async () => {
    const response = await request(app.getHttpServer()).get('/logo.png').expect(404);

    expect(response.text).not.toContain('<div id="root">');
  });

  it('404s unknown non-GET requests', async () => {
    await request(app.getHttpServer()).post('/unknown').expect(404);
  });

  it('reports a missing build instead of serving one', () => {
    expect(useClientApp(app, join(clientDist, 'nope'))).toBe(false);
  });
});
