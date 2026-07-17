import { Global, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ImapFlow, type SearchObject } from 'imapflow';
import { simpleParser } from 'mailparser';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { EventsGateway } from '../events/events.gateway';
import { Logger } from 'nestjs-pino';

const BOUNCE_EXACT: string[] = [
  'mailer-daemon@',
  'postmaster@',
  'MAILER-DAEMON',
  'mail delivery subsystem',
];

function isBounce(from: string, subject: string): boolean {
  const lowerFrom = String(from).toLowerCase();
  const lowerSubject = String(subject).toLowerCase();
  if (
    BOUNCE_EXACT.some(
      (prefix) => lowerFrom.startsWith(prefix) || lowerSubject.includes(prefix.toLowerCase()),
    )
  ) {
    return true;
  }
  if (
    lowerSubject.includes('delivery status notification') ||
    lowerSubject.includes('undeliverable')
  ) {
    return true;
  }
  if (
    lowerSubject.includes('auto-reply') ||
    lowerSubject.includes('out of office') ||
    lowerSubject.includes('ooo')
  ) {
    return true;
  }
  return false;
}

function formatAddress(addresses: any): string {
  if (!addresses?.value?.length) return '';
  return addresses.value
    .map((a: any) => a.address ?? '')
    .filter(Boolean)
    .join(', ');
}

export interface EmailPollJobData {
  type?: 'poll';
}

@Injectable()
export class EmailPollingService implements OnModuleInit, OnModuleDestroy {
  private client: ImapFlow | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private closing = false;

  constructor(
    private readonly config: ConfigService,
    private readonly chatService: ChatService,
    private readonly eventsGateway: EventsGateway,
    private readonly logger: Logger,
  ) {}

  private get imapEnabled(): boolean {
    return Boolean(
      this.config.get<string>('IMAP_HOST') &&
      this.config.get<string>('IMAP_USER') &&
      this.config.get<string>('IMAP_PASSWORD'),
    );
  }

  async onModuleInit() {
    if (!this.imapEnabled) {
      this.logger.log('IMAP polling disabled (missing IMAP_HOST/IMAP_USER/IMAP_PASSWORD)');
      return;
    }

    await this.bootstrapImap();
  }

  private async bootstrapImap(attempt = 1): Promise<void> {
    if (this.closing) return;
    const maxAttempts = 3;
    try {
      const port = this.config.getOrThrow<number>('IMAP_PORT');
      const secure = this.config.get<boolean>('IMAP_SECURE') ?? port === 993;
      const client = new ImapFlow({
        host: this.config.getOrThrow<string>('IMAP_HOST'),
        port,
        secure,
        auth: {
          user: this.config.getOrThrow<string>('IMAP_USER'),
          pass: this.config.getOrThrow<string>('IMAP_PASSWORD'),
        },
        logger: false,
      });
      this.client = client;
      await client.connect();

      client.on('error', (error) => {
        this.logger.warn(
          { err: error?.message, stack: error?.stack },
          'IMAP connection dropped, will retry',
        );
        if (!this.closing) {
          this.closeClient();
          this.scheduleReconnect();
        }
      });

      await this.poll();
      const interval = this.config.get<number>('IMAP_POLL_INTERVAL_MS') ?? 60000;
      this.pollTimer = setInterval(() => this.poll(), interval);
    } catch (err) {
      this.logger.warn(
        { err: err instanceof Error ? err.message : err },
        `IMAP polling connect failed (attempt ${attempt}/${maxAttempts})`,
      );
      this.closeClient();
      if (!this.closing && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
        return this.bootstrapImap(attempt + 1);
      }
    }
  }

  private scheduleReconnect() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(() => this.bootstrapImap(), 3000);
  }

  private async closeClient() {
    if (!this.client) return;
    try {
      await this.client.close();
    } catch {
      // ignore close errors
    }
    this.client = null;
  }

  async onModuleDestroy() {
    this.closing = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    await this.closeClient();
  }

  private async poll() {
    if (!this.client || this.closing) return;
    const mailbox = this.config.get<string>('IMAP_MAILBOX') ?? 'INBOX';
    try {
      const lock = await this.client.getMailboxLock(mailbox);
      try {
        for await (const message of this.client.fetch(
          { since: new Date(Date.now() - 1000 * 60 * 5), unseen: true } as SearchObject,
          { uid: true, source: true, envelope: true, flags: true },
        )) {
          if (this.closing) break;
          try {
            const raw = message.source;
            if (!raw) continue;
            const parsed: any = await simpleParser(raw);
            const from = formatAddress(parsed.from);
            const subject = parsed.subject ?? '(no subject)';
            const body = parsed.text ?? parsed.html ?? '';

            if (isBounce(from, subject)) {
              await this.client.messageFlagsSet(message.uid, ['\\Seen']);
              continue;
            }

            const dto = {
              from,
              subject,
              body,
              references: parsed.inReplyTo ?? parsed.references,
              inReplyTo: parsed.inReplyTo ?? parsed.messageId,
            };

            const result = await this.chatService.processInboundEmail(dto);
            await this.client.messageFlagsSet(message.uid, ['\\Seen']);
            this.eventsGateway.emitChatNotification({ subject, from, result } as any);
          } catch (e) {
            this.logger.warn(
              { err: e instanceof Error ? e.message : e },
              'IMAP per-message error in email polling',
            );
          }
        }
      } finally {
        lock.release();
      }
    } catch (e) {
      this.logger.warn(
        { err: e instanceof Error ? e.message : e },
        'IMAP mailbox fetch error in email polling',
      );
    }
  }

  async processBullJob() {
    if (!this.imapEnabled) return { skipped: true };
    await this.poll();
    return { polled: true };
  }
}
