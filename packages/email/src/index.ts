import nodemailer from 'nodemailer';

export interface EmailMessage {
  readonly from: string;
  readonly subject: string;
  readonly text: string;
  readonly to: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ providerMessageId: string }>;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('Transactional email is not configured.');
    this.name = 'EmailNotConfiguredError';
  }
}

export class EmailDeliveryError extends Error {
  constructor(message = 'Transactional email delivery failed.') {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

export function createSmtpEmailProvider(options: {
  host: string;
  port: number;
  user?: string;
  password?: string;
  secure: boolean;
}): EmailProvider {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: options.user ? { user: options.user, pass: options.password ?? '' } : undefined,
  });
  return {
    async send(message) {
      try {
        const result = await transport.sendMail({
          from: message.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        });
        return { providerMessageId: result.messageId };
      } catch {
        throw new EmailDeliveryError();
      }
    },
  };
}

export function createMailpitEmailProvider(baseUrl: string): EmailProvider {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/v1/send`;
  return {
    async send(message) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            From: { Email: message.from },
            To: [{ Email: message.to }],
            Subject: message.subject,
            Text: message.text,
          }),
        });
        if (!response.ok) throw new Error('Mailpit rejected message');
        return { providerMessageId: response.headers.get('x-message-id') ?? crypto.randomUUID() };
      } catch {
        throw new EmailDeliveryError();
      }
    },
  };
}

export function createEmailProvider(options: {
  mailpitUrl?: string;
  smtpHost?: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure: boolean;
}): EmailProvider | null {
  if (options.mailpitUrl) return createMailpitEmailProvider(options.mailpitUrl);
  if (options.smtpHost)
    return createSmtpEmailProvider({
      host: options.smtpHost,
      port: options.smtpPort,
      user: options.smtpUser,
      password: options.smtpPassword,
      secure: options.smtpSecure,
    });
  return null;
}
