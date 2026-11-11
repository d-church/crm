import { renderEmailLayout } from '@/infra/email/email-layout';
import type { SendEmailOptions } from '@/infra/email/email.service';

export async function passwordResetEmail(
  url: URL,
  validForMinutes: number,
): Promise<Omit<SendEmailOptions, 'to'>> {
  const subject = 'Відновлення пароля D.Church CRM';
  const expiry = `Посилання діє ${validForMinutes} хвилин.`;
  const ignore = 'Якщо ви не запитували відновлення пароля, проігноруйте цей лист.';
  const layout = await renderEmailLayout('password-reset.html', subject, {
    resetUrl: url.href,
    expiry,
    ignore,
  });

  return {
    ...layout,
    subject,
    text: `Щоб встановити новий пароль для D.Church CRM, перейдіть за посиланням:\n\n${url.href}\n\n${expiry} ${ignore}`,
    disableTracking: true,
  };
}
