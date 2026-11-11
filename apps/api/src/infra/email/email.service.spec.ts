import type { ConfigService } from '@nestjs/config';

import { EmailService } from './email.service';

const config = {
  MAILGUN_SENDING_API_KEY: 'test-key',
  MAILGUN_DOMAIN: 'mail.example.com',
  MAILGUN_BASE_URL: 'https://api.eu.mailgun.net/',
  MAILGUN_FROM: 'D.Church CRM <no-reply@example.com>',
};

describe('EmailService', () => {
  const configService = {
    getOrThrow: jest.fn((key: keyof typeof config) => config[key]),
  } as unknown as ConfigService;
  const service = new EmailService(configService);

  afterEach(() => jest.restoreAllMocks());

  it('sends an email through the configured Mailgun domain', async () => {
    let sentBody: FormData | undefined;
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation((_input: string | URL | Request, init?: RequestInit) => {
        sentBody = init?.body as FormData;
        return Promise.resolve(new Response(null, { status: 200 }));
      });

    await service.send({
      to: 'person@example.com',
      subject: 'Test subject',
      text: 'Test message',
      html: '<p>Test message</p>',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.eu.mailgun.net/v3/mail.example.com/messages',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from('api:test-key').toString('base64')}` },
      }),
    );

    expect(Object.fromEntries(sentBody!.entries())).toEqual({
      from: 'D.Church CRM <no-reply@example.com>',
      to: 'person@example.com',
      subject: 'Test subject',
      text: 'Test message',
      html: '<p>Test message</p>',
    });
  });

  it('throws the Mailgun error response', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('Forbidden', { status: 401, statusText: 'Unauthorized' }));

    await expect(
      service.send({ to: 'person@example.com', subject: 'Test subject', text: 'Test message' }),
    ).rejects.toThrow('Mailgun rejected the email (401): Forbidden');
  });

  it('uploads the inline image under the filename referenced by the HTML', async () => {
    let body: FormData | undefined;
    jest.spyOn(global, 'fetch').mockImplementation((_input, init) => {
      body = init?.body as FormData;
      return Promise.resolve(new Response(null, { status: 200 }));
    });

    await service.send({
      to: 'person@example.com',
      subject: 'Test subject',
      text: 'Test message',
      html: '<img src="cid:icon.png" alt="">',
      inline: { name: 'icon.png', data: new Blob(['image'], { type: 'image/png' }) },
    });

    const icon = body?.get('inline');
    expect(icon).toBeInstanceOf(File);
    expect((icon as File).name).toBe('icon.png');
    expect((icon as File).type).toBe('image/png');
  });
});
