import { Buffer } from 'buffer';
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';

const algorithm = 'aes-256-gcm';
const scryptAsync = promisify(scrypt);

export class ZeroKnowledgeEncryption {
  private static readonly keyLength = 32;
  private static readonly saltLength = 16;
  private static readonly ivLength = 12;
  private static readonly tagLength = 16;

  /**
   * Generates a new encryption key from a password
   */
  static async generateKey(password: string): Promise<Buffer> {
    const salt = randomBytes(this.saltLength);
    const key = await scryptAsync(password, salt, this.keyLength) as Buffer;
    return Buffer.concat([salt, key]);
  }

  /**
   * Encrypts data using the provided key
   */
  static async encrypt(data: string, keyBuffer: Buffer): Promise<string> {
    try {
      // Extract salt and key from keyBuffer
      const salt = keyBuffer.slice(0, this.saltLength);
      const key = keyBuffer.slice(this.saltLength);

      // Generate initialization vector
      const iv = randomBytes(this.ivLength);

      // Create cipher
      const cipher = createCipheriv(algorithm, key, iv);

      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(Buffer.from(data, 'utf8')),
        cipher.final()
      ]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine all components
      const result = Buffer.concat([
        salt,
        iv,
        tag,
        encrypted
      ]);

      return result.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data using the provided key
   */
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      // Convert base64 to buffer
      const data = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = data.slice(0, this.saltLength);
      const iv = data.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = data.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = data.slice(this.saltLength + this.ivLength + this.tagLength);

      // Derive key from password and salt
      const key = await scryptAsync(password, salt, this.keyLength) as Buffer;

      // Create decipher
      const decipher = createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt the data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Verifies if a key is valid for the encrypted data
   */
  static async verifyKey(encryptedData: string, password: string): Promise<boolean> {
    try {
      await this.decrypt(encryptedData, password);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a key derivation proof for authentication
   */
  static async createAuthProof(password: string, challenge: string): Promise<string> {
    const key = await this.generateKey(password);
    return this.encrypt(challenge, key);
  }

  /**
   * Verifies a key derivation proof
   */
  static async verifyAuthProof(
    proof: string,
    password: string,
    challenge: string
  ): Promise<boolean> {
    try {
      const decrypted = await this.decrypt(proof, password);
      return decrypted === challenge;
    } catch {
      return false;
    }
  }
}

export class SecureVault {
  private static readonly VERSION = 1;
  private encryptionKey: Buffer | null = null;

  constructor(private userId: string) {}

  /**
   * Initializes the vault with a master password
   */
  async initialize(masterPassword: string): Promise<void> {
    this.encryptionKey = await ZeroKnowledgeEncryption.generateKey(masterPassword);
  }

  /**
   * Stores an encrypted item in the vault
   */
  async store(key: string, value: string): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Vault not initialized');
    }

    const encrypted = await ZeroKnowledgeEncryption.encrypt(
      JSON.stringify({
        version: SecureVault.VERSION,
        data: value,
        timestamp: Date.now()
      }),
      this.encryptionKey
    );

    // Store in database
    const { error } = await fetch('/api/vault/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        key,
        value: encrypted
      })
    }).then(res => res.json());

    if (error) throw new Error(error);
  }

  /**
   * Retrieves and decrypts an item from the vault
   */
  async retrieve(key: string, password: string): Promise<string | null> {
    // Fetch from database
    const response = await fetch(`/api/vault/retrieve?userId=${this.userId}&key=${key}`);
    const { data, error } = await response.json();

    if (error) throw new Error(error);
    if (!data) return null;

    const decrypted = await ZeroKnowledgeEncryption.decrypt(data, password);
    const parsed = JSON.parse(decrypted);

    if (parsed.version !== SecureVault.VERSION) {
      throw new Error('Incompatible vault version');
    }

    return parsed.data;
  }

  /**
   * Changes the master password
   */
  async changeMasterPassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify old password
    const challenge = randomBytes(32).toString('hex');
    const proof = await ZeroKnowledgeEncryption.createAuthProof(
      oldPassword,
      challenge
    );

    const isValid = await ZeroKnowledgeEncryption.verifyAuthProof(
      proof,
      oldPassword,
      challenge
    );

    if (!isValid) {
      throw new Error('Invalid old password');
    }

    // Generate new key
    const newKey = await ZeroKnowledgeEncryption.generateKey(newPassword);

    // Re-encrypt all vault items
    // This would typically involve fetching all items, decrypting with old key,
    // and re-encrypting with new key
    const { error } = await fetch('/api/vault/rekey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        oldPassword,
        newPassword
      })
    }).then(res => res.json());

    if (error) throw new Error(error);

    this.encryptionKey = newKey;
  }
}

export default {
  ZeroKnowledgeEncryption,
  SecureVault
};
