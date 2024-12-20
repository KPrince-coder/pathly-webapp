import { createClient } from '@supabase/supabase-js';
import { ZeroKnowledgeEncryption } from './encryption';
import { Buffer } from 'buffer';
import { createGzip } from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipe = promisify(pipeline);

export class BackupSystem {
  private supabase;
  private encryptionKey: Buffer | null = null;

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    private backupBucket: string = 'secure-backups'
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Initializes the backup system with encryption
   */
  async initialize(encryptionPassword: string): Promise<void> {
    this.encryptionKey = await ZeroKnowledgeEncryption.generateKey(encryptionPassword);
    
    // Ensure backup bucket exists
    const { error } = await this.supabase
      .storage
      .createBucket(this.backupBucket, {
        public: false,
        allowedMimeTypes: ['application/gzip'],
        fileSizeLimit: 100 * 1024 * 1024 // 100MB
      });

    if (error && error.message !== 'Bucket already exists') {
      throw error;
    }
  }

  /**
   * Creates a backup of specified tables
   */
  async createBackup(
    workspaceId: string,
    tables: string[],
    options: {
      compress?: boolean;
      encrypt?: boolean;
    } = { compress: true, encrypt: true }
  ): Promise<string> {
    try {
      // Start backup record
      const { data: backup } = await this.supabase
        .from('backups')
        .insert({
          workspace_id: workspaceId,
          status: 'in_progress'
        })
        .select()
        .single();

      if (!backup) throw new Error('Failed to create backup record');

      // Fetch data from specified tables
      const backupData: { [key: string]: any[] } = {};
      for (const table of tables) {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .eq('workspace_id', workspaceId);

        if (error) throw error;
        backupData[table] = data;
      }

      // Convert to JSON
      let backupContent = JSON.stringify(backupData);

      // Encrypt if requested
      if (options.encrypt && this.encryptionKey) {
        backupContent = await ZeroKnowledgeEncryption.encrypt(
          backupContent,
          this.encryptionKey
        );
      }

      // Compress if requested
      let finalContent: Buffer = Buffer.from(backupContent);
      if (options.compress) {
        finalContent = await this.compressData(backupContent);
      }

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${workspaceId}-${timestamp}.gz`;

      // Upload to storage
      const { error: uploadError } = await this.supabase
        .storage
        .from(this.backupBucket)
        .upload(filename, finalContent, {
          contentType: 'application/gzip',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get the URL
      const { data: urlData } = await this.supabase
        .storage
        .from(this.backupBucket)
        .createSignedUrl(filename, 7 * 24 * 60 * 60); // 7 days

      if (!urlData) throw new Error('Failed to generate backup URL');

      // Update backup record
      await this.supabase
        .from('backups')
        .update({
          status: 'completed',
          backup_url: urlData.signedUrl,
          size_bytes: finalContent.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', backup.id);

      return urlData.signedUrl;

    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Restores data from a backup
   */
  async restoreBackup(
    backupUrl: string,
    options: {
      decrypt?: boolean;
      tables?: string[];
    } = { decrypt: true }
  ): Promise<void> {
    try {
      // Download backup
      const response = await fetch(backupUrl);
      if (!response.ok) throw new Error('Failed to download backup');

      // Read and decompress
      let content = await response.text();
      if (response.headers.get('content-type')?.includes('gzip')) {
        content = await this.decompressData(Buffer.from(content));
      }

      // Decrypt if needed
      if (options.decrypt && this.encryptionKey) {
        content = await ZeroKnowledgeEncryption.decrypt(
          content,
          this.encryptionKey.toString('hex')
        );
      }

      // Parse backup data
      const backupData = JSON.parse(content);

      // Restore each table
      for (const [table, data] of Object.entries(backupData)) {
        if (options.tables && !options.tables.includes(table)) continue;

        // Delete existing data
        await this.supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        // Insert backup data
        if (Array.isArray(data) && data.length > 0) {
          const { error } = await this.supabase
            .from(table)
            .insert(data);

          if (error) throw error;
        }
      }

    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  }

  /**
   * Schedules automatic backups
   */
  async scheduleBackups(
    workspaceId: string,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string; // HH:mm format
      retentionDays: number;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('backup_schedules')
      .upsert({
        workspace_id: workspaceId,
        frequency: schedule.frequency,
        time: schedule.time,
        retention_days: schedule.retentionDays,
        next_backup: this.calculateNextBackup(schedule)
      });

    if (error) throw error;
  }

  /**
   * Compresses data using gzip
   */
  private async compressData(data: string): Promise<Buffer> {
    const buffer = Buffer.from(data);
    const gzip = createGzip();
    const chunks: Buffer[] = [];

    gzip.on('data', chunk => chunks.push(chunk));

    await pipe(buffer, gzip);
    return Buffer.concat(chunks);
  }

  /**
   * Decompresses gzipped data
   */
  private async decompressData(compressed: Buffer): Promise<string> {
    // Implementation depends on the platform (Node.js or browser)
    // For browser, you might want to use pako or similar library
    throw new Error('Decompression not implemented for this platform');
  }

  /**
   * Calculates the next backup time based on schedule
   */
  private calculateNextBackup(schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
  }): Date {
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      switch (schedule.frequency) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
      }
    }

    return next;
  }
}

export default BackupSystem;
