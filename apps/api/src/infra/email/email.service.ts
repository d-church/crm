import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  disableTracking?: boolean;
}

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  public async send({ to, subject, text, html, disableTracking }: SendEmailOptions): Promise<void> {
    const apiKey = this.configService.getOrThrow<string>('MAILGUN_SENDING_API_KEY');
    const domain = this.configService.getOrThrow<string>('MAILGUN_DOMAIN');
    const baseUrl = this.configService.getOrThrow<string>('MAILGUN_BASE_URL').replace(/\/$/, '');
    const from = this.configService.getOrThrow<string>('MAILGUN_FROM');
    const body = new FormData();

    body.set('from', from);
    body.set('to', to);
    body.set('subject', subject);
    body.set('text', text);

    if (html) {
      body.set('html', html);
    }
    if (disableTracking) {
      body.set('o:tracking', 'no');
      body.set('o:tracking-clicks', 'no');
      body.set('o:tracking-opens', 'no');
    }

    const response = await fetch(`${baseUrl}/v3/${encodeURIComponent(domain)}/messages`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Mailgun rejected the email (${response.status}): ${await response.text()}`);
    }
  }
}
