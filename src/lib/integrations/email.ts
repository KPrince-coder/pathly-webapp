import { google } from 'googleapis';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { ZeroKnowledgeEncryption } from '../encryption';

interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'imap';
  credentials: {
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    imapConfig?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
}

export class EmailIntegration {
  private supabase;
  private encryption;
  private gmailAuth;
  private imapClient;

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    private config: EmailConfig
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.encryption = new ZeroKnowledgeEncryption();

    if (config.provider === 'gmail' && config.credentials.clientId) {
      this.gmailAuth = new google.auth.OAuth2(
        config.credentials.clientId,
        config.credentials.clientSecret
      );
    } else if (config.provider === 'imap' && config.credentials.imapConfig) {
      this.imapClient = new ImapFlow(config.credentials.imapConfig);
    }
  }

  /**
   * Initialize email integration
   */
  async initialize(userId: string): Promise<void> {
    try {
      if (this.config.provider === 'gmail') {
        await this.initializeGmail(userId);
      } else if (this.config.provider === 'imap') {
        await this.initializeImap();
      }

      await this.supabase
        .from('email_integrations')
        .upsert({
          user_id: userId,
          provider: this.config.provider,
          status: 'connected',
          last_sync: new Date().toISOString()
        });

    } catch (error) {
      console.error('Email integration initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Gmail integration
   */
  private async initializeGmail(userId: string): Promise<void> {
    if (this.config.credentials.refreshToken) {
      this.gmailAuth.setCredentials({
        refresh_token: this.config.credentials.refreshToken
      });
    } else {
      throw new Error('Gmail refresh token not provided');
    }
  }

  /**
   * Initialize IMAP integration
   */
  private async initializeImap(): Promise<void> {
    try {
      await this.imapClient.connect();
    } catch (error) {
      console.error('IMAP connection failed:', error);
      throw error;
    }
  }

  /**
   * Sync emails and convert to notes
   */
  async syncEmails(
    userId: string,
    options: {
      folder?: string;
      since?: Date;
      convertToNotes?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const emails = await this.fetchEmails(options);
      
      // Store emails
      for (const email of emails) {
        const encryptedContent = await this.encryption.encrypt(
          JSON.stringify(email),
          this.config.credentials.clientSecret!
        );

        await this.supabase
          .from('emails')
          .upsert({
            user_id: userId,
            message_id: email.messageId,
            subject: email.subject,
            from: email.from,
            date: email.date,
            content: encryptedContent,
            folder: options.folder || 'INBOX'
          });

        // Convert to note if requested
        if (options.convertToNotes) {
          await this.convertEmailToNote(userId, email);
        }
      }

      // Update last sync time
      await this.supabase
        .from('email_integrations')
        .update({
          last_sync: new Date().toISOString()
        })
        .match({ user_id: userId });

    } catch (error) {
      console.error('Email sync failed:', error);
      throw error;
    }
  }

  /**
   * Fetch emails from provider
   */
  private async fetchEmails(options: {
    folder?: string;
    since?: Date;
  } = {}): Promise<any[]> {
    if (this.config.provider === 'gmail') {
      const gmail = google.gmail({ version: 'v1', auth: this.gmailAuth });
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: options.since ? `after:${options.since.getTime() / 1000}` : undefined
      });

      const emails = [];
      for (const message of response.data.messages || []) {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!
        });

        emails.push(this.parseGmailMessage(details.data));
      }

      return emails;

    } else if (this.config.provider === 'imap') {
      const lock = await this.imapClient.getMailboxLock(options.folder || 'INBOX');
      try {
        const messages = [];
        for await (const message of this.imapClient.fetch({
          since: options.since
        }, {
          source: true
        })) {
          const parsed = await simpleParser(message.source);
          messages.push(parsed);
        }
        return messages;
      } finally {
        lock.release();
      }
    }

    return [];
  }

  /**
   * Parse Gmail message into standardized format
   */
  private parseGmailMessage(message: any): any {
    const headers = message.payload.headers;
    return {
      messageId: message.id,
      subject: headers.find((h: any) => h.name === 'Subject')?.value,
      from: headers.find((h: any) => h.name === 'From')?.value,
      date: headers.find((h: any) => h.name === 'Date')?.value,
      content: this.decodeGmailContent(message.payload)
    };
  }

  /**
   * Decode Gmail message content
   */
  private decodeGmailContent(payload: any): string {
    if (payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      return payload.parts
        .filter((part: any) => part.mimeType === 'text/plain')
        .map((part: any) => Buffer.from(part.body.data, 'base64').toString())
        .join('\n');
    }

    return '';
  }

  /**
   * Convert email to note
   */
  private async convertEmailToNote(
    userId: string,
    email: any
  ): Promise<void> {
    const note = {
      user_id: userId,
      title: email.subject || 'Untitled Email',
      content: `
From: ${email.from}
Date: ${email.date}
Subject: ${email.subject}

${email.content}
      `.trim(),
      source: {
        type: 'email',
        messageId: email.messageId
      },
      tags: ['email']
    };

    await this.supabase
      .from('notes')
      .insert(note);
  }

  /**
   * Send email
   */
  async sendEmail(
    userId: string,
    email: {
      to: string;
      subject: string;
      content: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>;
    }
  ): Promise<void> {
    if (this.config.provider === 'gmail') {
      const gmail = google.gmail({ version: 'v1', auth: this.gmailAuth });
      
      const message = [
        'Content-Type: text/plain; charset="UTF-8"\n',
        'MIME-Version: 1.0\n',
        'Content-Transfer-Encoding: 7bit\n',
        `To: ${email.to}\n`,
        `Subject: ${email.subject}\n\n`,
        email.content
      ].join('');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
    } else if (this.config.provider === 'imap') {
      // IMAP doesn't support sending emails
      throw new Error('Sending emails not supported with IMAP');
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.imapClient) {
      await this.imapClient.logout();
    }
  }
}

export default EmailIntegration;
