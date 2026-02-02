import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength: number;

  constructor(private configService: ConfigService) {
    const aesKey = this.configService.get<string>('AES_KEY');
    if (!aesKey) {
      throw new Error('AES_KEY is not configured');
    }
    
    this.key = Buffer.from(aesKey, 'base64');
    if (this.key.length !== 32) {
      throw new Error('AES_KEY must be 32 bytes (256 bits) when base64 decoded');
    }
    
    const ivLengthConfig = this.configService.get<string>('AES_IV_LENGTH') || '16';
    this.ivLength = parseInt(ivLengthConfig, 10) || 16;
  }

  encrypt(text: string): { encrypted: string; iv: string } {
    if (!text || typeof text !== 'string') {
      throw new Error('EncryptionService.encrypt: text must be a non-empty string');
    }
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([
      Buffer.from(encrypted, 'base64'),
      authTag,
    ]);

    return {
      encrypted: combined.toString('base64'),
      iv: iv.toString('base64'),
    };
  }

  decrypt(encryptedData: string, iv: string): string {
    try {
      const ivBuffer = Buffer.from(iv, 'base64');
      const encryptedBuffer = Buffer.from(encryptedData, 'base64');

      const authTagLength = 16;
      const encrypted = encryptedBuffer.slice(0, -authTagLength);
      const authTag = encryptedBuffer.slice(-authTagLength);

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, ivBuffer);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt data: ' + error.message);
    }
  }
}
